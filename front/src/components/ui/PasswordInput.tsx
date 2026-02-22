import { useState, useRef } from 'react';
import { IconButton, InputAdornment, TextFieldProps } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { StyledTextField } from '@/style/AuthModalStyle';

type PasswordInputProps = Omit<TextFieldProps, 'type'>;

export const PasswordInput = (props: PasswordInputProps) => {
	const [showPassword, setShowPassword] = useState(false);

	// 1. Creamos una referencia para acceder al elemento <input> real del DOM
	const inputRef = useRef<HTMLInputElement>(null);

	const handleClickShowPassword = () => {
		// 2. Guardamos la posición actual del cursor antes del cambio de estado
		const cursorPosition = inputRef.current?.selectionStart;

		setShowPassword((show) => !show);

		// 3. Restauramos la posición del cursor justo después de que React re-renderice el nuevo 'type'
		setTimeout(() => {
			if (inputRef.current && cursorPosition !== null && cursorPosition !== undefined) {
				inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
			}
		}, 0);
	};

	const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault(); // Evita que el input pierda el foco
	};

	return (
		<StyledTextField
			{...props}
			type={showPassword ? 'text' : 'password'}
			inputRef={inputRef} // 4. Pasamos la referencia usando la prop específica de MUI
			InputProps={{
				...props.InputProps,
				endAdornment: (
					<InputAdornment position="end">
						<IconButton
							aria-label="toggle password visibility"
							onClick={handleClickShowPassword}
							onMouseDown={handleMouseDownPassword}
							onMouseUp={handleMouseDownPassword} // 5. Recomendado: previene que Safari o móviles roben el foco al soltar el clic
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