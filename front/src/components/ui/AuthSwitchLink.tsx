import { Typography, Link } from "@mui/material";

interface AuthSwitchLinkProps {
  text: string;
  actionText: string;
  onAction: () => void;
}

const AuthSwitchLink = ({ text, actionText, onAction }: AuthSwitchLinkProps) => {
  return (
    <Typography variant="body1" sx={{ textAlign: "center", mt: 3 }}>
      {text}{" "}
      <Link
        component="button"
        type="button"
        onClick={onAction}
        sx={{
          fontWeight: 900,
          fontFamily: "'Archivo Black', sans-serif",
          textDecoration: "underline",
          textDecorationColor: "accent.yellow",
          textDecorationThickness: "4px",
          textUnderlineOffset: "2px",
          color: "text.primary",
          "&:hover": { color: "accent.yellowDark" },
        }}
      >
        {actionText}
      </Link>
    </Typography>
  );
};

export default AuthSwitchLink;