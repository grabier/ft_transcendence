// src/components/ui/Modal.tsx

import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { styled, keyframes } from "@mui/material/styles";
import Dialog from "@mui/material/Dialog";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
    fullWidth?: boolean;
}

// 1. Animación personalizada
const fadeIn = keyframes`
    from { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
`;

// 2. El Dialog principal estilizado con tu diseño neobrutalista
const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        backgroundColor: theme.palette.background.default,
        border: `3px solid ${theme.palette.secondary.main}`,
        boxShadow: `10px 10px 0px 0px ${theme.palette.secondary.main}`,
        borderRadius: 0,
        animation: `${fadeIn} 0.4s ease-out`,
        transition: "all 0.3s",
        margin: theme.spacing(2),
        backgroundImage: "none",
        "&:hover": {
            transform: "translate(-2px, -2px)",
            boxShadow: `12px 12px 0px 0px ${theme.palette.accent.yellow}`,
        },
    },
    "& .MuiBackdrop-root": {
        backgroundColor: "rgba(0, 0, 0, 0.85)",
    },
}));

// 3. Cabecera del modal
const ModalHeader = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.background.default,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `3px solid ${theme.palette.secondary.main}`,
}));

// 4. Botón de cierre brutalista
const BrutalistCloseButton = styled(IconButton)(({ theme }) => ({
    color: theme.palette.background.default,
    padding: "4px",
    borderRadius: 0,
    border: "2px solid transparent",
    transition: "all 0.2s",
    "&:hover": {
        color: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.main,
    },
}));

const Modal = ({
    open,
    onClose,
    title,
    children,
    maxWidth = "xs",
    fullWidth = true,
}: ModalProps) => {
    return (
        <StyledDialog
            open={open}
            onClose={onClose}
            maxWidth={maxWidth}
            fullWidth={fullWidth}
            PaperProps={{
                sx: {
                    width: "100%",
                    maxWidth: maxWidth === "xs" ? "448px" : undefined, // Usando los 448px de tu archivo de estilos
                },
            }}
        >
            {title && (
                <ModalHeader>
                    <Typography
                        variant="h6"
                        sx={{
                            fontFamily: "'Space Mono', 'Courier New', monospace",
                            fontWeight: "bold",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            fontSize: "1rem",
                        }}
                    >
                        {title}
                    </Typography>
                    <BrutalistCloseButton onClick={onClose} disableRipple>
                        <CloseIcon />
                    </BrutalistCloseButton>
                </ModalHeader>
            )}

            {!title && (
                <IconButton
                    onClick={onClose}
                    disableRipple
                    sx={{
                        position: "absolute",
                        right: 12,
                        top: 12,
                        zIndex: 10,
                        color: "secondary.main",
                        padding: "4px",
                        backgroundColor: "background.default",
                        border: "2px solid",
                        borderColor: "secondary.main",
                        borderRadius: 0,
                        transition: "all 0.2s",
                        "&:hover": {
                            backgroundColor: "accent.yellow",
                            transform: "translate(-2px, -2px)",
                            boxShadow: "4px 4px 0px 0px secondary.main",
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            )}

            <Box sx={{ position: "relative", p: 0 }}>
                {children}
            </Box>
        </StyledDialog>
    );
};

export default Modal;