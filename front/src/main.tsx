import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { muiTheme } from "./style/theme";
import './utils/i18n'
import Frontend from "./Frontend";

import { SocketProvider } from "./context/SocketContext";

import MainPage from "./pages/MainPage";
import GamesPage from "./pages/GamesPage";
import { NotificationProvider } from "./context/NotificationContext";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import ChatWidget from "./components/chat/ChatWidget";
import TermsOfService from "./components/layout/TermsOfService";
import PrivacyPolicy from "./components/layout/PrivacyPolicy";
import AboutUs from "./components/layout/AboutUs";

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
			{
				path: "/terms",
				element: <TermsOfService />,
			},
			{
				path: "/privacy",
				element: <PrivacyPolicy />,
			},
			{
				path: "/about",
				element: <AboutUs />,
			}
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