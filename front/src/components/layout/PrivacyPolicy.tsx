import React from 'react';
import { Container, Typography, Paper, Box, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
					Política de Privacidad
				</Typography>
				<Typography variant="subtitle1" sx={{ color: '#00ff66', mb: 4, fontFamily: '"Montserrat", sans-serif' }}>
					PescaPong Arcade
				</Typography>

				<Box sx={{ mb: 4 }}>
					<Typography variant="body1" paragraph>
						En <strong>PescaPong</strong> nos tomamos en serio tu privacidad (¡incluso siendo un proyecto académico!).
						Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestra plataforma para jugar al Pong, Snake y chatear con otros usuarios.
					</Typography>
				</Box>

				<Divider sx={{ borderColor: 'grey.800', mb: 4 }} />

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						1. Información que Recopilamos
					</Typography>
					<Typography variant="body2" paragraph>
						Para que el juego y las funcionalidades sociales funcionen correctamente, recopilamos los siguientes datos:
					</Typography>
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							<strong>Datos de Registro:</strong> Nombre de usuario, dirección de correo electrónico (si aplica) y contraseña (almacenada de forma encriptada).
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							<strong>Datos de Perfil:</strong> Tu avatar, lista de amigos y usuarios bloqueados.
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							<strong>Datos de Juego:</strong> Historial de partidas, puntuaciones, victorias, derrotas y estadísticas de Pong y Snake.
						</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>
							<strong>Comunicaciones:</strong> Los mensajes enviados a través de nuestro sistema de chat en tiempo real.
						</Typography>
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						2. Uso de la Información
					</Typography>
					<Typography variant="body2" paragraph>
						Tus datos <strong>NUNCA serán vendidos ni compartidos con terceros</strong>. Toda la información recopilada se utiliza exclusiva y estrictamente para:
					</Typography>
					<Box component="ul" sx={{ pl: 3, mb: 2 }}>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>Permitir la autenticación y el inicio de sesión.</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>Mantener el sistema de emparejamiento (matchmaking) y clasificaciones.</Typography>
						<Typography component="li" variant="body2" sx={{ mb: 1 }}>Hacer funcionar el chat en vivo y gestionar las invitaciones a partidas.</Typography>
					</Box>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						3. Almacenamiento Local (Tokens)
					</Typography>
					<Typography variant="body2" paragraph>
						No utilizamos "cookies" de rastreo publicitarias. Sin embargo, PescaPong utiliza el almacenamiento local de tu navegador (`localStorage` o `sessionStorage`) para guardar de forma segura tu <strong>Token de Autenticación (JWT)</strong>. Este token es imprescindible para mantener tu sesión abierta mientras navegas por la página y juegas.
					</Typography>
				</Box>

				<Box sx={{ mb: 4 }}>
					<Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 'bold' }}>
						4. Seguridad y Retención de Datos
					</Typography>
					<Typography variant="body2" paragraph>
						Implementamos medidas de seguridad para proteger tu información, como el *hashing* de contraseñas. Aún así, te recordamos que este es un proyecto escolar de prueba. Nos reservamos el derecho de eliminar todos los datos de la base de datos (incluyendo cuentas de usuario, mensajes y puntuaciones) en cualquier momento para labores de mantenimiento del servidor.
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

export default PrivacyPolicy;