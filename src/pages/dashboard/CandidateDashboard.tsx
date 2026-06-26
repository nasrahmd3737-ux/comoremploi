import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Clock, CheckCircle, XCircle, Loader2, Briefcase, Eye } from "lucide-react";

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

interface AvailableJob {
  id: string;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  created_at: string;
}

interface Ad {
  id: string;
  title: string;
  link_url: string;
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
  const [availableJobs, setAvailableJobs] = useState<AvailableJob[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [appsRes, jobsRes, adsRes] = await Promise.all([
        supabase
          .from("applications")
          .select("id, status, created_at, cover_letter, jobs(title, company_name, location, job_type)")
          .eq("candidate_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("id, title, company_name, location, job_type, created_at")
          .eq("status", "published")
          .order("created_at", { ascending: false })
          .limit(20),
        (supabase as any)
          .from("ads")
          .select("id, title, link_url")
          .eq("active", true)
          .order("sort_order", { ascending: true }),
      ]);
      setApplications((appsRes.data as unknown as ApplicationWithJob[]) ?? []);
      setAvailableJobs((jobsRes.data as AvailableJob[]) ?? []);
      setAds((adsRes.data as Ad[]) ?? []);
      setLoading(false);
    };
    fetchAll();
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

      {/* Mes candidatures envoyées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Mes candidatures envoyées ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Aucune candidature pour le moment</p>
              <p className="text-sm">Parcourez les offres et postulez en un clic !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Poste</TableHead><TableHead>Entreprise</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const config = statusConfig[app.status] || statusConfig.pending;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.jobs?.title ?? "Poste supprimé"}</TableCell>
                        <TableCell>{app.jobs?.company_name ?? "—"}</TableCell>
                        <TableCell>{app.jobs?.location ?? "—"}</TableCell>
                        <TableCell>{app.jobs ? <Badge variant="outline">{app.jobs.job_type}</Badge> : "—"}</TableCell>
                        <TableCell>
                          <Badge variant={config.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" /> {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(app.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offres disponibles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Offres disponibles ({availableJobs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {availableJobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Aucune offre disponible pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Poste</TableHead><TableHead>Entreprise</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Publiée le</TableHead><TableHead className="text-right">Action</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {availableJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.title}</TableCell>
                      <TableCell>{job.company_name}</TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell><Badge variant="outline">{job.job_type}</Badge></TableCell>
                      <TableCell>{new Date(job.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" asChild><Link to={`/jobs/${job.id}`}><Eye className="mr-1 h-3.5 w-3.5" /> Voir</Link></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publicités */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Publicités ({ads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {ads.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Eye className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p>Aucune publicité pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Texte</TableHead><TableHead>Lien</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {ads.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell className="font-medium">{ad.title}</TableCell>
                      <TableCell>
                        <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-xs">
                          {ad.link_url}
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
