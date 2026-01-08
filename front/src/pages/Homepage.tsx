import { Box, Button, Grid, Stack } from "@mui/material";
// Asegúrate de que los iconos están bien importados
import SportsTennisIcon from '@mui/icons-material/SportsTennis';
import SettingsIcon from '@mui/icons-material/Settings';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import CardGrid from "../components/CardGrid"; 

const Homepage = () => {
    return (
        <Box sx={{ p: 4 }}>
            
            {/* BOTONES DE ARRIBA (Esto se queda igual) */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 6 }}>
                <Button variant="contained" sx={{ bgcolor: "black", border: "2px solid black", borderRadius: 0 }}>
                    SINGLE PLAYER
                </Button>
                <Button variant="outlined" sx={{ color: "black", border: "2px solid black", borderRadius: 0 }}>
                    MULTIPLAYER
                </Button>
                <Button variant="outlined" sx={{ color: "black", border: "2px solid black", borderRadius: 0 }}>
                    TOURNAMENT
                </Button>
            </Stack>

            {/* AQUÍ ESTÁ EL CAMBIO IMPORTANTE */}
            <Grid container spacing={4} justifyContent="center">
                
                {/* CARTA 1: DIFFICULTY */}
                {/* Quitamos 'item' y usamos 'size' */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <CardGrid
                        title="DIFFICULTY" 
                        icon={<SportsTennisIcon />} 
                        isActive={true} 
                    />
                </Grid>

                {/* CARTA 2: SKIN */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <CardGrid
                        title="SKIN" 
                        icon={<SettingsIcon />} 
                    />
                </Grid>

                {/* CARTA 3: PRACTICE */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <CardGrid
                        title="PRACTICE" 
                        icon={<TrackChangesIcon />} 
                    />
                </Grid>

            </Grid>
        </Box>
    );
};

export default Homepage;