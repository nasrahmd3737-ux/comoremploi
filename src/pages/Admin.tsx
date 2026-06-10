import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Briefcase, Users, Plus, Trash2, Shield, Loader2, FileText, CheckCircle, DollarSign, MessageSquare, MapPin, Clock, Banknote, ListChecks, Eye, Building2, UserCog, ClipboardList, Phone, Mail, MapPinned, User as UserIcon } from "lucide-react";
import Logo from "@/components/Logo";
import ChatWidget from "@/components/ChatWidget";
import AdBannerPreview from "@/components/AdBannerPreview";
import { ISLANDS, formatLocation } from "@/lib/locations";
import { notifyAdminOnAccepted } from "@/lib/notifyAdmin";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Job = Tables<"jobs">;

interface ApplicationFull {
  id: string;
  status: string;
  created_at: string;
  candidate_id: string;
  job_id: string;
  cover_letter: string | null;
  profiles: { full_name: string; email: string | null; phone: string | null; location: string | null } | null;
  jobs: { title: string; company_name: string; salary_min: number | null; salary_max: number | null; job_type: string; employer_id: string } | null;
}

interface AdminTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

const CATEGORIES = ["Technologie", "Tourisme", "Administration", "Construction", "Éducation", "Santé", "Commerce", "Autre"];

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", reviewed: "Examinée", shortlisted: "Présélectionné", accepted: "Acceptée", rejected: "Refusée",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary", reviewed: "outline", shortlisted: "default", accepted: "default", rejected: "destructive",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  pending: "À faire", in_progress: "En cours", done: "Terminée",
};
const TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "Basse", medium: "Moyenne", high: "Haute",
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const Admin = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationFull[]>([]);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const navigate = useNavigate();

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";

  const [jobIsland, setJobIsland] = useState("Grande Comore");
  const [jobCity, setJobCity] = useState("Moroni");
  const [jobForm, setJobForm] = useState({
    title: "", description: "", company_name: "",
    category: "Technologie", job_type: "CDI" as "CDI" | "CDD" | "Stage" | "Freelance",
    salary_min: "", salary_max: "", requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [viewingJob, setViewingJob] = useState<Job | null>(null);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null);

  // Task form state
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Ads (Pub) state
  type Ad = { id: string; title: string; link_url: string; active: boolean; sort_order: number };
  const [ads, setAds] = useState<Ad[]>([]);
  const [adForm, setAdForm] = useState({ title: "", link_url: "", sort_order: "0" });
  const [adSubmitting, setAdSubmitting] = useState(false);

  const fetchAds = async () => {
    const { data } = await (supabase as any)
      .from("ads")
      .select("id, title, link_url, active, sort_order")
      .order("sort_order", { ascending: true });
    setAds((data as Ad[]) ?? []);
  };

  useEffect(() => { if (isAdmin) fetchAds(); }, [role]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdSubmitting(true);
    const { error } = await (supabase as any).from("ads").insert({
      title: adForm.title,
      link_url: adForm.link_url,
      sort_order: parseInt(adForm.sort_order) || 0,
      active: true,
    });
    setAdSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Pub ajoutée");
    setAdForm({ title: "", link_url: "", sort_order: "0" });
    fetchAds();
  };

  const toggleAd = async (ad: Ad) => {
    const { error } = await (supabase as any).from("ads").update({ active: !ad.active }).eq("id", ad.id);
    if (error) { toast.error(error.message); return; }
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    const { error } = await (supabase as any).from("ads").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Pub supprimée");
    fetchAds();
  };

  useEffect(() => {
    if (isAdmin || isModerator) fetchData();
  }, [role]);

  const fetchData = async () => {
    setLoadingData(true);
    const [profilesRes, jobsRes, appsRes, tasksRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("id, status, created_at, candidate_id, job_id, cover_letter").order("created_at", { ascending: false }),
      supabase.from("admin_tasks").select("*").order("created_at", { ascending: false }),
    ]);
    const allProfiles = profilesRes.data ?? [];
    const allJobs = jobsRes.data ?? [];
    setProfiles(allProfiles);
    setJobs(allJobs);
    setAdminTasks((tasksRes.data as AdminTask[]) ?? []);

    const enrichedApps: ApplicationFull[] = (appsRes.data ?? []).map(a => {
      const profile = allProfiles.find(p => p.user_id === a.candidate_id);
      const job = allJobs.find(j => j.id === a.job_id);
      return {
        ...a,
        profiles: profile ? { full_name: profile.full_name, email: profile.email, phone: profile.phone, location: profile.location } : null,
        jobs: job ? { title: job.title, company_name: job.company_name, salary_min: job.salary_min, salary_max: job.salary_max, job_type: job.job_type, employer_id: job.employer_id } : null,
      };
    });
    setApplications(enrichedApps);
    setLoadingData(false);
  };

  const openDeleteDialog = (profile: Profile) => {
    if (profile.role === "admin") {
      toast.error("Le compte administrateur ne peut pas être supprimé");
      return;
    }
    setDeleteTarget(profile);
    setDeleteConfirmText("");
  };

  const handleDeleteProfile = async () => {
    if (!deleteTarget || deleteConfirmText !== "oui je veux supprimer mon compte") return;
    const { error } = await supabase.from("profiles").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Profil supprimé");
    setProfiles(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handlePromoteToModerator = async (profile: Profile) => {
    // Update user_roles
    const { error: roleError } = await supabase.from("user_roles").update({ role: "moderator" as any }).eq("user_id", profile.user_id);
    if (roleError) { toast.error("Erreur rôle: " + roleError.message); return; }
    // Update profile role
    const { error: profileError } = await supabase.from("profiles").update({ role: "moderator" as any }).eq("user_id", profile.user_id);
    if (profileError) { toast.error("Erreur profil: " + profileError.message); return; }
    toast.success(`${profile.full_name} est maintenant modérateur`);
    setProfiles(prev => prev.map(p => p.user_id === profile.user_id ? { ...p, role: "moderator" as any } : p));
  };

  const handleDemoteFromModerator = async (profile: Profile) => {
    const newRole = "candidate";
    const { error: roleError } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", profile.user_id);
    if (roleError) { toast.error("Erreur: " + roleError.message); return; }
    const { error: profileError } = await supabase.from("profiles").update({ role: newRole as any }).eq("user_id", profile.user_id);
    if (profileError) { toast.error("Erreur: " + profileError.message); return; }
    toast.success(`${profile.full_name} n'est plus modérateur`);
    setProfiles(prev => prev.map(p => p.user_id === profile.user_id ? { ...p, role: newRole as any } : p));
  };

  const handleDeleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Offre supprimée");
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleToggleJobStatus = async (job: Job) => {
    const current = job.status as string;
    const newStatus = current === "published" ? "closed" : "published";
    const { error } = await supabase.from("jobs").update({ status: newStatus as any }).eq("id", job.id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus as any } : j));
    toast.success(newStatus === "published" ? "Offre validée et publiée" : "Offre fermée");
  };

  const handleValidateJob = async (job: Job) => {
    const { error } = await supabase.from("jobs").update({ status: "published" as any }).eq("id", job.id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: "published" as any } : j));
    toast.success(`Offre "${job.title}" validée et publiée !`);
  };

  const handleUpdateAppStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase.from("applications").update({ status: newStatus as any }).eq("id", appId);
    if (error) { toast.error(error.message); return; }
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    toast.success("Statut mis à jour");

    // Notify admin when application is accepted (by a non-admin, e.g. moderator)
    if (newStatus === "accepted" && user && !isAdmin) {
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

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      title: jobForm.title, description: jobForm.description, company_name: jobForm.company_name,
      location: formatLocation(jobIsland, jobCity), category: jobForm.category, job_type: jobForm.job_type,
      salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
      salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      requirements: jobForm.requirements ? jobForm.requirements.split("\n").filter(Boolean) : null,
      employer_id: user.id, status: "published",
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Offre créée !");
    setJobForm({ title: "", description: "", company_name: "", category: "Technologie", job_type: "CDI", salary_min: "", salary_max: "", requirements: "" });
    setJobIsland("Grande Comore"); setJobCity("Moroni");
    fetchData();
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskForm.assigned_to) return;
    setTaskSubmitting(true);
    const { error } = await supabase.from("admin_tasks").insert({
      title: taskForm.title,
      description: taskForm.description || null,
      assigned_to: taskForm.assigned_to,
      assigned_by: user.id,
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
    } as any);
    setTaskSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Tâche assignée !");
    setTaskForm({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
    fetchData();
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    const { error } = await supabase.from("admin_tasks").update({ status: newStatus } as any).eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    setAdminTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    toast.success("Statut de la tâche mis à jour");
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("admin_tasks").delete().eq("id", taskId);
    if (error) { toast.error(error.message); return; }
    setAdminTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success("Tâche supprimée");
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("La déconnexion a échoué, veuillez réessayer.");
      return;
    }

    navigate("/", { replace: true });
    toast.success("Déconnexion réussie");
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || (!isAdmin && !isModerator)) return <Navigate to="/" replace />;

  const acceptedApps = applications.filter(a => a.status === "accepted");

  const employerMap = new Map<string, string>();
  profiles.forEach(p => { employerMap.set(p.user_id, p.full_name); });

  const totalSalary = acceptedApps.reduce((sum, a) => {
    const salary = a.jobs?.salary_max ?? a.jobs?.salary_min ?? 0;
    return sum + salary;
  }, 0);

  // Get moderators for task assignment
  const moderators = profiles.filter(p => p.role === "moderator" as any);

  // Get profile name by user_id helper
  const getProfileName = (userId: string) => profiles.find(p => p.user_id === userId)?.full_name ?? "—";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" /> {isAdmin ? "Admin" : "Modérateur"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>Déconnexion</Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold md:text-3xl">
          {isAdmin ? "Tableau de bord Admin" : "Tableau de bord Modérateur"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {isAdmin ? "Gérez les utilisateurs, offres, candidatures et finances" : "Gérez les offres, candidatures et vos tâches assignées"}
        </p>

        {/* Stats cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{profiles.length}</p><p className="text-sm text-muted-foreground">Utilisateurs</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-comores-green/10"><Briefcase className="h-5 w-5 text-comores-green" /></div>
            <div><p className="text-2xl font-bold">{jobs.length}</p><p className="text-sm text-muted-foreground">Offres</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10"><FileText className="h-5 w-5 text-gold" /></div>
            <div><p className="text-2xl font-bold">{applications.length}</p><p className="text-sm text-muted-foreground">Candidatures</p></div>
          </CardContent></Card>
          <Card><CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-comores-green/10"><CheckCircle className="h-5 w-5 text-comores-green" /></div>
            <div><p className="text-2xl font-bold">{acceptedApps.length}</p><p className="text-sm text-muted-foreground">Embauchés</p></div>
          </CardContent></Card>
        </div>

        <Tabs defaultValue={isModerator ? "tasks" : "users"} className="mt-8">
          <TabsList className="flex w-full max-w-3xl flex-wrap">
            {isAdmin && <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" /> Utilisateurs</TabsTrigger>}
            <TabsTrigger value="jobs" className="gap-1"><Briefcase className="h-4 w-4" /> Offres</TabsTrigger>
            <TabsTrigger value="applications" className="gap-1"><FileText className="h-4 w-4" /> Candidatures</TabsTrigger>
            <TabsTrigger value="tasks" className="gap-1"><ClipboardList className="h-4 w-4" /> Tâches</TabsTrigger>
            {isAdmin && <TabsTrigger value="hired" className="gap-1"><CheckCircle className="h-4 w-4" /> Embauchés</TabsTrigger>}
            {isAdmin && <TabsTrigger value="finance" className="gap-1"><DollarSign className="h-4 w-4" /> Finance</TabsTrigger>}
            {isAdmin && <TabsTrigger value="messages" className="gap-1"><MessageSquare className="h-4 w-4" /> Messages</TabsTrigger>}
            {isAdmin && <TabsTrigger value="create" className="gap-1"><Plus className="h-4 w-4" /> Publier</TabsTrigger>}
            {isAdmin && <TabsTrigger value="ads" className="gap-1"><Eye className="h-4 w-4" /> Pub</TabsTrigger>}
          </TabsList>

          {/* Users - Admin only */}
          {isAdmin && (
            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Profils ({profiles.length})</CardTitle></CardHeader>
                <CardContent>
                  {loadingData ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Localisation</TableHead><TableHead>Inscrit le</TableHead><TableHead className="text-right">Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {profiles.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                <button className="text-left hover:text-primary hover:underline transition-colors" onClick={() => setViewingProfile(p)}>{p.full_name}</button>
                              </TableCell>
                              <TableCell>{p.email ?? "—"}</TableCell>
                              <TableCell>
                                <Badge variant={p.role === "employer" ? "default" : p.role === "moderator" as any ? "outline" : "secondary"}>
                                  {p.role === "employer" ? "Employeur" : p.role === "admin" ? "Admin" : p.role === ("moderator" as any) ? "Modérateur" : "Candidat"}
                                </Badge>
                              </TableCell>
                              <TableCell>{p.location ?? "—"}</TableCell>
                              <TableCell>{new Date(p.created_at).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell className="text-right space-x-1">
                                {p.role !== "admin" && p.role !== ("moderator" as any) && (
                                  <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePromoteToModerator(p)}>
                                    <UserCog className="h-3 w-3" /> Modérateur
                                  </Button>
                                )}
                                {p.role === ("moderator" as any) && (
                                  <Button variant="secondary" size="sm" className="gap-1" onClick={() => handleDemoteFromModerator(p)}>
                                    <UserCog className="h-3 w-3" /> Retirer
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(p)} disabled={p.role === "admin"}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {profiles.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun utilisateur</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Jobs */}
          <TabsContent value="jobs" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Offres ({jobs.length})</CardTitle></CardHeader>
              <CardContent>
                {loadingData ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Titre</TableHead><TableHead>Entreprise</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Vues</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {jobs.map(j => {
                          const status = j.status as string;
                          const statusLabel = status === "published" ? "Publiée" : status === "draft" ? "À valider" : "Fermée";
                          const statusVariant: "default" | "secondary" | "outline" | "destructive" = status === "published" ? "default" : status === "draft" ? "destructive" : "secondary";
                          return (
                          <TableRow key={j.id} className={status === "draft" ? "bg-destructive/5" : ""}>
                            <TableCell className="font-medium">
                              <button className="text-left hover:text-primary hover:underline transition-colors" onClick={() => setViewingJob(j)}>{j.title}</button>
                            </TableCell>
                            <TableCell>{j.company_name}</TableCell>
                            <TableCell>{j.location}</TableCell>
                            <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                            <TableCell><span className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="h-3.5 w-3.5" />{(j as any).views_count ?? 0}</span></TableCell>
                            <TableCell><Badge variant={statusVariant}>{statusLabel}</Badge></TableCell>
                            <TableCell>{new Date(j.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewingJob(j)}><Eye className="h-4 w-4" /></Button>
                              {status === "draft" && (
                                <Button variant="default" size="sm" onClick={() => handleValidateJob(j)} className="gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" /> Valider
                                </Button>
                              )}
                              {status !== "draft" && (
                                <Button variant="outline" size="sm" onClick={() => handleToggleJobStatus(j)}>{status === "published" ? "Fermer" : "Rouvrir"}</Button>
                              )}
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteJob(j.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                        {jobs.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Aucune offre</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Applications */}
          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Toutes les candidatures ({applications.length})</CardTitle></CardHeader>
              <CardContent>
                {loadingData ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Candidat</TableHead><TableHead>Email</TableHead><TableHead>Poste</TableHead><TableHead>Entreprise</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {applications.map(a => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">
                              {a.profiles ? (
                                <button className="text-left hover:text-primary hover:underline transition-colors" onClick={() => {
                                  const p = profiles.find(pr => pr.user_id === a.candidate_id);
                                  if (p) setViewingProfile(p);
                                }}>{a.profiles.full_name}</button>
                              ) : "—"}
                            </TableCell>
                            <TableCell>{a.profiles?.email ?? "—"}</TableCell>
                            <TableCell>{a.jobs?.title ?? "—"}</TableCell>
                            <TableCell>{a.jobs?.company_name ?? "—"}</TableCell>
                            <TableCell><Badge variant={STATUS_VARIANTS[a.status] ?? "secondary"}>{STATUS_LABELS[a.status] ?? a.status}</Badge></TableCell>
                            <TableCell>{new Date(a.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right">
                              <Select value={a.status} onValueChange={v => handleUpdateAppStatus(a.id, v)}>
                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                        {applications.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune candidature</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tasks */}
          <TabsContent value="tasks" className="mt-6">
            <div className="space-y-6">
              {/* Task assignment form - Admin only */}
              {isAdmin && (
                <Card className="max-w-2xl">
                  <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Assigner une tâche</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateTask} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Titre de la tâche</Label>
                          <Input required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Vérifier les offres" />
                        </div>
                        <div className="space-y-2">
                          <Label>Assigner à</Label>
                          <Select value={taskForm.assigned_to} onValueChange={v => setTaskForm(f => ({ ...f, assigned_to: v }))}>
                            <SelectTrigger><SelectValue placeholder="Choisir un modérateur" /></SelectTrigger>
                            <SelectContent>
                              {moderators.map(m => (
                                <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>
                              ))}
                              {moderators.length === 0 && <SelectItem value="" disabled>Aucun modérateur</SelectItem>}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea rows={3} value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de la tâche..." />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Priorité</Label>
                          <Select value={taskForm.priority} onValueChange={v => setTaskForm(f => ({ ...f, priority: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Basse</SelectItem>
                              <SelectItem value="medium">Moyenne</SelectItem>
                              <SelectItem value="high">Haute</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date limite</Label>
                          <Input type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))} />
                        </div>
                      </div>
                      <Button type="submit" disabled={taskSubmitting || !taskForm.assigned_to}>
                        {taskSubmitting ? "Assignation..." : "Assigner la tâche"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Task list */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" /> 
                    {isModerator ? "Mes tâches" : "Toutes les tâches"} ({adminTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {adminTasks.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <ClipboardList className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p>Aucune tâche pour le moment</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Tâche</TableHead>
                          <TableHead>Assigné à</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Échéance</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {adminTasks.map(t => (
                            <TableRow key={t.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{t.title}</p>
                                  {t.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>}
                                </div>
                              </TableCell>
                              <TableCell>{getProfileName(t.assigned_to)}</TableCell>
                              <TableCell>
                                <Badge variant={t.priority === "high" ? "destructive" : t.priority === "medium" ? "default" : "secondary"}>
                                  {TASK_PRIORITY_LABELS[t.priority] ?? t.priority}
                                </Badge>
                              </TableCell>
                              <TableCell>{t.due_date ? new Date(t.due_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                              <TableCell>
                                <Select value={t.status} onValueChange={v => handleUpdateTaskStatus(t.id, v)}>
                                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteTask(t.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
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
          </TabsContent>

          {/* Hired / Accepted - Admin only */}
          {isAdmin && (
            <TabsContent value="hired" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Candidats embauchés ({acceptedApps.length})</CardTitle></CardHeader>
                <CardContent>
                  {acceptedApps.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">
                      <CheckCircle className="mx-auto mb-3 h-12 w-12 opacity-30" />
                      <p>Aucun candidat embauché pour le moment</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Candidat</TableHead><TableHead>Email</TableHead><TableHead>Téléphone</TableHead><TableHead>Localisation</TableHead><TableHead>Poste</TableHead><TableHead>Entreprise</TableHead><TableHead>Date d'embauche</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {acceptedApps.map(a => (
                            <TableRow key={a.id}>
                              <TableCell className="font-medium">{a.profiles?.full_name ?? "—"}</TableCell>
                              <TableCell>{a.profiles?.email ?? "—"}</TableCell>
                              <TableCell>{a.profiles?.phone ?? "—"}</TableCell>
                              <TableCell>{a.profiles?.location ?? "—"}</TableCell>
                              <TableCell>{a.jobs?.title ?? "—"}</TableCell>
                              <TableCell>{a.jobs?.company_name ?? "—"}</TableCell>
                              <TableCell>{new Date(a.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Finance - Admin only */}
          {isAdmin && (
            <TabsContent value="finance" className="mt-6">
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Card><CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-comores-green/10"><DollarSign className="h-6 w-6 text-comores-green" /></div>
                    <div><p className="text-2xl font-bold">{fmt(totalSalary)} KMF</p><p className="text-sm text-muted-foreground">Masse salariale totale</p></div>
                  </CardContent></Card>
                  <Card><CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
                    <div><p className="text-2xl font-bold">{acceptedApps.length}</p><p className="text-sm text-muted-foreground">Employés actifs</p></div>
                  </CardContent></Card>
                  <Card><CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10"><DollarSign className="h-6 w-6 text-gold" /></div>
                    <div><p className="text-2xl font-bold">{acceptedApps.length > 0 ? fmt(Math.round(totalSalary / acceptedApps.length)) : 0} KMF</p><p className="text-sm text-muted-foreground">Salaire moyen</p></div>
                  </CardContent></Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Détail des salaires</CardTitle></CardHeader>
                  <CardContent>
                    {acceptedApps.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground">
                        <DollarSign className="mx-auto mb-3 h-12 w-12 opacity-30" />
                        <p>Aucun employé pour le moment</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader><TableRow>
                            <TableHead>Employé</TableHead><TableHead>Poste</TableHead><TableHead>Employeur</TableHead><TableHead>Type de contrat</TableHead><TableHead>Salaire min</TableHead><TableHead>Salaire max</TableHead><TableHead>Statut</TableHead>
                          </TableRow></TableHeader>
                          <TableBody>
                            {acceptedApps.map(a => {
                              const employerName = a.jobs?.employer_id ? (employerMap.get(a.jobs.employer_id) ?? a.jobs.company_name ?? "—") : (a.jobs?.company_name ?? "—");
                              const contractType = a.jobs?.job_type ?? "—";
                              return (
                                <TableRow key={a.id}>
                                  <TableCell className="font-medium">{a.profiles?.full_name ?? "—"}</TableCell>
                                  <TableCell>{a.jobs?.title ?? "—"}</TableCell>
                                  <TableCell>{employerName}</TableCell>
                                  <TableCell><Badge variant="outline">{contractType}</Badge></TableCell>
                                  <TableCell>{a.jobs?.salary_min ? `${fmt(a.jobs.salary_min)} KMF` : "—"}</TableCell>
                                  <TableCell>{a.jobs?.salary_max ? `${fmt(a.jobs.salary_max)} KMF` : "—"}</TableCell>
                                  <TableCell><Badge variant="default">Embauché</Badge></TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Messages - Admin only */}
          {isAdmin && (
            <TabsContent value="messages" className="mt-6">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Messagerie</CardTitle></CardHeader>
                <CardContent>
                  {user && <ChatWidget userId={user.id} userRole={role ?? undefined} height="500px" />}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Create Job - Admin only */}
          {isAdmin && (
            <TabsContent value="create" className="mt-6">
              <Card className="max-w-2xl">
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Publier une offre</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateJob} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Titre du poste</Label><Input required value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Développeur Web" /></div>
                      <div className="space-y-2"><Label>Entreprise</Label><Input required value={jobForm.company_name} onChange={e => setJobForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Nom de l'entreprise" /></div>
                    </div>
                    <div className="space-y-2"><Label>Description</Label><Textarea required rows={4} value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez le poste..." /></div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="space-y-2"><Label>Île</Label>
                        <Select value={jobIsland} onValueChange={v => { setJobIsland(v); setJobCity(ISLANDS[v]?.[0] ?? ""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(ISLANDS).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-2"><Label>Ville</Label>
                        <Select value={jobCity} onValueChange={setJobCity}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(ISLANDS[jobIsland] ?? []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-2"><Label>Catégorie</Label>
                        <Select value={jobForm.category} onValueChange={v => setJobForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                      </div>
                      <div className="space-y-2"><Label>Type</Label>
                        <Select value={jobForm.job_type} onValueChange={v => setJobForm(f => ({ ...f, job_type: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem><SelectItem value="CDD">CDD</SelectItem><SelectItem value="Stage">Stage</SelectItem><SelectItem value="Freelance">Freelance</SelectItem>
                        </SelectContent></Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label>Salaire min (KMF)</Label><Input type="number" value={jobForm.salary_min} onChange={e => setJobForm(f => ({ ...f, salary_min: e.target.value }))} placeholder="150000" /></div>
                      <div className="space-y-2"><Label>Salaire max (KMF)</Label><Input type="number" value={jobForm.salary_max} onChange={e => setJobForm(f => ({ ...f, salary_max: e.target.value }))} placeholder="300000" /></div>
                    </div>
                    <div className="space-y-2"><Label>Prérequis (un par ligne)</Label><Textarea rows={3} value={jobForm.requirements} onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))} placeholder={"Bac+3 en informatique\n2 ans d'expérience"} /></div>
                    <Button type="submit" disabled={submitting}>{submitting ? "Publication..." : "Publier l'offre"}</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Ads / Pub - Admin only */}
          {isAdmin && (
            <TabsContent value="ads" className="mt-6 space-y-6">
              {/* Live preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" /> Aperçu en direct de la bordure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AdBannerPreview ads={ads} />
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Ajouter une pub</CardTitle></CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateAd} className="space-y-4">
                      <div className="space-y-2"><Label>Texte de la pub</Label>
                        <Input required value={adForm.title} onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: 🌴 Découvrez Comorese.com" />
                      </div>
                      <div className="space-y-2"><Label>Lien (URL)</Label>
                        <Input required type="url" value={adForm.link_url} onChange={e => setAdForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
                      </div>
                      <div className="space-y-2"><Label>Ordre d'affichage</Label>
                        <Input type="number" value={adForm.sort_order} onChange={e => setAdForm(f => ({ ...f, sort_order: e.target.value }))} />
                      </div>
                      <Button type="submit" disabled={adSubmitting}>{adSubmitting ? "Ajout..." : "Ajouter la pub"}</Button>
                    </form>
                    <p className="mt-4 text-xs text-muted-foreground">Les pubs actives défilent en haut du site sur la bordure.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5" /> Pubs ({ads.length})</CardTitle></CardHeader>
                  <CardContent>
                    {ads.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucune pub pour le moment.</p>
                    ) : (
                      <div className="space-y-3">
                        {ads.map(ad => (
                          <div key={ad.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-sm">{ad.title}</p>
                              <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="truncate block text-xs text-primary hover:underline">{ad.link_url}</a>
                            </div>
                            <Badge variant={ad.active ? "default" : "secondary"}>{ad.active ? "Active" : "Inactive"}</Badge>
                            <Button size="sm" variant="outline" onClick={() => toggleAd(ad)}>{ad.active ? "Désactiver" : "Activer"}</Button>
                            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAd(ad.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Supprimer le compte</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de supprimer le compte de <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.email}).
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>Pour confirmer, écrivez : <strong className="text-destructive">oui je veux supprimer mon compte</strong></Label>
            <Input
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Tapez la phrase de confirmation..."
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "oui je veux supprimer mon compte"}
              onClick={handleDeleteProfile}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Detail Dialog */}
      <Dialog open={!!viewingJob} onOpenChange={open => { if (!open) setViewingJob(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewingJob && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Briefcase className="h-5 w-5 text-primary" /> {viewingJob.title}
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" /> {viewingJob.company_name}</span>
                  {(() => {
                    const st = viewingJob.status as string;
                    return (
                      <Badge variant={st === "published" ? "default" : st === "draft" ? "destructive" : "secondary"}>
                        {st === "published" ? "Publiée" : st === "draft" ? "À valider" : "Fermée"}
                      </Badge>
                    );
                  })()}
                  <span className="flex items-center gap-1 text-xs"><Eye className="h-3.5 w-3.5" /> {(viewingJob as any).views_count ?? 0} vue{((viewingJob as any).views_count ?? 0) !== 1 ? "s" : ""}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-muted-foreground text-xs">Localisation</p><p className="font-medium">{viewingJob.location}</p></div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Briefcase className="h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-muted-foreground text-xs">Type de contrat</p><p className="font-medium">{viewingJob.job_type}</p></div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-muted-foreground text-xs">Catégorie</p><p className="font-medium">{viewingJob.category}</p></div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <div><p className="text-muted-foreground text-xs">Publiée le</p><p className="font-medium">{new Date(viewingJob.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                  </div>
                </div>

                {(viewingJob.salary_min || viewingJob.salary_max) && (
                  <div className="flex items-center gap-2 rounded-lg border border-comores-green/30 bg-comores-green/5 p-3">
                    <Banknote className="h-5 w-5 text-comores-green shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salaire (admin uniquement, masqué publiquement)</p>
                      <p className="font-semibold text-comores-green">
                        {viewingJob.salary_min && viewingJob.salary_max
                          ? `${fmt(viewingJob.salary_min)} – ${fmt(viewingJob.salary_max)} KMF`
                          : viewingJob.salary_min
                            ? `À partir de ${fmt(viewingJob.salary_min)} KMF`
                            : `Jusqu'à ${fmt(viewingJob.salary_max!)} KMF`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Coordonnées employeur — admin uniquement */}
                {(((viewingJob as any).contact_name) || ((viewingJob as any).contact_phone) || ((viewingJob as any).contact_email) || ((viewingJob as any).contact_address)) && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Coordonnées employeur (admin uniquement)</h3>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      {(viewingJob as any).contact_name && <p className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> {(viewingJob as any).contact_name}</p>}
                      {(viewingJob as any).contact_phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {(viewingJob as any).contact_phone}</p>}
                      {(viewingJob as any).contact_email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {(viewingJob as any).contact_email}</p>}
                      {(viewingJob as any).contact_address && <p className="flex items-center gap-2"><MapPinned className="h-3.5 w-3.5 text-muted-foreground" /> {(viewingJob as any).contact_address}</p>}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{viewingJob.description}</p>
                </div>

                {viewingJob.requirements && viewingJob.requirements.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><ListChecks className="h-4 w-4 text-primary" /> Prérequis</h3>
                    <ul className="space-y-1.5">
                      {viewingJob.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-comores-green shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="text-xs text-muted-foreground border-t pt-3">
                  Publiée par : {employerMap.get(viewingJob.employer_id) ?? viewingJob.employer_id}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewingJob(null)}>Fermer</Button>
                <Button asChild><Link to={`/jobs/${viewingJob.id}`}>Voir la page publique</Link></Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Detail Dialog — Admin sees all info */}
      <Dialog open={!!viewingProfile} onOpenChange={open => { if (!open) setViewingProfile(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {viewingProfile && (() => {
            const p = viewingProfile;
            const edu = Array.isArray(p.cv_education) ? p.cv_education as any[] : [];
            const exp = Array.isArray(p.cv_experience) ? p.cv_experience as any[] : [];
            const langs = p.cv_languages ?? [];
            const isEmployer = p.role === "employer";
            const userJobs = jobs.filter(j => j.employer_id === p.user_id);
            const userApps = applications.filter(a => a.candidate_id === p.user_id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <UserIcon className="h-5 w-5 text-primary" /> {p.full_name}
                  </DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={isEmployer ? "default" : p.role === "admin" ? "default" : (p.role as any) === "moderator" ? "outline" : "secondary"}>
                      {isEmployer ? "Employeur" : p.role === "admin" ? "Admin" : (p.role as any) === "moderator" ? "Modérateur" : "Candidat"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Inscrit le {new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Coordonnées (admin uniquement)</h3>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      {p.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {p.email}</p>}
                      {p.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {p.phone}</p>}
                      {p.location && <p className="flex items-center gap-2"><MapPinned className="h-3.5 w-3.5 text-muted-foreground" /> {p.location}</p>}
                    </div>
                  </div>

                  {p.bio && (
                    <div>
                      <h3 className="font-semibold text-sm mb-1">Bio</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{p.bio}</p>
                    </div>
                  )}

                  {isEmployer && (
                    <div className="rounded-lg border p-4 space-y-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Entreprise</h3>
                      <div className="text-sm space-y-1">
                        {p.company_name && <p><strong>Nom :</strong> {p.company_name}</p>}
                        {p.company_website && <p><strong>Site :</strong> <a href={p.company_website} target="_blank" rel="noopener" className="text-primary hover:underline">{p.company_website}</a></p>}
                        {p.company_description && <p className="text-muted-foreground">{p.company_description}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        {userJobs.length} offre{userJobs.length !== 1 ? "s" : ""} publiée{userJobs.length !== 1 ? "s" : ""} · {userJobs.reduce((s, j) => s + ((j as any).views_count ?? 0), 0)} vue{userJobs.reduce((s, j) => s + ((j as any).views_count ?? 0), 0) !== 1 ? "s" : ""} totales
                      </div>
                    </div>
                  )}

                  {!isEmployer && (
                    <>
                      {p.skills && p.skills.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Compétences</h3>
                          <div className="flex flex-wrap gap-1.5">
                            {p.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                          </div>
                        </div>
                      )}
                      {p.experience_years != null && (
                        <p className="text-sm"><strong>Années d'expérience :</strong> {p.experience_years}</p>
                      )}
                      {edu.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Formation</h3>
                          <div className="space-y-2">
                            {edu.map((e, i) => (
                              <div key={i} className="rounded-md bg-muted/40 p-2 text-sm">
                                <p className="font-medium">{e.degree} — {e.field}</p>
                                <p className="text-xs text-muted-foreground">{e.school} · {e.start_year}–{e.end_year || "en cours"}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {exp.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Expérience</h3>
                          <div className="space-y-2">
                            {exp.map((e, i) => (
                              <div key={i} className="rounded-md bg-muted/40 p-2 text-sm">
                                <p className="font-medium">{e.position}</p>
                                <p className="text-xs text-muted-foreground">{e.company} · {e.start_date}–{e.current ? "Présent" : e.end_date}</p>
                                {e.description && <p className="mt-1 text-muted-foreground">{e.description}</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {langs.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-sm mb-2">Langues</h3>
                          <div className="flex flex-wrap gap-1.5">{langs.map((l, i) => <Badge key={i} variant="outline">{l}</Badge>)}</div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground border-t pt-2">
                        {userApps.length} candidature{userApps.length !== 1 ? "s" : ""} envoyée{userApps.length !== 1 ? "s" : ""}
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setViewingProfile(null)}>Fermer</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
