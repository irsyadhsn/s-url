import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { parseError } from "../../lib/errors";
import { linksService } from "../../services/links.service";
import type { Link } from "../../services/types";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface DeleteLinkDialogProps {
  link: Link;
  onClose(): void;
  onDeleted(): void;
}

export function DeleteLinkDialog({
  link,
  onClose,
  onDeleted,
}: DeleteLinkDialogProps) {
  const toast = useToast();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await linksService.remove(link.id);
      toast.success("Link deleted");
      onDeleted();
      onClose();
    } catch (err) {
      const { message } = parseError(err);
      toast.error(message ?? "Could not delete link");
      setDeleting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete link?"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">
        <p>
          <code className="font-mono text-slate-900">/{link.shortCode}</code>{" "}
          will stop redirecting immediately. This cannot be undone.
        </p>
        <p className="mt-2 break-all text-slate-500">{link.originalUrl}</p>
      </div>
    </Modal>
  );
}
