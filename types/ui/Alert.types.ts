export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertButton {
    text: string;
    onPress?: () => void;
    style?: "default" | "cancel" | "destructive";
}

export interface Alert {
    id?: string;
    title: string;
    message?: string;
    variant?: AlertVariant;
    duration?: number;
    dismissible?: boolean;
    buttons?: AlertButton[];
}
