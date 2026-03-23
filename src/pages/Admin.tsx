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
import { Briefcase, Users, Plus, Trash2, Shield, Loader2, FileText, CheckCircle, DollarSign, MessageSquare } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";
import { ISLANDS, formatLocation } from "@/lib/locations";
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

const CATEGORIES = ["Technologie", "Tourisme", "Administration", "Construction", "Éducation", "Santé", "Commerce", "Autre"];

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente", reviewed: "Examinée", shortlisted: "Présélectionné", accepted: "Acceptée", rejected: "Refusée",
};
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary", reviewed: "outline", shortlisted: "default", accepted: "default", rejected: "destructive",
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationFull[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  useEffect(() => {
    if (role === "admin") fetchData();
  }, [role]);

  const fetchData = async () => {
    setLoadingData(true);
    const [profilesRes, jobsRes, appsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("id, status, created_at, candidate_id, job_id, cover_letter, profiles:candidate_id(full_name, email, phone, location), jobs:job_id(title, company_name, salary_min, salary_max, job_type, employer_id)").order("created_at", { ascending: false }),
    ]);
    setProfiles(profilesRes.data ?? []);
    setJobs(jobsRes.data ?? []);
    setApplications((appsRes.data as unknown as ApplicationFull[]) ?? []);
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

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!user || role !== "admin") return <Navigate to="/" replace />;

  const acceptedApps = applications.filter(a => a.status === "accepted");

  // Build employer map from profiles
  const employerMap = new Map<string, string>();
  profiles.forEach(p => { employerMap.set(p.user_id, p.full_name); });

  const totalSalary = acceptedApps.reduce((sum, a) => {
    const salary = a.jobs?.salary_max ?? a.jobs?.salary_min ?? 0;
    return sum + salary;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Comores <span className="text-primary">Emploi</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>
            <Button variant="ghost" size="sm" onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}>Déconnexion</Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Tableau de bord Admin</h1>
        <p className="mt-1 text-muted-foreground">Gérez les utilisateurs, offres, candidatures et finances</p>

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

        <Tabs defaultValue="users" className="mt-8">
          <TabsList className="flex w-full max-w-2xl flex-wrap">
            <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" /> Utilisateurs</TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1"><Briefcase className="h-4 w-4" /> Offres</TabsTrigger>
            <TabsTrigger value="applications" className="gap-1"><FileText className="h-4 w-4" /> Candidatures</TabsTrigger>
            <TabsTrigger value="hired" className="gap-1"><CheckCircle className="h-4 w-4" /> Embauchés</TabsTrigger>
            <TabsTrigger value="finance" className="gap-1"><DollarSign className="h-4 w-4" /> Finance</TabsTrigger>
            <TabsTrigger value="messages" className="gap-1"><MessageSquare className="h-4 w-4" /> Messages</TabsTrigger>
            <TabsTrigger value="create" className="gap-1"><Plus className="h-4 w-4" /> Publier</TabsTrigger>
          </TabsList>

          {/* Users */}
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
                            <TableCell><Badge variant={p.role === "employer" ? "default" : "secondary"}>{p.role === "employer" ? "Employeur" : p.role === "admin" ? "Admin" : "Candidat"}</Badge></TableCell>
                            <TableCell>{p.location ?? "—"}</TableCell>
                            <TableCell>{new Date(p.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(p)} disabled={p.role === "admin"}><Trash2 className="h-4 w-4" /></Button>
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
                            <TableCell className="font-medium">{j.title}</TableCell>
                            <TableCell>{j.company_name}</TableCell>
                            <TableCell>{j.location}</TableCell>
                            <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                            <TableCell><Badge variant={j.status === "published" ? "default" : "secondary"}>{j.status === "published" ? "Publiée" : j.status === "closed" ? "Fermée" : "Brouillon"}</Badge></TableCell>
                            <TableCell>{new Date(j.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right space-x-1">
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

          {/* Hired / Accepted */}
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

          {/* Finance */}
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

          {/* Messages */}
          <TabsContent value="messages" className="mt-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Messagerie</CardTitle></CardHeader>
              <CardContent>
                {user && <ChatWidget userId={user.id} height="500px" />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Job */}
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
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
