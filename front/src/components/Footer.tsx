import { Box, Container, Typography } from "@mui/material";

const Footer = () => {
    return (
        <Box
            component="footer"
            sx={{
                bgcolor: "primary.main",
                color: "secondary.main",
                py: 2,
                px: 2,
                mt: "auto",
            }}
        >
            <Container
                sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 4,
                }}
            >
                <Box
                    component="img"
                    src="/assets/lyrics-logo.png"
                    alt="Transcendence"
                    sx={{ height: 40, filter: "invert(1)" }}
                />
                <Box sx={{ p: 0.5 }}>
                    <Typography sx={{ color: "inherit", fontWeight: 700, fontSize: "0.875rem" }}>
                        © 2026 All Rights Reserved
                    </Typography>
                </Box>
            </Container>
        </Box>
    );
};

export default Footer;
