import { Box, Paper, Typography } from "@mui/material";
import { ReactNode } from "react";

// Definimos qué propiedades acepta esta tarjeta
interface GameOptionCardProps {
    title: string;
    icon: ReactNode; // Para pasar el icono de MUI
    isActive?: boolean; // Para cambiar el estilo si está activa (como la primera de tu imagen)
}

const GameOptionCard = ({ title, icon, isActive = false }: GameOptionCardProps) => {
    // Colores basados en tu imagen
    const bgColor = isActive ? "black" : "white";
    const textColor = isActive ? "white" : "black";
    const borderColor = "black"; 

    return (
        <Paper
            elevation={0} // Quitamos la sombra por defecto de MUI
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: `3px solid ${borderColor}`, 
                borderRadius: 0, // Bordes rectos
                overflow: 'hidden', // Para que el banner de abajo no se salga
            }}
        >
            {/* Parte superior (Gris con Icono) */}
            <Box
                sx={{
                    bgcolor: "grey.300", // Color similar al de tu imagen
                    flexGrow: 1, // Ocupa todo el espacio disponible
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 200, // Altura mínima para que se vean grandes
                    p: 4,
                }}
            >
                {/* El icono se renderizará aquí. Podemos aumentar su tamaño */}
                <Box sx={{ '& svg': { fontSize: 80 } }}>
                    {icon}
                </Box>
            </Box>

            {/* Parte inferior (Banner de Título) */}
            <Box
                sx={{
                    bgcolor: bgColor,
                    color: textColor,
                    p: 2,
                    textAlign: "center",
                    borderTop: `3px solid ${borderColor}`,
                    textTransform: "uppercase",
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: 2 }}>
                    {title}
                </Typography>
            </Box>
        </Paper>
    );
};

export default GameOptionCard;