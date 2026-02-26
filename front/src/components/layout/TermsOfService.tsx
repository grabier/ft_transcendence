import React from 'react';
import { Container, Typography, Paper, Box, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
	const navigate = useNavigate();

	return (
		<Container maxWidth="md" sx={{ py: 6 }}>
			<Button
				onClick={() => navigate(-1)}
				sx={{ mb: 4, color: 'grey.400', '&:hover': { color: 'white' } }}
			>
				&larr; Volver
			</Button>

			<Paper
				elevation={24}
				sx={{
					p: { xs: 4, md: 6 },
					bgcolor: '#0a0a0a',
					color: 'grey.300',
					border: '1px solid #333',
					borderRadius: 2
				}}
			>
				<Typography variant="h3" component="h1" sx={{ color: 'white', fontWeight: 'bold', mb: 1, fontFamily: '"Montserrat", sans-serif' }}>
					Términos de Servicio
				</Typography>
				<Typography variant="subtitle1" sx={{ color: '#00ff66', mb: 4, fontFamily: '"Montserrat", sans-serif' }}>
					PescaPong Arcade
				</Typography>

				<Box sx={{ mb: 4 }}>
					<Typography variant="body1" paragraph>
						Bienvenido a <strong>PescaPong</strong>. Este proyecto ha sido desarrollado como parte del currículo académico de la escuela 42.
						Al acceder y utilizar esta plataforma, aceptas estar sujeto a los siguientes Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestra aplicación.
					</Typography>
				</Box>

				<Divider sx={{ borderColor: 'grey.800', mb: 4 }} />

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						1. Naturaleza del Proyecto
					</Typography>
					<Typography variant="body2" paragraph>
						pescapong es un entorno de pruebas educativo. <strong>No es un producto comercial.</strong> El servicio se proporciona "tal cual" y "según disponibilidad". Nos reservamos el derecho absoluto de modificar, suspender o cerrar la plataforma, así como de reiniciar las bases de datos, historiales de partidas y puntuaciones en cualquier momento y sin previo aviso.
					</Typography>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						2. Cuentas de Usuario y Seguridad
					</Typography>
					<Typography variant="body2" paragraph>
						Para acceder a las funciones multijugador, debes crear una cuenta. Eres el único responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.
					</Typography>
					<Typography variant="body2" paragraph>
						Nos reservamos el derecho de suspender o eliminar cuentas que consideremos que violan estos términos, a nuestra entera discreción.
					</Typography>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						3. Código de Conducta
					</Typography>
					<Typography variant="body2" paragraph>
						Al utilizar nuestras salas de chat y sistemas de emparejamiento (matchmaking), te comprometes a mantener un ambiente de respeto. Está estrictamente prohibido:
					</Typography>
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							El acoso, los insultos, los discursos de odio o cualquier comportamiento tóxico hacia otros jugadores en el chat o en los mensajes directos.
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							Hacer spam, enviar enlaces maliciosos o saturar los canales de comunicación.
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							<strong>Uso de trampas:</strong> Queda terminantemente prohibido el uso de scripts, bots, macros o cualquier software de terceros diseñado para obtener ventajas injustas en las partidas de Pong y Snake.
						</Typography>
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						4. Propiedad Intelectual
					</Typography>
					<Typography variant="body2" paragraph>
						Todo el código, diseño y mecánicas de pescapong han sido desarrollados por el equipo creador. Los derechos de propiedad intelectual del proyecto general están sujetos a las normativas del plan de estudios de la red 42.
					</Typography>
				</Box>

				<Divider sx={{ borderColor: 'grey.800', my: 4 }} />

				<Box sx={{ textAlign: 'center', opacity: 0.7 }}>
					<Typography variant="body2">
						Desarrollado con amor, cigarros y mucho café por:
					</Typography>
					<Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mt: 1 }}>
						ppeckham | jose-rig | jormoral | gmontoro
					</Typography>
					<Typography variant="caption" display="block" sx={{ mt: 2 }}>
						Última actualización: {new Date().toLocaleDateString('es-ES')}
					</Typography>
				</Box>
			</Paper>
		</Container>
	);
};

export default TermsOfService;