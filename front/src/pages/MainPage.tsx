import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainPage = () => {
    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "secondary.main" }}>
            <Header />
            <Box sx={{ display: "flex", flex: 1, overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflowY: "auto", pt: 6, bgcolor: "secondary.main" }}>
                    <Outlet />
                </Box>
            </Box>
            <Footer />
        </Box>
    );
};

export default MainPage;
