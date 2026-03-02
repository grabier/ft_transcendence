import { useEffect } from "react";

import { BASE_URL } from "@/config";
import { STORAGE_KEYS } from './constants';

const Frontend = ({ children }: { children: React.ReactNode }) => {

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const tokenFromUrl = params.get('token');

		if (tokenFromUrl) {
			localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokenFromUrl);
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	}, []);

	useEffect(() => {
		const handleTabClose = () => {
			const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

			if (token) {
				fetch(`${BASE_URL}/api/auth/logout`, {
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
