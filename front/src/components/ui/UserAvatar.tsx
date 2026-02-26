import { Avatar, Badge, styled } from "@mui/material";

const STATUS_COLORS = {
  online: "#44b700",
  ingame: "#ff9100",
  offline: "#bdbdbd",
};


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

interface Props {
  src?: string;
  name: string;
  size?: number;
  status?: "online" | "ingame" | "offline" | null;
  isGroup?: boolean;
  sx?: any;
}

const UserAvatar = ({ 
  src, 
  name, 
  size = 40, 
  status = null, 
  sx = {} 
}: Props) => {
  const avatarContent = (
    <Avatar
      alt={name}
      src={src}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        bgcolor: "transparent",
        border: "1px solid rgba(0,0,0,0.1)",
        ...sx,
      }}
    >
    {!src && name ? name.charAt(0).toUpperCase() : null}
    </Avatar>
  );
  if (!status) return avatarContent;
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