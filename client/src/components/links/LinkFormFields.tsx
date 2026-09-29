import { Link } from "react-router-dom";
import type { FieldErrors } from "../../lib/errors";
import type { LinkFormValues } from "../../schemas/links";
import { TextField } from "../ui/TextField";

/** Mirrors server FREE_CUSTOM_ALIAS_LIMIT (billing/plan.ts). */
export const FREE_ALIAS_LIMIT = 5;

interface LinkFormFieldsProps {
  values: LinkFormValues;
  errors: FieldErrors;
  disabled?: boolean;
  /** Hide custom alias (edit mode — backend update schema doesn't accept it). */
  hideAlias?: boolean;
  /** Effective plan of the current user — drives the alias hint/upsell. */
  plan?: "free" | "premium";
  /** How many custom aliases the user holds; shown on the free plan. */
  aliasUsed?: number;
  /** `null` = no quota at all (premium or admin) — suppresses the hint. */
  aliasLimit?: number | null;
  onChange: (patch: Partial<LinkFormValues>) => void;
}

export function LinkFormFields({
  values,
  errors,
  disabled = false,
  hideAlias = false,
  plan = "free",
  aliasUsed,
  aliasLimit = FREE_ALIAS_LIMIT,
  onChange,
}: LinkFormFieldsProps) {
  const limited = plan === "free" && aliasLimit !== null;
  const freeWithRoom =
    !limited || aliasUsed === undefined || aliasUsed < aliasLimit;

  return (
    <>
      <TextField
        label="Original URL"
        type="url"
        name="originalUrl"
        placeholder="https://example.com/very/long/link"
        autoComplete="off"
        spellCheck={false}
        value={values.originalUrl}
        onChange={(e) => onChange({ originalUrl: e.target.value })}
        error={errors.originalUrl}
        disabled={disabled}
        required
      />
      {!hideAlias ? (
        <TextField
          label="Custom alias (optional)"
          type="text"
          name="customAlias"
          placeholder="my-link"
          autoComplete="off"
          spellCheck={false}
          value={values.customAlias}
          onChange={(e) => onChange({ customAlias: e.target.value })}
          error={errors.customAlias}
          disabled={disabled}
          maxLength={32}
        />
      ) : null}
      <TextField
        label="Expiry (optional)"
        type="datetime-local"
        name="expiresAt"
        value={values.expiresAt}
        onChange={(e) => onChange({ expiresAt: e.target.value })}
        error={errors.expiresAt}
        disabled={disabled}
      />
      {!hideAlias ? (
        <p className="text-xs text-slate-500">
          Alias: 3–32 chars, letters, digits, <code>-</code> or{" "}
          <code>_</code>. Leave blank for a random code.
          {limited ? (
            <>
              {" "}
              Free plan:{" "}
              {aliasUsed === undefined
                ? `${aliasLimit} custom aliases`
                : `${aliasUsed}/${aliasLimit} used`}
              .
              {freeWithRoom ? null : (
                <>
                  {" "}
                  <Link
                    to="/pricing"
                    className="font-medium text-indigo-600 underline-offset-2 hover:underline"
                  >
                    Upgrade to Premium
                  </Link>{" "}
                  for unlimited.
                </>
              )}
            </>
          ) : null}
        </p>
      ) : null}
    </>
  );
}
