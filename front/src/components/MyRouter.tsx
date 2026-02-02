import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainPage from "../pages/MainPage";
import GamesPage from "../pages/GamesPage";

const MyRouter = () => <RouterProvider router={createBrowserRouter([
    {
        path: "/",
        element: <MainPage />, // Capa 1: Base
        children: [
            {
                path: "/",
                element: <GamesPage />,
            },
        ],
    },
])} />

export default MyRouter;