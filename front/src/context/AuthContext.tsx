import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { useNotification } from "./NotificationContext";
import { useSearchParams } from "react-router-dom";
import { BASE_URL} from "../../src/config"
// Definimos la forma de nuestro usuario
interface UserPayload {
	id: number;
	username: string;
	email: string;
	avatarUrl: string;
	is_two_factor_enabled: boolean;
}

interface AuthContextType {
	user: UserPayload | null;
	isLoading: boolean;
	login: (email: string, pass: string) => Promise<boolean>;
	register: (username: string, email: string, pass: string) => Promise<boolean>;
	logout: () => void;
	updateUsername: (newUsername: string) => Promise<boolean>;
	updateAvatarUrl: (newAvatarUrl: string) => Promise<boolean>;
	generate2FA: () => Promise<string | null>;
	verify2FA: (code: string) => Promise<boolean>;
	disable2FA: () => Promise<boolean>;
	uploadAvatarFile: (file: File) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const { notifySuccess, notifyError } = useNotification();
	const [searchParams, setSearchParams] = useSearchParams();

	// OAuth Error Handler
	const errorType = searchParams.get("error");
	useEffect(() => {
		if (errorType) {
			const message = errorType === "user_exists"
				? "Email already registered"
				: "External auth error";
			notifyError(message);
			setSearchParams({}, { replace: true });
		}
	}, [errorType, setSearchParams, notifyError]);

	const [user, setUser] = useState<UserPayload | null>(null);
	//const [avatarUrl, setAvatarUrl] = useState<UserPayload | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const lastTokenRef = useRef<string | null>(null);

	// --- 1. FUNCIÓN LOGIN ---
	const login = async (email: string, pass: string): Promise<boolean> => {
		setIsLoading(true);
		try {
			const response = await fetch(`${BASE_URL}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password: pass })
			});
			const data = await response.json();

			if (!response.ok) throw new Error(data.message || data.error || 'Credential error');

			localStorage.setItem('auth_token', data.token);
			const decoded = jwtDecode<UserPayload>(data.token);
			setUser(decoded);
			lastTokenRef.current = data.token;
			console.log(`use auth   : ${user?.avatarUrl}`);

			notifySuccess(`Welcome back, ${decoded.username}`);
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
			const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'Guest'}`;

			const response = await fetch(`${BASE_URL}/api/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password: pass, avatarUrl: defaultAvatar })
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
			fetch(`${BASE_URL}/api/auth/logout`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${token}` }
			}).catch(console.error);
		}

		localStorage.removeItem('auth_token');
		setUser(null);
		lastTokenRef.current = null;
		notifySuccess("Logged out successfully");
	};

	// --- 4. POLLING Y PERSISTENCIA ---
	useEffect(() => {
		const checkToken = () => {
			const currentToken = localStorage.getItem('auth_token');

			if (currentToken !== lastTokenRef.current) {
				lastTokenRef.current = currentToken;

				if (currentToken) {
					try {
						const decoded = jwtDecode<UserPayload>(currentToken);
						setUser(decoded);
						fetch(`${BASE_URL}/api/user/persistence`, {
							headers: { 'Authorization': `Bearer ${currentToken}` }
						}).catch(() => {
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
		checkToken();
		const interval = setInterval(checkToken, 500);
		return () => clearInterval(interval);
	}, []);

	// --- OTROS MÉTODOS (Update, 2FA...) ---
	const updateUsername = async (newUsername: string): Promise<boolean> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;

		try {
			const response = await fetch(`${BASE_URL}/api/user/update-username`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ newUsername })
			});

			const data = await response.json();
			if (!response.ok) {
				notifyError(data.error || "Update failed");
				return false;
			}

			if (data.token) {
				lastTokenRef.current = data.token;
				localStorage.setItem('auth_token', data.token);
			}
			setUser(prev => prev ? { ...prev, username: newUsername } : null);
			notifySuccess("Username updated successfully!");
			return true;
		} catch (error: any) {
			notifyError("Server connection error");
			return false;
		}
	};

	const updateAvatarUrl = async (newUrl: string): Promise<boolean> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;

		try {
			const response = await fetch(`${BASE_URL}/api/user/update-avatarUrl`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ newUrl })
			});

			const data = await response.json();
			if (!response.ok) {
				notifyError(data.error || "Update failed");
				return false;
			}

			if (data.token) {
				lastTokenRef.current = data.token;
				localStorage.setItem('auth_token', data.token);
			}
			setUser(prev => prev ? { ...prev, avatarUrl: newUrl } : null);
			notifySuccess("Avatar updated successfully!");
			return true;
		} catch (error: any) {
			notifyError("Server connection error");
			return false;
		}
	};

	const uploadAvatarFile = async (file: File): Promise<boolean> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;

		// FormData es clave para enviar archivos
		const formData = new FormData();
		formData.append('avatar', file);

		try {
			const response = await fetch(`${BASE_URL}/api/user/upload-avatar`, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`
					// NO poner 'Content-Type': 'multipart/form-data'.
					// El navegador lo pone automático con el boundary correcto.
				},
				body: formData
			});

			const data = await response.json();
			if (!response.ok) throw new Error(data.error);

			// Actualizamos estado local (User Payload)
			setUser(prev => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
			notifySuccess("Avatar uploaded!");
			return true;
		} catch (error: any) {
			notifyError(error.message || "Upload failed");
			return false;
		}
	};

	const generate2FA = async (): Promise<string | null> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return null;

		try {
			const response = await fetch(`${BASE_URL}/api/auth/2fa/generate`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({})
			});
			const data = await response.json();
			if (!response.ok) {
				notifyError(data.error || "2FA Generation failed");
				return null;
			}
			return data.qrCodeImage;
		} catch (error: any) {
			notifyError("Server connection error");
			return null;
		}
	};

	const verify2FA = async (code: string): Promise<boolean> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;
		try {
			const response = await fetch(`${BASE_URL}/api/auth/2fa/turn-on`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ code })
			});

			if (!response.ok) {
				notifyError("Invalid Code");
				return false;
			}
			setUser(prev => prev ? { ...prev, is_two_factor_enabled: true } : null);
			notifySuccess("2FA Enabled Successfully!");
			return true;
		} catch (error) {
			notifyError("Verification failed");
			return false;
		}
	};

	const disable2FA = async (): Promise<boolean> => {
		const token = localStorage.getItem('auth_token');
		if (!token) return false;

		try {
			const response = await fetch(`${BASE_URL}/api/auth/2fa/turn-off`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({})
			});

			if (!response.ok) throw new Error("Error disabling 2FA");

			setUser(prev => prev ? { ...prev, is_two_factor_enabled: false } : null);
			notifySuccess("2FA Disabled");
			return true;
		} catch (error) {
			notifyError("Failed to disable 2FA");
			return false;
		}
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUsername, updateAvatarUrl, generate2FA, verify2FA, disable2FA, uploadAvatarFile}}>
			{children}
		</AuthContext.Provider>
	);
};