import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  variant?: "light" | "dark";
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const Logo = ({ size = "md", showText = true, className = "", variant = "dark" }: LogoProps) => {
  const textClass = variant === "light" 
    ? "text-primary-foreground" 
    : "text-foreground";
  const accentClass = variant === "light" 
    ? "text-primary-foreground/80" 
    : "text-primary";

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="Comores Emploi"
        className={`${sizeMap[size]} rounded-full object-cover`}
        style={{ objectPosition: '25% center' }}
      />
      {showText && (
        <span className={`font-display text-lg font-bold ${textClass}`}>
          Comores <span className={accentClass}>Emploi</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
