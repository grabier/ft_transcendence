import { useState, useRef } from 'react';
import { IconButton, InputAdornment, TextFieldProps } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { StyledTextField } from '@/style/AuthModalStyle';

type Props = Omit<TextFieldProps, 'type'>;

const PasswordInput = (props: Props) => {
	const [showPassword, setShowPassword] = useState(false);

	const inputRef = useRef<HTMLInputElement>(null);

	const handleClickShowPassword = () => {
		const cursorPosition = inputRef.current?.selectionStart;
		setShowPassword((show) => !show);
		setTimeout(() => {
			if (inputRef.current && cursorPosition !== null && cursorPosition !== undefined) {
				inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
			}
		}, 0);
	};

	const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};

	return (
		<StyledTextField
			{...props}
			type={showPassword ? 'text' : 'password'}
			inputRef={inputRef}
			InputProps={{
				...props.InputProps,
				endAdornment: (
					<InputAdornment position="end">
						<IconButton
							aria-label="toggle password visibility"
							onClick={handleClickShowPassword}
							onMouseDown={handleMouseDownPassword}
							onMouseUp={handleMouseDownPassword}
							edge="end"
						>
							{showPassword ? <VisibilityOff /> : <Visibility />}
						</IconButton>
					</InputAdornment>
				),
			}}
		/>
	);
};

export default PasswordInput;