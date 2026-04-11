import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, Link } from "react-router-dom";
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
import { Briefcase, Users, Plus, Trash2, Shield, Loader2, FileText, CheckCircle, DollarSign, MessageSquare, MapPin, Clock, Banknote, ListChecks, Eye, Building2, UserCog, ClipboardList } from "lucide-react";
import Logo from "@/components/Logo";
import ChatWidget from "@/components/ChatWidget";
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
  const { user, role, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationFull[]>([]);
  const [adminTasks, setAdminTasks] = useState<AdminTask[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  // Task form state
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assigned_to: "", priority: "medium", due_date: "" });
  const [taskSubmitting, setTaskSubmitting] = useState(false);

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
    const newStatus = job.status === "published" ? "closed" : "published";
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
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
            <Button variant="ghost" size="sm" onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}>Déconnexion</Button>
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
                              <TableCell className="font-medium">{p.full_name}</TableCell>
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
                        <TableHead>Titre</TableHead><TableHead>Entreprise</TableHead><TableHead>Lieu</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Actions</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {jobs.map(j => (
                          <TableRow key={j.id}>
                            <TableCell className="font-medium">
                              <button className="text-left hover:text-primary hover:underline transition-colors" onClick={() => setViewingJob(j)}>{j.title}</button>
                            </TableCell>
                            <TableCell>{j.company_name}</TableCell>
                            <TableCell>{j.location}</TableCell>
                            <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                            <TableCell><Badge variant={j.status === "published" ? "default" : "secondary"}>{j.status === "published" ? "Publiée" : j.status === "closed" ? "Fermée" : "Brouillon"}</Badge></TableCell>
                            <TableCell>{new Date(j.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => setViewingJob(j)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="outline" size="sm" onClick={() => handleToggleJobStatus(j)}>{j.status === "published" ? "Fermer" : "Publier"}</Button>
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteJob(j.id)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {jobs.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune offre</TableCell></TableRow>}
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
                            <TableCell className="font-medium">{a.profiles?.full_name ?? "—"}</TableCell>
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
                  <Badge variant={viewingJob.status === "published" ? "default" : "secondary"}>
                    {viewingJob.status === "published" ? "Publiée" : viewingJob.status === "closed" ? "Fermée" : "Brouillon"}
                  </Badge>
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
                      <p className="text-xs text-muted-foreground">Salaire</p>
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
    </div>
  );
};

export default Admin;
