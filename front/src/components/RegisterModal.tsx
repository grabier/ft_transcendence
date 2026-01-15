import { useState, type FormEvent } from "react";
import {
    Box,
    Stack,
    Typography,
    CircularProgress,
    Alert,
    Link,
} from "@mui/material";
import {
    StyledDialog,
    StyledTextField,
    PrimaryAuthButton,
} from "../style/AuthModalStyle";
import { validateEmail } from "../utils/validation";

interface Props {
    open: boolean;
    onClose: () => void;
    onRegister: (
        username: string,
        email: string,
        password: string
    ) => Promise<void>;
    onSwitchToLogin: () => void;
    isLoading?: boolean;
    error?: string;
}

const RegisterModal = ({
    open,
    onClose,
    onRegister,
    onSwitchToLogin,
    isLoading = false,
    error,
}: Props) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!username || !email || !password) return;
        await onRegister(username, email, password);
    };

    const handleClose = () => {
        if (!isLoading) {
            setUsername("");
            setEmail("");
            setPassword("");
            setEmailError("");
            onClose();
        }
    };

    const handleSwitchToLogin = () => {
        setUsername("");
        setEmail("");
        setPassword("");
        setEmailError("");
        onSwitchToLogin();
    };

    return (
        <StyledDialog open={open} onClose={handleClose}>
            <Box sx={{ p: 4 }}>
                {/* Title */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography
                        variant="subtitle1"
                        sx={{
                            borderBottom: "2px solid",
                            borderColor: "secondary.main",
                            display: "inline-block",
                            pb: 0.5,
                            mb: 1,
                        }}
                    >
                        Welcome to
                    </Typography>
                    <Typography variant="displayTitle">
                        Transcendence
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
                        {error}
                    </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <StyledTextField
                            fullWidth
                            type="email"
                            label="EMAIL"
                            name="email"
                            autoComplete="off"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setEmailError(validateEmail(e.target.value));
                            }}
                            disabled={isLoading}
                            required
                            error={!!emailError}
                            helperText={emailError}
                        />
                        <StyledTextField
                            fullWidth
                            type="password"
                            label="PASSWORD"
                            name="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                        <StyledTextField
                            fullWidth
                            type="text"
                            label="USERNAME"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            required
                        />

                        <PrimaryAuthButton
                            type="submit"
                            disabled={
                                isLoading || !username || !email || !password
                            }
                            sx={{ mt: 3 }}
                        >
                            {isLoading ? (
                                <CircularProgress
                                    size={24}
                                    sx={{ color: "secondary.main" }}
                                />
                            ) : (
                                "Sign Up"
                            )}
                        </PrimaryAuthButton>
                    </Stack>
                </form>

                {/* Switch to Login */}
                <Typography variant="body1" sx={{ textAlign: "center", mt: 3 }}>
                    Already have an account?{" "}
                    <Link
                        component="button"
                        type="button"
                        onClick={handleSwitchToLogin}
                        sx={{
                            fontWeight: 900,
                            fontFamily: "'Archivo Black', sans-serif",
                            textDecoration: "underline",
                            textDecorationColor: "accent.yellow",
                            textDecorationThickness: "4px",
                            textUnderlineOffset: "2px",
                            color: "text.primary",
                            "&:hover": { color: "accent.yellowDark" },
                        }}
                    >
                        Log in
                    </Link>
                </Typography>
            </Box>
        </StyledDialog>
    );
};

export default RegisterModal;
