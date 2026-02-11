import { Dialog, TextField, Button } from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

export const fadeIn = keyframes`
    from { 
        opacity: 0; 
        transform: translateY(10px); 
    }
    to { 
        opacity: 1; 
        transform: translateY(0); 
    }
`;

export const StyledDialog = styled(Dialog)(({ theme }) => ({
    "& .MuiDialog-paper": {
        backgroundColor: "background.default",
        border: `3px solid "secondary.main"`,
        boxShadow: `10px 10px 0px 0px "secondary.main"`,
        borderRadius: 0,
        maxWidth: "448px",
        width: "100%",
        animation: `${fadeIn} 0.4s ease-out`,
        transition: "all 0.3s",
        "&:hover": {
            transform: "translate(-2px, -2px)",
            boxShadow: `12px 12px 0px 0px "accent.yellow"`,
        },
    },
    "& .MuiBackdrop-root": {
        backgroundColor: "rgba(0, 0, 0, 0.85)",
    },
}));

export const StyledTextField = styled(TextField)(() => ({
    "& .MuiOutlinedInput-root": {
        borderRadius: 0,
        backgroundColor: "grey[200]",
        border: `2px solid "secondary.main"`,
        fontFamily: "'Space Mono', 'Courier New', monospace",
        fontWeight: "bold",
        textTransform: "uppercase",
        fontSize: "0.875rem",
        "& fieldset": {
            border: "none",
        },
        "&:hover": {
            backgroundColor: "grey[200]",
        },
        "&.Mui-focused": {
            backgroundColor: "background.default",
            borderColor: "accent.yellow",
        },
    },
    "& .MuiInputLabel-root": {
        fontFamily: "'Space Mono', 'Courier New', monospace",
        fontWeight: "bold",
        textTransform: "uppercase",
        fontSize: "0.875rem",
        "&.Mui-focused, &.MuiInputLabel-shrink": {
            transform: "translate(16px, -16px) scale(0.75)",
        },
    },
    "& input": {
        padding: "16px",
    },
}));

export const PrimaryAuthButton = styled(Button)(() => ({
    width: "100%",
    backgroundColor: "accent.yellow",
    color: "secondary.main",
    fontSize: "1.25rem",
    fontWeight: 900,
    fontFamily: "'Archivo Black', sans-serif",
    padding: "16px 24px",
    border: `2px solid "secondary.main"`,
    borderRadius: 0,
    boxShadow: `5px 5px 0px 0px "secondary.main"`,
    textTransform: "uppercase",
    transition: "all 0.1s",
    "&:hover": {
        backgroundColor: "accent.yellowHover",
    },
    "&:active": {
        transform: "translate(5px, 5px)",
        boxShadow: "0px 0px 0px 0px",
    },
    "&:disabled": {
        backgroundColor: "grey[300]",
        color: "grey[700]",
    },
}));

export const OAuthButton = styled(Button)(({ theme }) => ({
    width: "100%",
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.background.default,
    fontWeight: 700,
    padding: "12px 24px",
    border: "2px solid transparent",
    borderRadius: 0,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    transition: "all 0.3s",
    "&:hover": {
        backgroundColor: theme.palette.background.default,
        color: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.main,
    },
}));
