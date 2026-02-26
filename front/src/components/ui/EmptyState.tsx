import { Box, Typography, Button, SvgIconProps } from '@mui/material';

interface Props {
	icon?: React.ReactElement<SvgIconProps>;
	title: string;
	description?: string;
	actionText?: string;
	onAction?: () => void;
}

const EmptyState = ({
	icon,
	title,
	description,
	actionText,
	onAction
}: Props) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				justifyContent: 'center',
				p: 6,
				textAlign: 'center',
				color: 'text.secondary',
				height: '100%'
			}}
		>
			{icon && (
				<Box sx={{ mb: 2, '& svg': { fontSize: 72, opacity: 0.4 } }}>
					{icon}
				</Box>
			)}

			<Typography variant="h6" color="text.primary" fontWeight="bold" gutterBottom>
				{title}
			</Typography>

			{description && (
				<Typography variant="body2" sx={{ mb: 3, maxWidth: 350 }}>
					{description}
				</Typography>
			)}

			{actionText && onAction && (
				<Button variant="outlined" color="primary" onClick={onAction}>
					{actionText}
				</Button>
			)}
		</Box>
	);
};

export default EmptyState;