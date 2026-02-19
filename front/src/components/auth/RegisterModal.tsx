import { useState, type FormEvent } from "react";
import {
  Box,
  Stack,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  StyledDialog,
  StyledTextField,
  PrimaryAuthButton,
} from "../../style/AuthModalStyle";
import { validateEmail } from "../../utils/validation";
import { BASE_URL } from '../../config';
import SocialLoginButton from "../ui/SocialLoginButton";
import AuthSwitchLink from "./AuthSwitchLink";

interface Props {
  open: boolean;
  onClose: () => void;
  onRegister: (username: string, email: string, pass: string) => Promise<void>;
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
      resetForm();
      onClose();
    }
  };

  // Función auxiliar para limpiar el estado (DRY)
  const resetForm = () => {
    setUsername("");
    setEmail("");
    setPassword("");
    setEmailError("");
  };

  return (
    <StyledDialog open={open} onClose={handleClose}>
      <Box sx={{ p: 4 }}>
        
        {/* --- HEADER --- */}
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
            Sign up for
          </Typography>
          <Typography variant="displayTitle">
            Transcendence
          </Typography>
        </Box>

        {/* --- SOCIAL BUTTONS --- */}
        <Stack spacing={2} sx={{ mb: 3 }}>
          <SocialLoginButton
            provider="google"
            href={`${BASE_URL}/api/auth/google`}
          >
            Sign up with Google
          </SocialLoginButton>

          <SocialLoginButton
            provider="github"
            href={`${BASE_URL}/api/auth/github`}
          >
            Sign up with Github
          </SocialLoginButton>
        </Stack>

        {/* --- ERROR ALERT --- */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
            {error}
          </Alert>
        )}

        {/* --- FORMULARIO --- */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
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

            <StyledTextField
              fullWidth
              type="email"
              label="EMAIL"
              name="email"
              autoComplete="email"
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

            <PrimaryAuthButton
              type="submit"
              disabled={isLoading || !username || !email || !password}
              sx={{ mt: 3 }}
            >
              {isLoading ? (
                <CircularProgress
                  size={24}
                  sx={{ color: "secondary.main" }}
                />
              ) : (
                "Create Account"
              )}
            </PrimaryAuthButton>
          </Stack>
        </form>

        {/* --- SWITCHER REUTILIZABLE --- */}
        <AuthSwitchLink 
            text="Already have an account?" 
            actionText="Log in" 
            onAction={() => {
                resetForm();
                onSwitchToLogin();
            }} 
        />
        
      </Box>
    </StyledDialog>
  );
};

export default RegisterModal;