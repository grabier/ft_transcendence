import { createContext, useContext, useState, ReactNode, useCallback } from "react";
// 1. Importamos nuestro nuevo componente genérico y su tipo
import Notification, { NotificationType } from "@/components/ui/Notification";

interface NotificationContextType {
	notifySuccess: (message: string) => void;
	notifyError: (message: string) => void;
	// 2. Añadimos soporte para info y warning
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

	// 3. ESTADO UNIFICADO: Un solo objeto controla qué se muestra y cómo
	const [notification, setNotification] = useState<{
		open: boolean;
		message: string;
		type: NotificationType;
	}>({
		open: false,
		message: "",
		type: "info" // Valor por defecto
	});

	// 4. FUNCIONES: Todas actualizan el mismo estado, solo cambian el 'type'
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

	// 5. Cierre unificado
	const handleClose = () => {
		setNotification(prev => ({ ...prev, open: false }));
	};

	return (
		<NotificationContext.Provider value={{ notifySuccess, notifyError, notifyInfo, notifyWarning }}>
			{children}

			{/* 6. RENDERIZADO GLOBAL: Un solo componente súper limpio */}
			<Notification
				open={notification.open}
				message={notification.message}
				type={notification.type}
				onClose={handleClose}
			/>

		</NotificationContext.Provider>
	);
};