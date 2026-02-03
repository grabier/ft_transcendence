import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useNotification } from "./NotificationContext";

// Definimos la forma de nuestro usuario (copiado de Header)
interface UserPayload {
	id: number;
	username: string;
	email: string;
}

// Definimos qué funciones y datos "regalamos" al resto de la app
interface AuthContextType {
	user: UserPayload | null;
	isLoading: boolean; // Para mostrar spinners si quieres
	login: (email: string, pass: string) => Promise<boolean>; // Devuelve true si fue bien
	register: (username: string, email: string, pass: string) => Promise<boolean>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context)
		throw new Error("useAuth must be used within an AuthProvider");
	return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const { notifySuccess, notifyError } = useNotification();
	const [user, setUser] = useState<UserPayload | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Referencia para el polling
	const lastTokenRef = useRef<string | null>(null);

	// --- 1. FUNCIÓN LOGIN ---
	const login = async (email: string, pass: string): Promise<boolean> => {
		setIsLoading(true);
		try {
			const response = await fetch('http://localhost:3000/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password: pass })
			});
			const data = await response.json();

			if (!response.ok) throw new Error(data.message || data.error || 'Credential error');

			// Guardar token y decodificar
			localStorage.setItem('auth_token', data.token);
			const decoded = jwtDecode<UserPayload>(data.token);
			setUser(decoded);
			lastTokenRef.current = data.token;

			notifySuccess(`¡Welcome back, ${decoded.username}!`);
			return true;
		} catch (error: any) {
			notifyError(error.message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// --- 2. FUNCIÓN REGISTER ---
	const register = async (username: string, email: string, pass: string): Promise<boolean> => {
		setIsLoading(true);
		try {
			const response = await fetch('http://localhost:3000/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password: pass })
			});

			if (response.status === 409) {
				notifyError("User or email already exists");
				return false;
			}
			if (!response.ok) throw new Error("Register error");

			notifySuccess("Account created! Please log in.");
			return true;
		} catch (error: any) {
			notifyError(error.message);
			return false;
		} finally {
			setIsLoading(false);
		}
	};

	// --- 3. FUNCIÓN LOGOUT ---
	const logout = () => {
		const token = localStorage.getItem('auth_token');
		if (token) {
			// Avisar al back (fire and forget)
			fetch('http://localhost:3000/api/auth/logout', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` }
			}).catch(console.error);
		}

		localStorage.removeItem('auth_token');
		setUser(null);
		lastTokenRef.current = null;
		notifySuccess("Logged out successfully");
	};

	// --- 4. POLLING Y PERSISTENCIA (El useEffect complejo del Header) ---
	useEffect(() => {
		const checkToken = () => {
			const currentToken = localStorage.getItem('auth_token');

			// Si el token cambió (login desde otra pestaña, o expiró)
			if (currentToken !== lastTokenRef.current) {
				lastTokenRef.current = currentToken;

				if (currentToken) {
					try {
						const decoded = jwtDecode<UserPayload>(currentToken);
						setUser(decoded);
						// Validar con back
						fetch('http://localhost:3000/api/user/persistence', {
							headers: { 'Authorization': `Bearer ${currentToken}` }
						}).catch(() => {
							// Si falla, limpiar
							localStorage.removeItem('auth_token');
							setUser(null);
						});
					} catch (e) {
						localStorage.removeItem('auth_token');
						setUser(null);
					}
				} else {
					setUser(null);
				}
			}
		};

		checkToken(); // Check inicial
		const interval = setInterval(checkToken, 500); // Polling
		return () => clearInterval(interval);
	}, []);

	return (
		<AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
};