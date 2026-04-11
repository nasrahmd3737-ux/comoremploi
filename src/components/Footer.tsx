import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <Logo size="sm" />

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <Link to="/jobs" className="hover:text-foreground transition-colors">Offres</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">S'inscrire</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Connexion</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Comores Emploi. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
