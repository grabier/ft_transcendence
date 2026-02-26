import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import Notification, { NotificationType } from "@/components/ui/Notification"; 

interface NotificationContextType {
    notifySuccess: (message: string) => void;
    notifyError: (message: string) => void;
    notifyInfo: (message: string) => void;
    notifyWarning: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
	
    const [notification, setNotification] = useState<{
        open: boolean;
        message: string;
        type: NotificationType;
    }>({
        open: false,
        message: "",
        type: "info"
    });
    const notifySuccess = useCallback((message: string) => {
        setNotification({ open: true, message, type: "success" });
    }, []);

    const notifyError = useCallback((message: string) => {
        setNotification({ open: true, message, type: "error" });
    }, []);

    const notifyInfo = useCallback((message: string) => {
        setNotification({ open: true, message, type: "info" });
    }, []);

    const notifyWarning = useCallback((message: string) => {
        setNotification({ open: true, message, type: "warning" });
    }, []);
    const handleClose = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    return (
        <NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo, notifyWarning }}>
            {children}
            <Notification 
                open={notification.open} 
                message={notification.message} 
                type={notification.type}
                onClose={handleClose} 
            />

        </NotificationContext.Provider>
    );
};