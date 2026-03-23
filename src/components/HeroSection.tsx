import { Button } from "@/components/ui/button";
import { Search, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="bg-hero-gradient relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.2) 0%, transparent 50%), radial-gradient(circle at 75% 20%, rgba(255,255,255,0.15) 0%, transparent 40%)'
      }} />

      <div className="container relative px-4 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/90">
            <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
            +200 offres disponibles aux Comores
          </div>

          <h1 className="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">
            Trouvez l'emploi de vos{" "}
            <span className="relative">
              rêves aux Comores
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M2 8C50 3 150 2 298 8" stroke="hsl(49, 97%, 54%)" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </span>
          </h1>

          <p className="mt-6 text-lg text-white/80 md:text-xl">
            La première plateforme d'emploi dédiée aux Comores. Connectez talents et opportunités à Moroni, Mutsamudu, Fomboni et au-delà.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" variant="secondary" className="w-full gap-2 text-base sm:w-auto" asChild>
              <Link to="/signup">
                <Search className="h-5 w-5" />
                Chercher un emploi
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2 border-white/30 text-base text-white hover:bg-white/10 sm:w-auto" asChild>
              <Link to="/signup?role=employer">
                Publier une offre
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <span>✓ Inscription gratuite</span>
            <span>✓ Candidature en un clic</span>
            <span>✓ 100% Comores</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
