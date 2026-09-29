import { hasPgErrorCode } from "../../db/errors.js";
import { env } from "../../config/env.js";
import * as redirectCache from "../redirect/redirect.cache.js";
import { flushForRead } from "../redirect/redirect.service.js";
import { ApiError } from "../../utils/errors.js";
import { generateShortCode } from "../../utils/shortCode.js";
import {
  FREE_CUSTOM_ALIAS_LIMIT,
  effectivePlan,
} from "../billing/plan.js";
import * as userRepo from "../auth/auth.repository.js";
import type { CreateLinkBody, UpdateLinkBody } from "./links.schemas.js";
import * as linkRepo from "./links.repository.js";
import type { Url } from "../../db/schema.js";

const PG_UNIQUE_VIOLATION = "23505";
const MAX_GENERATED_CODE_ATTEMPTS = 3;

/**
 * Free accounts may hold FREE_CUSTOM_ALIAS_LIMIT links with a chosen
 * alias at once; Premium is unlimited. Checked on create only — aliases
 * already in use keep working if a plan later lapses. Reads the plan from
 * the DB so an expired premium row (effectivePlan) is gated immediately.
 * Admins are exempt: they never see an upgrade wall.
 */
async function assertAliasQuota(userId: string): Promise<void> {
  const user = await userRepo.findById(userId);
  if (!user) {
    throw ApiError.unauthorized("Account no longer exists");
  }
  if (user.role === "admin") return;
  if (effectivePlan(user) === "premium") return;

  const used = await linkRepo.countCustomAliases(userId);
  if (used >= FREE_CUSTOM_ALIAS_LIMIT) {
    throw ApiError.paymentRequired(
      `The free plan allows ${FREE_CUSTOM_ALIAS_LIMIT} custom aliases. Upgrade to Premium for unlimited.`,
      "ALIAS_LIMIT_REACHED",
    );
  }
}

function withShortUrl<T extends { shortCode: string }>(link: T) {
  return { ...link, shortUrl: `${env.SHORT_URL_BASE}/${link.shortCode}` };
}

/**
 * 409 for a taken alias, enriched with who holds it and whether it has
 * lapsed — the client turns this into "edit your link instead" vs
 * "reserved by an expired link, pick another".
 */
function aliasConflict(expired: boolean, ownedByYou: boolean): ApiError {
  const message = ownedByYou
    ? "You already use this alias on one of your links — edit or delete that link first."
    : expired
      ? "This alias is reserved by an expired link; only its owner can reuse it. Choose another."
      : "Alias already in use";
  return ApiError.conflict(message, "ALIAS_TAKEN", { expired, ownedByYou });
}

function isExpiredRow(row: Url): boolean {
  return row.expiresAt !== null && row.expiresAt.getTime() <= Date.now();
}

export async function createLink(userId: string, input: CreateLinkBody) {
  const payload = {
    originalUrl: input.originalUrl,
    userId,
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
  };

  if (input.customAlias) {
    // Max 2 passes: a 23505 on insert means a winner row appeared between
    // our find and the insert — the second pass classifies it instead of
    // blindly conflicting. Same for a revive whose row vanished mid-race.
    for (let attempt = 0; attempt < 2; attempt++) {
      const existing = await linkRepo.findByShortCode(input.customAlias);

      if (!existing) {
        await assertAliasQuota(userId);
        try {
          const link = await linkRepo.create({
            ...payload,
            shortCode: input.customAlias,
            isCustomAlias: true,
          });
          return withShortUrl(link);
        } catch (err) {
          if (hasPgErrorCode(err, PG_UNIQUE_VIOLATION)) {
            continue;
          }
          throw err;
        }
      }

      const expired = isExpiredRow(existing);
      const ownedByYou = existing.userId === userId;

      if (!expired || !ownedByYou) {
        throw aliasConflict(expired, ownedByYou);
      }

      // Revive: same row (id, clicks, click_daily history preserved), new
      // target/expiry. Counting is unchanged when it was already a custom
      // alias; flipping a *generated* code to custom adds to the quota.
      if (!existing.isCustomAlias) {
        await assertAliasQuota(userId);
      }
      const revived = await linkRepo.update(existing.id, userId, {
        originalUrl: input.originalUrl,
        expiresAt: input.expiresAt ?? null,
        isCustomAlias: true,
      });
      if (revived) {
        // Stale cache would keep serving the old target (or a lapsed
        // expiry) for up to 24h — drop it so the next resolve reads PG.
        await redirectCache.del(revived.shortCode);
        return withShortUrl(revived);
      }
      // Row deleted between find and update — loop to re-classify.
    }
    throw aliasConflict(false, false);
  }

  for (let attempt = 0; attempt < MAX_GENERATED_CODE_ATTEMPTS; attempt++) {
    try {
      const link = await linkRepo.create({
        ...payload,
        shortCode: generateShortCode(),
      });
      return withShortUrl(link);
    } catch (err) {
      if (!hasPgErrorCode(err, PG_UNIQUE_VIOLATION)) {
        throw err;
      }
    }
  }

  throw ApiError.conflict("Could not generate a unique code", "CODE_EXHAUSTED");
}

export async function listLinks(
  userId: string,
  page: number,
  pageSize: number,
) {
  // Pull Redis pending clicks into PG first so the list is near-real-time.
  await flushForRead();

  const { items, total } = await linkRepo.listByUserId(
    userId,
    (page - 1) * pageSize,
    pageSize,
  );

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

  return {
    items: items.map(withShortUrl),
    meta: {
      page,
      pageSize,
      totalItems: total,
      totalPages,
      hasNext: page < totalPages,
    },
  };
}

export async function updateLink(
  userId: string,
  linkId: string,
  input: UpdateLinkBody,
) {
  const existing = await linkRepo.findOwnedById(linkId, userId);
  if (!existing) {
    throw ApiError.notFound("Link not found");
  }

  const updated = await linkRepo.update(linkId, userId, {
    originalUrl: input.originalUrl,
    expiresAt: input.expiresAt ?? null,
  });

  await redirectCache.del(existing.shortCode);

  return withShortUrl(updated!);
}

export async function deleteLink(userId: string, linkId: string): Promise<void> {
  const existing = await linkRepo.findOwnedById(linkId, userId);
  if (!existing) {
    throw ApiError.notFound("Link not found");
  }

  await linkRepo.remove(linkId, userId);
  await redirectCache.del(existing.shortCode);
}
