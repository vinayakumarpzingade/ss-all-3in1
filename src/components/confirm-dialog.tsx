import { useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

export function ConfirmDialog({
  trigger,
  title,
  description,
  details,
  confirmLabel = "Confirm",
  requireTyping,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  details?: ReactNode;
  confirmLabel?: string;
  /** When set, the exact word must be typed before confirming (e.g. "DELETE"). */
  requireTyping?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const blocked = !!requireTyping && typed.trim() !== requireTyping;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setTyped("");
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        {details ? <div className="rounded-lg border border-border p-3 text-sm">{details}</div> : null}
        {requireTyping ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Type <span className="font-mono font-semibold">{requireTyping}</span> to continue.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={blocked}
            onClick={async (event) => {
              if (blocked) {
                event.preventDefault();
                return;
              }
              await onConfirm();
            }}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
