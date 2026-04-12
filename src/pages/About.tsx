import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Briefcase, Users, MapPin, Heart, Target, Shield } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-hero-gradient py-16">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">À propos de Comores Emploi</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-white/80">
            La première plateforme d'emploi dédiée aux Comores, connectant talents et employeurs à travers tout l'archipel.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="container px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold">Notre Mission</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Comores Emploi a été créé pour répondre à un besoin essentiel : faciliter la mise en relation entre les demandeurs d'emploi et les entreprises aux Comores. 
            Notre plateforme vise à réduire le chômage, valoriser les compétences locales et accompagner le développement économique de l'Union des Comores.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-muted/50 py-16">
        <div className="container px-4">
          <h2 className="font-display text-2xl font-bold text-center mb-12">Nos Valeurs</h2>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Accessibilité</h3>
              <p className="mt-2 text-sm text-muted-foreground">Un accès gratuit et simple pour tous les chercheurs d'emploi des quatre îles.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Confiance</h3>
              <p className="mt-2 text-sm text-muted-foreground">Chaque offre est vérifiée par notre équipe pour garantir la fiabilité des annonces.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Heart className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold">Proximité</h3>
              <p className="mt-2 text-sm text-muted-foreground">Une équipe locale qui comprend les réalités du marché de l'emploi comorien.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container px-4 py-16">
        <h2 className="font-display text-2xl font-bold text-center mb-12">Ce que nous offrons</h2>
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="flex items-start gap-4 rounded-xl border p-6">
            <Briefcase className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-display font-semibold">Offres d'emploi</h3>
              <p className="mt-1 text-sm text-muted-foreground">Des offres vérifiées dans tous les secteurs : technologie, tourisme, administration, santé, éducation et plus.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border p-6">
            <Users className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-display font-semibold">CV Builder</h3>
              <p className="mt-1 text-sm text-muted-foreground">Créez votre CV professionnel en ligne gratuitement et postulez en un clic.</p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border p-6">
            <MapPin className="h-8 w-8 text-primary shrink-0" />
            <div>
              <h3 className="font-display font-semibold">Couverture nationale</h3>
              <p className="mt-1 text-sm text-muted-foreground">Grande Comore, Anjouan, Mohéli et Mayotte — toutes les îles sont couvertes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16">
        <div className="container px-4 max-w-3xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-10">Comment ça marche ?</h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
              <div>
                <h3 className="font-semibold">Créez votre compte</h3>
                <p className="text-sm text-muted-foreground">Inscrivez-vous gratuitement en tant que candidat ou employeur.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
              <div>
                <h3 className="font-semibold">Complétez votre profil</h3>
                <p className="text-sm text-muted-foreground">Ajoutez vos compétences, votre CV et vos informations professionnelles.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
              <div>
                <h3 className="font-semibold">Postulez ou recrutez</h3>
                <p className="text-sm text-muted-foreground">Candidats : postulez en 1 clic. Employeurs : publiez vos offres et recevez des candidatures qualifiées.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
