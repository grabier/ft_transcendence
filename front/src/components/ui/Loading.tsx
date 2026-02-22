import { CircularProgress, Skeleton, SxProps, Theme } from '@mui/material';

type LoadingProps = {
	variant?: 'spinner' | 'skeleton' | 'circle';
	size?: 'sm' | 'md' | 'lg';
	sx?: SxProps<Theme>; // Usamos sx en lugar de className para compatibilidad con MUI
};

export const Loading = ({ variant = 'spinner', size = 'md', sx }: LoadingProps) => {
	// Tamaños en píxeles para el spinner
	const spinnerSizes = { sm: 16, md: 32, lg: 48 };

	// Tamaños para el avatar (círculo)
	const circleSizes = { sm: 24, md: 40, lg: 56 };

	if (variant === 'spinner') {
		return <CircularProgress size={spinnerSizes[size]} sx={sx} />;
	}

	if (variant === 'circle') {
		return (
			<Skeleton
				variant="circular"
				width={circleSizes[size]}
				height={circleSizes[size]}
				sx={sx}
			/>
		);
	}

	// Tamaños predeterminados para bloques de texto (skeleton)
	const skeletonWidths = { sm: 80, md: 160, lg: '100%' };
	const skeletonHeights = { sm: 16, md: 24, lg: 40 };

	return (
		<Skeleton
			variant="rounded"
			width={skeletonWidths[size]}
			height={skeletonHeights[size]}
			sx={sx}
		/>
	);
};