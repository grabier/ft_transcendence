import { Outlet } from "react-router-dom";
import { useEffect } from "react";

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

		// B. "¡ESTOY VIVO!" (Heartbeat inicial)
		// Cada vez que se recarga la página (F5), confirmamos al back que estamos online.
		// Esto arregla el bug de aparecer Offline tras un F5.
		//const currentToken = localStorage.getItem('auth_token');
		/* if (currentToken) {
			// (Opcional) Podrías crear una ruta específica /heartbeat, 
			// pero llamar a /profile o similar ya suele validar el token.
			// Aquí forzamos una actualización simple si tienes una ruta para ello, 
			// o confiamos en que tu siguiente petición autenticada actualizará el 'last_seen'.
			// Lo IDEAL es tener esto:
			fetch('http://localhost:3000/api/user/profile', { // O tu ruta de "me"
				headers: { 'Authorization': `Bearer ${currentToken}` }
			}).catch(console.error);
		} */

	}, []);
	
	useEffect(() => {
		// Función que se ejecuta SOLO cuando intentas cerrar la pestaña
		const handleTabClose = () => {
			const token = localStorage.getItem('auth_token'); // O sesssionstorage si decides no cambiarlo
			
			if (token) {
				// Usamos 'fetch' con keepalive: true
				// Esto permite que la petición termine aunque la pestaña se cierre
				
				fetch('http://localhost:3000/api/auth/logout', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
					keepalive: true // <--- ¡LA CLAVE MAGICA! 🗝️
				});
			}
		};
		//console.log("useffect frontend alo alo");
		// Añadimos el escuchador del evento
		window.addEventListener('beforeunload', handleTabClose);
		
		// Limpiamos el escuchador cuando el componente se desmonta
		return () => {
			//console.log("RETURN useffect frontend alo alo");
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
