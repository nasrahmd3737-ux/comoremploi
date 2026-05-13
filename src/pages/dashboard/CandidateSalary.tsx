import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Loader2, Briefcase, TrendingUp, Wallet } from "lucide-react";

interface ApplicationWithSalary {
  id: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    company_name: string;
    location: string;
    salary_min: number | null;
    salary_max: number | null;
    job_type: string;
  } | null;
}

const statusLabels: Record<string, string> = {
  pending: "En attente",
  reviewed: "Examinée",
  shortlisted: "Présélectionné",
  accepted: "Acceptée",
  rejected: "Refusée",
};

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  reviewed: "outline",
  shortlisted: "default",
  accepted: "default",
  rejected: "destructive",
};

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return "Non communiqué";
  if (min && max) return `${min.toLocaleString("fr-FR")} - ${max.toLocaleString("fr-FR")} KMF`;
  if (min) return `À partir de ${min.toLocaleString("fr-FR")} KMF`;
  return `Jusqu'à ${max?.toLocaleString("fr-FR")} KMF`;
}

export default function CandidateSalary() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithSalary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, jobs(title, company_name, location, salary_min, salary_max, job_type)")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });

      if (!error) {
        setApplications((data as unknown as ApplicationWithSalary[]) ?? []);
      }
      setLoading(false);
    };
    fetchApplications();
  }, [user]);

  const acceptedApps = applications.filter((a) => a.status === "accepted");
  const avgMin = acceptedApps.length
    ? Math.round(
        acceptedApps.reduce((sum, a) => sum + (a.jobs?.salary_min ?? 0), 0) /
          acceptedApps.filter((a) => a.jobs?.salary_min).length || 1
      )
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mon salaire</h1>
        <p className="text-muted-foreground">
          Suivez les rémunérations des offres auxquelles vous avez postulé
        </p>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{applications.length}</p>
              <p className="text-sm text-muted-foreground">Candidatures</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-comores-green/10">
              <TrendingUp className="h-6 w-6 text-comores-green" />
            </div>
            <div>
              <p className="text-2xl font-bold">{acceptedApps.length}</p>
              <p className="text-sm text-muted-foreground">Offres acceptées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
              <Wallet className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {avgMin > 0 ? `${avgMin.toLocaleString("fr-FR")} KMF` : "—"}
              </p>
              <p className="text-sm text-muted-foreground">Salaire moyen estimé</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Détail par offre
          </CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <DollarSign className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Aucune candidature pour le moment</p>
              <p className="text-sm">
                Postulez à des offres pour voir les rémunérations ici.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium">{app.jobs?.title ?? "Poste supprimé"}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.jobs?.company_name} · {app.jobs?.location}
                      </p>
                    </div>
                    <Badge variant={statusColors[app.status] ?? "secondary"}>
                      {statusLabels[app.status] ?? app.status}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Rémunération :</span>
                      <span className="font-semibold">
                        {formatSalary(app.jobs?.salary_min ?? null, app.jobs?.salary_max ?? null)}
                      </span>
                    </div>
                    {app.jobs?.job_type && (
                      <div className="text-muted-foreground">
                        Type : <span className="font-medium text-foreground">{app.jobs.job_type}</span>
                      </div>
                    )}
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
