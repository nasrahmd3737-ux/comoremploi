import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface JobRow {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  category: string;
  created_at: string;
}

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return "Il y a 1 jour";
  if (days < 30) return `Il y a ${days} jours`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Il y a 1 mois" : `Il y a ${months} mois`;
};

const FeaturedJobsSection = () => {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("jobs")
      .select("id, title, company_name, location, job_type, category, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        setJobs((data as JobRow[]) ?? []);
        setLoading(false);
      });
  }, []);

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
          <Link to="/jobs" className="hidden md:inline-flex">
            <Button variant="ghost" className="text-primary">
              Voir toutes les offres →
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed bg-card p-10 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-muted-foreground">
              Aucune offre publiée pour le moment. Revenez bientôt !
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Link
                key={job.id}
                to={`/jobs/${job.id}`}
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
                <p className="mt-1 text-sm text-muted-foreground">{job.company_name}</p>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {job.job_type}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">{timeAgo(job.created_at)}</span>
                  <span className="text-xs text-primary">Voir l'offre →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="mt-8 text-center md:hidden">
            <Link to="/jobs"><Button variant="outline">Voir toutes les offres</Button></Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedJobsSection;
