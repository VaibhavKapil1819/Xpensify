export interface IConfirmDialogProps {
  title: string;
  subTitle?: string;
  description: string;
  show: boolean;
  okLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  onOpenChange?: (state: boolean) => void;
  okClass?: string;
  titleClass?: string;
}
