import { useEffect } from "react";

import { BASE_URL } from "@/config";

const Frontend = ({ children }: { children: React.ReactNode }) => {

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tokenFromUrl = params.get('token');

		if (tokenFromUrl) {
			console.log("🔑 Token detected. Saving to SESSION storage...");
			localStorage.setItem('auth_token', tokenFromUrl);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);

	useEffect(() => {
		const handleTabClose = () => {
			const token = localStorage.getItem('auth_token');

			if (token) {
				fetch(`${BASE_URL}:3000/api/auth/logout`, {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
					},
					keepalive: true
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
