import { CircularProgress, Skeleton, SxProps, Theme } from '@mui/material';

type Props = {
	variant?: 'spinner' | 'skeleton' | 'circle';
	size?: 'sm' | 'md' | 'lg';
	sx?: SxProps<Theme>;
};

const Loading = ({ variant = 'spinner', size = 'md', sx }: Props) => {
	const spinnerSizes = { sm: 16, md: 32, lg: 48 };

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

export default Loading;