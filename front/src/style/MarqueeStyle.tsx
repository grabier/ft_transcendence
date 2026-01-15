import {
    Box,
    Typography
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

const marquee = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

export const MarqueeContainer = styled(Box)({
    backgroundColor: "black",
    color: "white",
    overflow: "hidden",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    height: "100%",
    position: "relative",
});

export const MarqueeTrack = styled(Box)({
    display: "flex",
    width: "max-content",
    animation: `${marquee} 50s linear infinite`,
});

export const MarqueeContent = styled(Typography)({
    fontSize: "0.875rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    whiteSpace: "nowrap",
    flexShrink: 0,
});
