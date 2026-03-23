import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface ApplicationWithJob {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  jobs: {
    title: string;
    company_name: string;
    location: string;
    job_type: string;
  } | null;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
  pending: { label: "En attente", variant: "secondary", icon: Clock },
  reviewed: { label: "Examinée", variant: "outline", icon: FileText },
  shortlisted: { label: "Présélectionné", variant: "default", icon: CheckCircle },
  accepted: { label: "Acceptée", variant: "default", icon: CheckCircle },
  rejected: { label: "Refusée", variant: "destructive", icon: XCircle },
};

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchApplications = async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, jobs(title, company_name, location, job_type)")
        .eq("candidate_id", user.id)
        .order("created_at", { ascending: false });
      setApplications((data as unknown as ApplicationWithJob[]) ?? []);
      setLoading(false);
    };
    fetchApplications();
  }, [user]);

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === "pending").length,
    shortlisted: applications.filter(a => ["shortlisted", "accepted"].includes(a.status)).length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mon tableau de bord</h1>
        <p className="text-muted-foreground">Suivez vos candidatures en temps réel</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Candidatures</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-comores-green/10">
              <CheckCircle className="h-6 w-6 text-comores-green" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.shortlisted}</p>
              <p className="text-sm text-muted-foreground">Présélectionné</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
              <p className="text-sm text-muted-foreground">Refusées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications list */}
      <Card>
        <CardHeader>
          <CardTitle>Mes candidatures</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Aucune candidature pour le moment</p>
              <p className="text-sm">Parcourez les offres et postulez en un clic !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const config = statusConfig[app.status] || statusConfig.pending;
                const StatusIcon = config.icon;
                return (
                  <div key={app.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{app.jobs?.title ?? "Poste supprimé"}</p>
                      <p className="text-sm text-muted-foreground">
                        {app.jobs?.company_name} · {app.jobs?.location}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Postulé le {new Date(app.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} className="gap-1">
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                      {app.jobs && (
                        <Badge variant="outline">{app.jobs.job_type}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
