export interface InfoDialogProps {
  title: string;
  description?: string;
  open: boolean;
  closeLabel?: string;
  onClose?: (open: boolean) => void;
}
