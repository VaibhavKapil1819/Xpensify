import { buttonClassName } from "@/models/constants";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { InfoDialogProps } from "./info-dialog-model";

export default function InfoDialog({
  title,
  description,
  onClose,
  closeLabel = "Close",
  open,
}: InfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            role="button"
            className=" inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none "
          >
            {/* <Button type="button" variant="default"> */}
            <Button className={buttonClassName}>{closeLabel}</Button>
            {/* </Button> */}
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
