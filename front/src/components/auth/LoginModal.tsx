import { useState, type FormEvent } from "react";
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, CircularProgress, Alert, Link } from "@mui/material";

// Eliminamos StyledDialog de aquí
import { StyledTextField, PrimaryAuthButton } from "@/style/AuthModalStyle";
import { validateEmail } from "@/utils/validation";
import { BASE_URL } from '@/config';
import SocialLoginButton from "@/components/ui/SocialLoginButton";
import AuthSwitchLink from "@/components/auth/AuthSwitchLink";
import Modal from "@/components/ui/Modal"; // Importamos el nuevo componente

interface Props {
  open: boolean;
  onClose: () => void;
  onLogin: (email: string, pass: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onSwitchToResetPassword: () => void;
  isLoading?: boolean;
  error?: string;
}

const LoginModal = ({
  open,
  onClose,
  onLogin,
  onSwitchToRegister,
  onSwitchToResetPassword,
  isLoading = false,
  error,
}: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");

  const { t } = useTranslation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    await onLogin(email, password);
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail(""); setPassword(""); setEmailError("");
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="xs">
      <Box sx={{ p: 4 }}>
        
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="authSubtitle"
            sx={{ borderBottom: "2px solid", borderColor: "secondary.main", display: "inline-block", pb: 0.5, mb: 1 }}
          >
            {t('loginModal.signInTo')}
          </Typography>
          <Typography variant="displayTitle">{t('loginModal.title')}</Typography>
        </Box>

        <Stack spacing={2} sx={{ mb: 3 }}>
          <SocialLoginButton provider="google" href={`${BASE_URL}/api/auth/google`}>
            {t('loginModal.continueWithGoogle')}
          </SocialLoginButton>

          <SocialLoginButton provider="github" href={`${BASE_URL}/api/auth/github`}>
            {t('loginModal.continueWithGithub')}
          </SocialLoginButton>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <StyledTextField
              fullWidth type="email" label={t('loginModal.emailLabel')} name="email"
              autoComplete="email" value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(validateEmail(e.target.value));
              }}
              disabled={isLoading} required error={!!emailError} helperText={emailError}
            />
            <StyledTextField
              fullWidth type="password" label={t('loginModal.passwordLabel')} name="password"
              autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading} required
            />

            <PrimaryAuthButton type="submit" disabled={isLoading || !email || !password} sx={{ mt: 3 }}>
              {isLoading ? <CircularProgress size={24} sx={{ color: "secondary.main" }} /> : t('loginModal.loginButton')}
            </PrimaryAuthButton>
          </Stack>
        </form>

        <Link
          component="button" type="button" onClick={onSwitchToResetPassword}
          sx={{
            display: "block", textAlign: "center", mt: 2,
            textDecoration: "underline", textDecorationThickness: "2px",
            textUnderlineOffset: "4px", color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          <Typography variant="subtitle1">{t('loginModal.resetPassword')}</Typography>
        </Link>

        <AuthSwitchLink 
            text={t('loginModal.noAccount')} 
            actionText={t('loginModal.createOne')} 
            onAction={() => {
                setEmail(""); setPassword(""); setEmailError("");
                onSwitchToRegister();
            }} 
        />
        
      </Box>
    </Modal>
  );
};

export default LoginModal;