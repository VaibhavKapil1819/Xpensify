import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { IConfirmDialogProps } from "./confirm-dialog-model";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function ConfirmDialog({
  title,
  subTitle,
  description,
  onCancel,
  onConfirm,
  onOpenChange,
  show,
  cancelLabel = "CANCEL",
  okLabel = "CONFIRM",
  okClass,
  titleClass,
}: IConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(show);
  }, [show]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(state: boolean) => {
        setOpen(state);
        if (onOpenChange) onOpenChange(state);
      }}
    >
      <AlertDialogContent>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="absolute right-3 top-2.5 size-[30px]"
        >
          {/* <FontAwesomeIcon icon={"faXmark"} className="size-6 text-ltblue-600" /> */}
        </Button>
        <AlertDialogHeader>
          <AlertDialogTitle
            className={cn("text-slate-900 text-lg font-semibold", titleClass)}
          >
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {subTitle && (
              <span
                className={cn("font-bold my-2 text-base text-dkblue-400 block")}
              >
                {subTitle}
              </span>
            )}
            <span className={cn("text-base font-normal text-dkblue-400 block")}>
              {description}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel className="py-2.5" onClick={onCancel}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn("py-2.5", okClass)}
            onClick={onConfirm}
          >
            {okLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
