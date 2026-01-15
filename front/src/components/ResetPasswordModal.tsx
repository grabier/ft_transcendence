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

interface Props {
    open: boolean;
    onClose: () => void;
    onResetPassword: (email: string) => Promise<void>;
    onSwitchToLogin: () => void;
    isLoading?: boolean;
    error?: string;
    success?: boolean;
}

const ResetPasswordModal = ({
    open,
    onClose,
    onResetPassword,
    onSwitchToLogin,
    isLoading = false,
    error,
    success = false,
}: Props) => {
    const [email, setEmail] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;
        await onResetPassword(email);
        setIsSuccess(true);
        setEmail("");
    };

    const handleClose = () => {
        if (!isLoading) {
            setEmail("");
            setIsSuccess(false);
            onClose();
        }
    };

    const handleSwitchToLogin = () => {
        setEmail("");
        setIsSuccess(false);
        onSwitchToLogin();
    };

    return (
        <StyledDialog open={open} onClose={handleClose}>
            <Box sx={{ p: 4 }}>
                {/* Title */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <Typography
                        variant="authSubtitle"
                        sx={{
                            borderBottom: "2px solid",
                            borderColor: "secondary.main",
                            display: "inline-block",
                            pb: 0.5,
                            mb: 1,
                        }}
                    >
                        Reset your password
                    </Typography>
                    <Typography variant="displayTitle">
                        Transcendence
                    </Typography>
                </Box>

                {/* Instructions */}
                <Typography
                    variant="body1"
                    sx={{
                        textAlign: "center",
                        mb: 3,
                        color: "text.secondary",
                    }}
                >
                    Enter your email address and we'll send you a link to reset
                    your password.
                </Typography>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {/* Success Alert */}
                {isSuccess && ( // Change from `success` to `isSuccess`
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Check your email for the reset link!
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
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading || isSuccess}
                            required
                        />

                        <PrimaryAuthButton
                            type="submit"
                            disabled={isLoading || !email || isSuccess}
                            sx={{ mt: 3 }}
                        >
                            {isLoading ? (
                                <CircularProgress
                                    size={24}
                                    sx={{ color: "secondary.main" }}
                                />
                            ) : isSuccess ? "Email Sent!" : "Send Reset Link"}
                        </PrimaryAuthButton>
                    </Stack>
                </form>

                {/* Back to Login */}
                <Typography variant="body1" sx={{ textAlign: "center", mt: 3 }}>
                    Remember your password?{" "}
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
                        Back to login
                    </Link>
                </Typography>
            </Box>
        </StyledDialog>
    );
};

export default ResetPasswordModal;
