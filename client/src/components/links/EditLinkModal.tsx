import { useState, type FormEvent } from "react";
import { useToast } from "../../hooks/useToast";
import { toDatetimeLocal } from "../../lib/datetime";
import { parseError, type FieldErrors } from "../../lib/errors";
import {
  toUpdatePayload,
  updateLinkPayloadSchema,
  type LinkFormValues,
} from "../../schemas/links";
import { linksService } from "../../services/links.service";
import type { Link } from "../../services/types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { LinkFormFields } from "./LinkFormFields";

interface EditLinkModalProps {
  link: Link;
  onClose(): void;
  onUpdated(): void;
}

/**
 * Edit modal — backend PUT accepts only originalUrl and expiresAt
 * (alias is immutable), so the alias field is hidden here.
 * Modal keeps the list visible/stable while editing a row.
 */
export function EditLinkModal({ link, onClose, onUpdated }: EditLinkModalProps) {
  const toast = useToast();
  const [values, setValues] = useState<LinkFormValues>(() => ({
    originalUrl: link.originalUrl,
    customAlias: "",
    expiresAt: toDatetimeLocal(link.expiresAt),
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

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

    const parsed = updateLinkPayloadSchema.safeParse(toUpdatePayload(values));
    if (!parsed.success) {
      setErrors(parseError(parsed.error).fields);
      return;
    }

    setSubmitting(true);
    try {
      await linksService.update(link.id, parsed.data);
      toast.success("Link updated");
      onUpdated();
      onClose();
    } catch (err) {
      const { fields, message } = parseError(err);
      if (Object.keys(fields).length > 0) {
        setErrors(fields);
      } else {
        toast.error(message ?? "Could not update link");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit link"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" form="edit-link-form" loading={submitting}>
            Save changes
          </Button>
        </>
      }
    >
      <p className="mb-4 truncate text-sm text-slate-500" title={`/${link.shortCode}`}>
        Short code: <code className="font-mono">/{link.shortCode}</code>
      </p>
      <form
        id="edit-link-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <LinkFormFields
          values={values}
          errors={errors}
          disabled={submitting}
          hideAlias
          onChange={handleChange}
        />
        <p className="text-xs text-slate-500">
          Leave expiry empty to keep the link active indefinitely.
        </p>
      </form>
    </Modal>
  );
}
