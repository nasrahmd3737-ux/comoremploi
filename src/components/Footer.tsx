import { Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              Kazi <span className="text-primary">Comores</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <Link to="/jobs" className="hover:text-foreground transition-colors">Offres</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">S'inscrire</Link>
            <Link to="/login" className="hover:text-foreground transition-colors">Connexion</Link>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 Kazi Comores. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
