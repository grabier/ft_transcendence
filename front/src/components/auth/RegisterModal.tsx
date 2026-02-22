import { useState, type FormEvent } from "react";
import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography, CircularProgress, Alert } from "@mui/material";

import { StyledTextField, PrimaryAuthButton } from "@/style/AuthModalStyle";
import { validateEmail } from "@/utils/validation";
import { BASE_URL } from '@/config';
import SocialLoginButton from "@/components/ui/SocialLoginButton";
import AuthSwitchLink from "@/components/ui/AuthSwitchLink";
import Modal from "@/components/ui/Modal";
import { PasswordInput } from "@/components/ui/PasswordInput"


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

	const { t } = useTranslation();

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!username || !email || !password) return;
		await onRegister(username, email, password);
	};

	const resetForm = () => {
		setUsername("");
		setEmail("");
		setPassword("");
		setEmailError("");
	};

	const handleClose = () => {
		if (!isLoading) {
			resetForm();
			onClose();
		}
	};

	return (
		<Modal open={open} onClose={handleClose} maxWidth="xs">
			<Box sx={{ p: 4 }}>

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
						{t('registerModal.signUpFor')}
					</Typography>
					<Typography variant="displayTitle">
						{t('registerModal.title')}
					</Typography>
				</Box>

				<Stack spacing={2} sx={{ mb: 3 }}>
					<SocialLoginButton provider="google" href={`${BASE_URL}/api/auth/google`}>
						{t('registerModal.signUpWithGoogle')}
					</SocialLoginButton>

					<SocialLoginButton provider="github" href={`${BASE_URL}/api/auth/github`}>
						{t('registerModal.signUpWithGithub')}
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
							fullWidth type="text" label={t('registerModal.usernameLabel')}
							name="username" autoComplete="username" value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={isLoading} required
						/>

						<StyledTextField
							fullWidth type="email" label={t('registerModal.emailLabel')}
							name="email" autoComplete="email" value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								setEmailError(validateEmail(e.target.value));
							}}
							disabled={isLoading} required error={!!emailError} helperText={emailError}
						/>

						<PasswordInput
							fullWidth label={t('loginModal.passwordLabel')} name="password"
							autoComplete="current-password" value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isLoading} required
						/>

						<PrimaryAuthButton type="submit" disabled={isLoading || !username || !email || !password} sx={{ mt: 3 }}>
							{isLoading ? (
								<CircularProgress size={24} sx={{ color: "secondary.main" }} />
							) : (
								t('registerModal.createAccount')
							)}
						</PrimaryAuthButton>
					</Stack>
				</form>

				<AuthSwitchLink
					text={t('registerModal.alreadyHaveAccount')}
					actionText={t('registerModal.logIn')}
					onAction={() => {
						resetForm();
						onSwitchToLogin();
					}}
				/>

			</Box>
		</Modal>
	);
};

export default RegisterModal;