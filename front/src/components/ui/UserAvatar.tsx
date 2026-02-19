import { Avatar, Badge, styled } from "@mui/material";

// Colores para los estados (puedes ajustarlos a tu tema)
const STATUS_COLORS = {
  online: "#44b700", // Verde
  ingame: "#ff9100", // Naranja/Amarillo
  offline: "#bdbdbd", // Gris
};

// Estilo del puntito de estado
const StyledBadge = styled(Badge)<{ statuscolor: string }>(({ theme, statuscolor }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: statuscolor,
    color: statuscolor,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "1px solid currentColor",
      content: '""',
    },
  },
}));

// Función para generar un color de fondo consistente basado en el nombre
function stringToColor(string: string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
}

interface UserAvatarProps {
  src?: string;      // URL de la imagen (DiceBear o lo que sea)
  name: string;      // Nombre de usuario (para alt y fallback de iniciales)
  size?: number;     // Tamaño en px (default 40)
  status?: "online" | "ingame" | "offline" | null; // Estado del usuario
  isGroup?: boolean; // Por si es un chat de grupo (opcional)
  sx?: any;          // Estilos extra
}

const UserAvatar = ({ 
  src, 
  name, 
  size = 40, 
  status = null, 
  sx = {} 
}: UserAvatarProps) => {
  
  // Lógica para mostrar la imagen o las iniciales con color generado
  const avatarContent = (
    <Avatar
      alt={name}
      src={src}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.5, // El texto escala con el avatar
        bgcolor: src ? "transparent" : stringToColor(name), // Color hash si no hay img
        border: "1px solid rgba(0,0,0,0.1)",
        ...sx,
      }}
    >
      {/* Si no hay src, mostramos la primera letra */}
      {!src && name ? name.charAt(0).toUpperCase() : null}
    </Avatar>
  );

  // Si no hay estado, devolvemos el avatar limpio
  if (!status) return avatarContent;

  // Si hay estado, lo envolvemos en el Badge
  return (
    <StyledBadge
      overlap="circular"
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      variant="dot"
      statuscolor={STATUS_COLORS[status]}
    >
      {avatarContent}
    </StyledBadge>
  );
};

export default UserAvatar;