export type ToastVariant = 'default' | 'success' | 'danger' | 'info' | 'warning';

export interface ToastAction {
  label: string; // e.g. "UNDO", "RETRY"
  onPress: () => void; // called when the action button is tapped
}

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant; // defaults to 'default'
  duration?: number; // ms; 0 = sticky; default 4000
  action?: ToastAction; // optional right-side action button
}
