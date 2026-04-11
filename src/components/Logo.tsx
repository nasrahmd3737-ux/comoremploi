import { Link } from "react-router-dom";
import logoImg from "@/assets/logo.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="Comores Emploi"
        className={`${sizeMap[size]} rounded-full object-cover`}
        style={{ objectPosition: '25% center' }}
      />
      {showText && (
        <span className="font-display text-lg font-bold text-foreground">
          Comores <span className="text-primary">Emploi</span>
        </span>
      )}
    </Link>
  );
};

export default Logo;
