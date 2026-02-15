import { useEffect } from "react";

const PROTOCOL = window.location.protocol; // 'http:' o 'https:'
const HOST = window.location.hostname;     // 'localhost' o '10.13.1.5'
const PORT = '3000';                       // Tu puerto de backend
const BASE_URL = `${PROTOCOL}//${HOST}:${PORT}`; // Resultado: http://10.13.1.5:3000


const Frontend = ({ children }: { children: React.ReactNode }) => {

	useEffect(() => {
		// A. Si venimos de GitHub/Google con token en URL
		const params = new URLSearchParams(window.location.search);
		const tokenFromUrl = params.get('token');

		if (tokenFromUrl) {
			console.log("🔑 Token detected. Saving to SESSION storage...");
			// CORRECCIÓN 1: Usamos sessionStorage para ser consistentes con el logout
			localStorage.setItem('auth_token', tokenFromUrl);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);

	useEffect(() => {
		//el useEffect carga la funcion , no la llama. 
		//al cerrar la window, se llama a handleTabClose
		const handleTabClose = () => {
			const token = localStorage.getItem('auth_token');

			if (token) {
				fetch(`${BASE_URL}:3000/api/auth/logout`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
					keepalive: true // <--- ¡LA CLAVE MAGICA! 🗝️
				});
			}
			window.addEventListener('beforeunload', handleTabClose);
		};
		return () => {
			window.removeEventListener('beforeunload', handleTabClose);
		};
	}, []);

	

	return (
		<>
			<main
				style={{
					minHeight: "800px",
					margin: 0,
					padding: 0,
					width: "100%",
				}}
			>
				{children}
			</main>
		</>
	);
};

export default Frontend;
