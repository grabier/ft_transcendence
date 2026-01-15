import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { muiTheme } from "./style/theme";
import Frontend from "./Frontend";

// Importa tus páginas
import MainPage from "./pages/MainPage";
import GamesPage from "./pages/GamesPage";

const AppWithTheme = () => {
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <RouterProvider router={router} />
        </ThemeProvider>
    );
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <Frontend />, // Capa 1: Base
        children: [
            {
                path: "/",
                element: <MainPage />, // Capa 2: Layout (Header + Outlet + Footer)
                children: [
                    {
                        path: "/",
                        element: <GamesPage />,
                    },
                ],
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <AppWithTheme />
    </StrictMode>
);