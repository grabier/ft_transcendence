import { Outlet } from "react-router-dom";
import { useEffect } from "react";

const Frontend = () => {
    
	useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');

        if (token) {
            console.log("🔑 Token detected. Saving ...");

            localStorage.setItem('auth_token', token);

            window.history.replaceState({}, document.title, window.location.pathname);

            window.location.reload();
        }
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
                <Outlet />
            </main>
        </>
    );
};

export default Frontend;
