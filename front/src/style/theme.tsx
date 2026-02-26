import { createTheme, type ThemeOptions } from "@mui/material/styles";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/700.css";

const sharedTypography = {
    fontFamily: "Montserrat, sans-serif",
    h1: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
    h2: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
    h3: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
    h4: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
    h5: { fontFamily: "Montserrat, sans-serif", fontWeight: 700 },
    h6: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 700,
        fontSize: "20px",
        lineHeight: "28px",
        letterSpacing: "0%",
        textTransform: "none" as const,
    },
    subtitle1: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 700,
        fontSize: "14px",
        lineHeight: "28px",
        letterSpacing: "0%",
        textTransform: "none" as const,
    },
    subtitle2: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 700,
    },
    body1: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 400,
        fontSize: "14px",
        lineHeight: "28px",
        letterSpacing: "0%",
        textTransform: "none" as const,
    },
    button: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 700,
        textTransform: "none" as const,
    },
    displayTitle: {
        fontFamily: "'Archivo Black', sans-serif",
        fontWeight: 900,
        fontSize: "2.25rem",
        textTransform: "uppercase" as const,
        lineHeight: 0.85,
        letterSpacing: "-0.05em",
    },
    authSubtitle: {
        fontFamily: "Montserrat, sans-serif",
        fontWeight: 700,
        fontSize: "0.875rem",
        textTransform: "uppercase" as const,
        letterSpacing: "0.3em",
    },
};

const sharedPaletteColors = {
    grey: {
        50: "#FDFDFD",
        100: "#F8F8F8",
        200: "#F3F3F3",
        300: "#EEEEEE",
        400: "#D0D0D0",
        500: "#B4B4B4",
        600: "#898989",
        700: "#747474",
        800: "#545454",
        900: "#313131",
    },
    success: {
        main: "#076533",
        light: "#a5f3c5ff",
        dark: "#134716",
        contrastText: "#FFFFFF",
    },
    warning: {
        main: "#983C00",
        light: "#f2f3a6ff",
        dark: "#8D3400",
        contrastText: "#FFFFFF",
    },
    info: {
        main: "#0E4EA6",
        light: "#7bb2e1ff",
        dark: "#0B4A9C",
        contrastText: "#FFFFFF",
    },
    error: {
        main: "#A32433",
        light: "#F8B4BB",
        dark: "#911C33",
        contrastText: "#FFFFFF",
    },
    accent: {
        yellow: "#FACC15",
        yellowHover: "#fde047",
        yellowDark: "#ca8a04",
    },
};

const theme: ThemeOptions = {
    palette: {
        mode: "light",
        ...sharedPaletteColors,
        primary: {
            main: "#000000",
            light: "#333333",
            dark: "#000000",
            contrastText: "#fffff7",
        },
        background: {
            default: "#FFFFFF",
            paper: "#fffff7",
        },
        secondary: {
            main: "#fffff7",
            light: "#FFFFFF",
            dark: "#e6e6df",
            contrastText: "#000000",
        },
        text: {
            primary: "#000000",
            secondary: "#545454",
            disabled: "#B4B4B4",
        },
    },
    typography: sharedTypography,
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: "1rem",
                },
            },
        },
        MuiDialog: {
            styleOverrides: {
                paper: {
                    borderRadius: 0,
                    border: "2px solid #000",
                },
            },
        },
        MuiAlert: {
            styleOverrides: {
                root: {
                    borderRadius: 0,
                },
            },
        },
        MuiInputBase: {
            styleOverrides: {
                root: {
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 500,
                }
            }
        }
    },
};

export const muiTheme = createTheme(theme);