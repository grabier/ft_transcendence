import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { muiTheme } from "./style/theme";
import Frontend from "./Frontend";

import { SocketProvider } from "./context/SocketContext";

// Importa tus páginas
import MainPage from "./pages/MainPage";
import GamesPage from "./pages/GamesPage";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { ChatWidget } from "./components/chat/ChatWidget";

const AppLayout = () => (
	<NotificationProvider>
		<AuthProvider>
			<SocketProvider>
				<ChatProvider>
					<MainPage />
					<ChatWidget />
				</ChatProvider>
			</SocketProvider>
		</AuthProvider>
	</NotificationProvider>
);

const router = createBrowserRouter([
	{
		path: "/",
		element: <AppLayout />,
		children: [
			{
				path: "/",
				element: <GamesPage />,
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<Frontend>
		<ThemeProvider theme={muiTheme}>
			<CssBaseline />
			<RouterProvider router={router} />
		</ThemeProvider>
	</Frontend >
);