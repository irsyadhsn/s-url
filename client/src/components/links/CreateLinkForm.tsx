import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { parseError, type FieldErrors } from "../../lib/errors";
import {
  createLinkPayloadSchema,
  emptyLinkForm,
  toCreatePayload,
  type LinkFormValues,
} from "../../schemas/links";
import { billingService } from "../../services/billing.service";
import { linksService } from "../../services/links.service";
import { Button } from "../ui/Button";
import { FREE_ALIAS_LIMIT, LinkFormFields } from "./LinkFormFields";

interface CreateLinkFormProps {
  /** Called after the API accepts the new link (parent refreshes the list). */
  onCreated(): void;
}

export function CreateLinkForm({ onCreated }: CreateLinkFormProps) {
  const toast = useToast();
  const [values, setValues] = useState<LinkFormValues>(emptyLinkForm);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium">("free");
  const [aliasUsed, setAliasUsed] = useState<number | undefined>(undefined);
  /** `null` = unlimited (premium or admin) — no quota hint, no upsell. */
  const [aliasLimit, setAliasLimit] = useState<number | null>(FREE_ALIAS_LIMIT);

  // Drives the "3/5 used" hint + the upgrade link. Best-effort: on failure
  // we simply fall back to the plain free-plan wording.
  useEffect(() => {
    const controller = new AbortController();
    billingService
      .subscription(controller.signal)
      .then(({ subscription }) => {
        setPlan(subscription.plan);
        setAliasUsed(subscription.customAliasUsed);
        setAliasLimit(subscription.customAliasLimit);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function refreshQuota() {
    billingService
      .subscription()
      .then(({ subscription }) => {
        setAliasUsed(subscription.customAliasUsed);
        setAliasLimit(subscription.customAliasLimit);
      })
      .catch(() => undefined);
  }

  function handleChange(patch: Partial<LinkFormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setErrors({});

    const parsed = createLinkPayloadSchema.safeParse(toCreatePayload(values));
    if (!parsed.success) {
      setErrors(parseError(parsed.error).fields);
      return;
    }

    setSubmitting(true);
    try {
      await linksService.create(parsed.data);
      toast.success("Link created");
      setValues(emptyLinkForm());
      refreshQuota();
      onCreated();
    } catch (err) {
      const { fields, message } = parseError(err);
      if (Object.keys(fields).length > 0) {
        setErrors(fields);
        // A customAlias error may mean the quota just filled (402) —
        // re-read the counter so the hint and upsell reflect reality.
        if (fields.customAlias) refreshQuota();
      } else {
        toast.error(message ?? "Could not create link");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Create short link"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            New short link
          </h2>
          <p className="text-xs text-slate-500">Shorten a URL in seconds.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-4">
        <LinkFormFields
          values={values}
          errors={errors}
          disabled={submitting}
          plan={plan}
          aliasUsed={aliasUsed}
          aliasLimit={aliasLimit}
          onChange={handleChange}
        />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={submitting}>
            Shorten
          </Button>
          {plan === "free" &&
          aliasLimit !== null &&
          values.customAlias.trim() !== "" &&
          aliasUsed !== undefined &&
          aliasUsed >= aliasLimit ? (
            <Link
              to="/pricing"
              className="text-xs font-medium text-indigo-600 underline-offset-2 hover:underline"
            >
              Alias limit reached — upgrade
            </Link>
          ) : null}
        </div>
      </div>
    </form>
  );
}
