import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Users, Eye, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationCounts, setApplicationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });
      const jobsList = jobsData ?? [];
      setJobs(jobsList);

      // Fetch application counts per job
      if (jobsList.length > 0) {
        const { data: apps } = await supabase
          .from("applications")
          .select("job_id")
          .in("job_id", jobsList.map(j => j.id));
        const counts: Record<string, number> = {};
        (apps ?? []).forEach(a => {
          counts[a.job_id] = (counts[a.job_id] || 0) + 1;
        });
        setApplicationCounts(counts);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalApps = Object.values(applicationCounts).reduce((s, c) => s + c, 0);
  const publishedJobs = jobs.filter(j => j.status === "published").length;

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mon tableau de bord</h1>
          <p className="text-muted-foreground">Gérez vos offres et candidatures</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/jobs/new" className="gap-1">
            <Briefcase className="h-4 w-4" /> Publier une offre
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-sm text-muted-foreground">Offres totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-comores-green/10">
              <Eye className="h-6 w-6 text-comores-green" />
            </div>
            <div>
              <p className="text-2xl font-bold">{publishedJobs}</p>
              <p className="text-sm text-muted-foreground">Offres actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10">
              <Users className="h-6 w-6 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalApps}</p>
              <p className="text-sm text-muted-foreground">Candidatures reçues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs list */}
      <Card>
        <CardHeader>
          <CardTitle>Mes offres d'emploi</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Aucune offre publiée</p>
              <p className="text-sm">Publiez votre première offre pour attirer des talents !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{job.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {job.company_name} · {job.location} · {job.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Publiée le {new Date(job.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={job.status === "published" ? "default" : "secondary"}>
                      {job.status === "published" ? "Active" : job.status === "closed" ? "Fermée" : "Brouillon"}
                    </Badge>
                    <Badge variant="outline">{job.job_type}</Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {applicationCounts[job.id] || 0}
                    </Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/dashboard/applicants">Voir</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
