import { OAuthButton } from "@/style/AuthModalStyle";

interface Props {
  provider: "google" | "github" | "42";
  href: string;
  children: React.ReactNode;
}

const SocialLoginButton = ({ provider, href, children }: Props) => {
  const iconId = `icon-${provider}`; 
  const iconSize = provider === "github" ? 24 : 20;

  return (
    <OAuthButton
      href={href}
      sx={{
        backgroundColor: "#000000",
        color: "#FFFFFF",
        border: "2px solid #000000",
        "&:hover": {
          backgroundColor: "#FFFFFF",
          color: "#000000",
        },
        width: "100%", 
        display: "flex",
        justifyContent: "center",
        textDecoration: "none"
      }}
      startIcon={
        <svg width={iconSize} height={iconSize} aria-label={provider}>
          <use href={`/assets/sprites.svg#${iconId}`} />
        </svg>
      }
    >
      {children}
    </OAuthButton>
  );
};

export default SocialLoginButton;