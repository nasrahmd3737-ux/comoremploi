import { MapPin, Clock, Banknote, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const featuredJobs = [
  {
    id: 1,
    title: "Développeur Web Full-Stack",
    company: "Comores Digital",
    location: "Moroni",
    type: "CDI",
    salary: "400 000 - 600 000 KMF",
    posted: "Il y a 2 jours",
    category: "Technologie",
  },
  {
    id: 2,
    title: "Responsable Hôtelier",
    company: "Golden Tulip Moroni",
    location: "Moroni",
    type: "CDI",
    salary: "500 000 - 800 000 KMF",
    posted: "Il y a 3 jours",
    category: "Tourisme",
  },
  {
    id: 3,
    title: "Comptable Senior",
    company: "BIC Comores",
    location: "Mutsamudu",
    type: "CDI",
    salary: "350 000 - 500 000 KMF",
    posted: "Il y a 1 jour",
    category: "Administration",
  },
  {
    id: 4,
    title: "Chef de Chantier",
    company: "COLAS Comores",
    location: "Fomboni",
    type: "CDD",
    salary: "450 000 - 700 000 KMF",
    posted: "Il y a 5 jours",
    category: "Construction",
  },
  {
    id: 5,
    title: "Enseignant d'Anglais",
    company: "Lycée de Moroni",
    location: "Moroni",
    type: "CDD",
    salary: "250 000 - 350 000 KMF",
    posted: "Il y a 1 jour",
    category: "Éducation",
  },
  {
    id: 6,
    title: "Infirmier(e) Diplômé(e)",
    company: "CHN El-Maarouf",
    location: "Moroni",
    type: "CDI",
    salary: "300 000 - 450 000 KMF",
    posted: "Il y a 4 jours",
    category: "Santé",
  },
];

const FeaturedJobsSection = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-24">
      <div className="container px-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
              Offres récentes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Les dernières opportunités publiées sur la plateforme
            </p>
          </div>
          <Button variant="ghost" className="hidden text-primary md:inline-flex">
            Voir toutes les offres →
          </Button>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="group rounded-xl border bg-card p-6 bg-card-hover cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {job.category}
                </Badge>
              </div>

              <h3 className="mt-4 font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {job.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>

              <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {job.type}
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-3.5 w-3.5" />
                  {job.salary}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">{job.posted}</span>
                <Button size="sm" variant="ghost" className="text-primary text-xs">
                  Postuler →
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Button variant="outline">Voir toutes les offres</Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobsSection;
