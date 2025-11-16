import { Alert } from "@/types/ui/Alert.types";
import { create } from "zustand";

interface State {
    alerts: Alert[];
    addAlert: (alert: Alert) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
}

export const useAlertStore = create<State>((set) => ({
    alerts: [],

    addAlert: (alert: Alert) => {
        const id = alert.id || crypto.randomUUID();
        const newAlert: Alert = { 
            ...alert, 
            id,
            variant: alert.variant || "info",
            duration: alert.duration || 5000,
            dismissible: alert.dismissible ?? true
        };

        set((state) => ({ alerts: [...state.alerts, newAlert] }));

        if (newAlert.duration && newAlert.duration > 0) {
            setTimeout(() => {
                set((state) => ({
                    alerts: state.alerts.filter((a) => a.id !== id)
                }));
            }, newAlert.duration);
        }

        return id;
    },

    removeAlert: (id: string) => {
        set((state) => ({
            alerts: state.alerts.filter((alert) => alert.id !== id)
        }));
    },

    clearAlerts: () => {
        set({ alerts: [] });
    }
}));