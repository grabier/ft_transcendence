import '@mui/material/styles';
import '@mui/material/Typography';

declare module '@mui/material/styles' {
    interface Palette {
        accent: {
            yellow: string;
            yellowHover: string;
            yellowDark: string;
        };
    }
    interface PaletteOptions {
        accent?: {
            yellow?: string;
            yellowHover?: string;
            yellowDark?: string;
        };
    }
    interface TypographyVariants {
        displayTitle: React.CSSProperties;
        authSubtitle: React.CSSProperties;
    }
    interface TypographyVariantsOptions {
        displayTitle?: React.CSSProperties;
        authSubtitle?: React.CSSProperties;
    }
}

declare module '@mui/material/Typography' {
    interface TypographyPropsVariantOverrides {
        displayTitle: true;
        authSubtitle: true;
    }
}
