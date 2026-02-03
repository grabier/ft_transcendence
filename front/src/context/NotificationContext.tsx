import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert } from "@mui/material";
import AuthErrorNotification from "../components/AuthErrorNotification";

// Definimos qué funciones "regalamos" al resto de la app
interface NotificationContextType {
    notifySuccess: (message: string) => void;
    notifyError: (message: string) => void;
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
    // --- ESTADOS (Movidos desde Header.tsx) ---
    const [successMsg, setSuccessMsg] = useState({ open: false, message: "" });
    const [errorMsg, setErrorMsg] = useState({ open: false, message: "" });

    // --- FUNCIONES (Simplificadas) ---
    const notifySuccess = (message: string) => {
        setSuccessMsg({ open: true, message });
    };

    const notifyError = (message: string) => {
        setErrorMsg({ open: true, message });
    };

    const handleCloseSuccess = () => setSuccessMsg({ ...successMsg, open: false });
    const handleCloseError = () => setErrorMsg({ ...errorMsg, open: false });

    return (
        <NotificationContext.Provider value={{ notifySuccess, notifyError }}>
            {children}

            {/* --- RENDERIZADO GLOBAL DE ALERTAS --- */}
            
            {/* 1. Alerta Verde (Snackbar estándar) */}
            <Snackbar 
                open={successMsg.open} 
                autoHideDuration={4000} 
                onClose={handleCloseSuccess} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%', fontWeight: 'bold' }}>
                    {successMsg.message}
                </Alert>
            </Snackbar>

            {/* 2. Alerta Roja (Tu componente personalizado) */}
            <AuthErrorNotification 
                open={errorMsg.open} 
                message={errorMsg.message} 
                onClose={handleCloseError} 
            />

        </NotificationContext.Provider>
    );
};