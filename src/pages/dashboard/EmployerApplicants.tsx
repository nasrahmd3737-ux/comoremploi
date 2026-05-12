import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Users, Loader2, Mail, Calendar, FileText, ExternalLink } from "lucide-react";
import { notifyAdminOnAccepted } from "@/lib/notifyAdmin";

interface ApplicationWithDetails {
  id: string;
  status: string;
  created_at: string;
  cover_letter: string | null;
  cv_url: string | null;
  candidate_id: string;
  job_id: string;
  profiles: { full_name: string; email: string | null; phone: string | null; location: string | null } | null;
  jobs: { title: string; company_name: string } | null;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "En attente" },
  { value: "reviewed", label: "Examinée" },
  { value: "shortlisted", label: "Présélectionné" },
  { value: "accepted", label: "Acceptée" },
  { value: "rejected", label: "Refusée" },
];

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  reviewed: "outline",
  shortlisted: "default",
  accepted: "default",
  rejected: "destructive",
};

export default function EmployerApplicants() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchApps = async () => {
      // Get employer's jobs first
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, company_name")
        .eq("employer_id", user.id);
      if (!jobs || jobs.length === 0) { setLoading(false); return; }

      const { data: appsData } = await supabase
        .from("applications")
        .select("id, status, created_at, cover_letter, cv_url, candidate_id, job_id")
        .in("job_id", jobs.map(j => j.id))
        .order("created_at", { ascending: false });

      if (!appsData) { setLoading(false); return; }

      // Fetch candidate profiles
      const candidateIds = [...new Set(appsData.map(a => a.candidate_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone, location")
        .in("user_id", candidateIds);

      const enriched: ApplicationWithDetails[] = appsData.map(a => {
        const profile = profiles?.find(p => p.user_id === a.candidate_id);
        const job = jobs.find(j => j.id === a.job_id);
        return {
          ...a,
          profiles: profile ? { full_name: profile.full_name, email: profile.email, phone: profile.phone, location: profile.location } : null,
          jobs: job ? { title: job.title, company_name: job.company_name } : null,
        };
      });

      setApplications(enriched);
      setLoading(false);
    };
    fetchApps();
  }, [user]);

  const updateStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("applications")
      .update({ status: newStatus as any })
      .eq("id", appId);
    if (error) { toast.error(error.message); return; }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    toast.success("Statut mis à jour");

    // Notify admin when application is accepted
    if (newStatus === "accepted" && user) {
      const app = applications.find(a => a.id === appId);
      if (app) {
        notifyAdminOnAccepted({
          senderId: user.id,
          candidateName: app.profiles?.full_name ?? "Candidat",
          jobTitle: app.jobs?.title ?? "Poste",
        });
      }
    }
  };

  const viewCv = async (cvPath: string) => {
    const { data, error } = await supabase.storage.from("cvs").createSignedUrl(cvPath, 300);
    if (error || !data?.signedUrl) {
      toast.error("Impossible d'ouvrir le CV");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Candidatures reçues</h1>
        <p className="text-muted-foreground">Gérez les candidatures pour vos offres</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">Aucune candidature reçue</p>
            <p className="text-sm">Les candidatures apparaîtront ici une fois que des candidats postulent.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-lg font-semibold">{app.profiles?.full_name ?? "Candidat inconnu"}</p>
                      <Badge variant={statusColors[app.status] ?? "secondary"}>
                        {STATUS_OPTIONS.find(s => s.value === app.status)?.label ?? app.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-primary">
                      Poste : {app.jobs?.title ?? "—"}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {app.profiles?.location && (
                        <span>{app.profiles.location}</span>
                      )}
                      <span className="flex items-center gap-1 text-xs italic">
                        <Mail className="h-3.5 w-3.5" /> Coordonnées visibles uniquement par l'admin
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Postulé le {new Date(app.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {app.cover_letter && (
                      <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Lettre de motivation</p>
                        <p className="whitespace-pre-line">{app.cover_letter}</p>
                      </div>
                    )}
                    {app.cv_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 gap-1.5"
                        onClick={() => viewCv(app.cv_url!)}
                      >
                        <FileText className="h-4 w-4" />
                        Voir le CV
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="shrink-0">
                    <Select value={app.status} onValueChange={(v) => updateStatus(app.id, v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
