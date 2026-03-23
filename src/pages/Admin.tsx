import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
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
import { Briefcase, Users, Plus, Trash2, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type Job = Tables<"jobs">;

const LOCATIONS = ["Moroni", "Mutsamudu", "Fomboni", "Mitsamiouli", "Domoni", "Mbéni"];
const CATEGORIES = ["Technologie", "Tourisme", "Administration", "Construction", "Éducation", "Santé", "Commerce", "Autre"];

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Job form state
  const [jobForm, setJobForm] = useState({
    title: "", description: "", company_name: "", location: "Moroni",
    category: "Technologie", job_type: "CDI" as "CDI" | "CDD" | "Stage" | "Freelance",
    salary_min: "", salary_max: "", requirements: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (role === "admin") {
      fetchData();
    }
  }, [role]);

  const fetchData = async () => {
    setLoadingData(true);
    const [profilesRes, jobsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    ]);
    setProfiles(profilesRes.data ?? []);
    setJobs(jobsRes.data ?? []);
    setLoadingData(false);
  };

  const handleDeleteProfile = async (id: string) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Profil supprimé");
    setProfiles(prev => prev.filter(p => p.id !== id));
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

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      title: jobForm.title,
      description: jobForm.description,
      company_name: jobForm.company_name,
      location: jobForm.location,
      category: jobForm.category,
      job_type: jobForm.job_type,
      salary_min: jobForm.salary_min ? parseInt(jobForm.salary_min) : null,
      salary_max: jobForm.salary_max ? parseInt(jobForm.salary_max) : null,
      requirements: jobForm.requirements ? jobForm.requirements.split("\n").filter(Boolean) : null,
      employer_id: user.id,
      status: "published",
    });
    setSubmitting(false);
    if (error) { toast.error("Erreur: " + error.message); return; }
    toast.success("Offre créée avec succès !");
    setJobForm({ title: "", description: "", company_name: "", location: "Moroni", category: "Technologie", job_type: "CDI", salary_min: "", salary_max: "", requirements: "" });
    fetchData();
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Kazi <span className="text-primary">Comores</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" /> Admin
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container px-4 py-8">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Tableau de bord Admin</h1>
        <p className="mt-1 text-muted-foreground">Gérez les utilisateurs et les offres d'emploi</p>

        <Tabs defaultValue="users" className="mt-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="users" className="gap-1"><Users className="h-4 w-4" /> Utilisateurs</TabsTrigger>
            <TabsTrigger value="jobs" className="gap-1"><Briefcase className="h-4 w-4" /> Offres</TabsTrigger>
            <TabsTrigger value="create" className="gap-1"><Plus className="h-4 w-4" /> Publier</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Profils utilisateurs ({profiles.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nom</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Localisation</TableHead>
                          <TableHead>Inscrit le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profiles.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">{p.full_name}</TableCell>
                            <TableCell>{p.email ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant={p.role === "employer" ? "default" : "secondary"}>
                                {p.role === "employer" ? "Employeur" : p.role === "admin" ? "Admin" : "Candidat"}
                              </Badge>
                            </TableCell>
                            <TableCell>{p.location ?? "—"}</TableCell>
                            <TableCell>{new Date(p.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteProfile(p.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {profiles.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun utilisateur</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Offres d'emploi ({jobs.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titre</TableHead>
                          <TableHead>Entreprise</TableHead>
                          <TableHead>Lieu</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map(j => (
                          <TableRow key={j.id}>
                            <TableCell className="font-medium">{j.title}</TableCell>
                            <TableCell>{j.company_name}</TableCell>
                            <TableCell>{j.location}</TableCell>
                            <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                            <TableCell>
                              <Badge variant={j.status === "published" ? "default" : "secondary"}>
                                {j.status === "published" ? "Publiée" : j.status === "closed" ? "Fermée" : "Brouillon"}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(j.created_at).toLocaleDateString("fr-FR")}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleToggleJobStatus(j)}>
                                {j.status === "published" ? "Fermer" : "Publier"}
                              </Button>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteJob(j.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {jobs.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune offre</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Job Tab */}
          <TabsContent value="create" className="mt-6">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Publier une offre d'emploi</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateJob} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Titre du poste</Label>
                      <Input required value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Développeur Web" />
                    </div>
                    <div className="space-y-2">
                      <Label>Entreprise</Label>
                      <Input required value={jobForm.company_name} onChange={e => setJobForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Nom de l'entreprise" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea required rows={4} value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez le poste..." />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Localisation</Label>
                      <Select value={jobForm.location} onValueChange={v => setJobForm(f => ({ ...f, location: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Catégorie</Label>
                      <Select value={jobForm.category} onValueChange={v => setJobForm(f => ({ ...f, category: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type de contrat</Label>
                      <Select value={jobForm.job_type} onValueChange={v => setJobForm(f => ({ ...f, job_type: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Salaire min (KMF)</Label>
                      <Input type="number" value={jobForm.salary_min} onChange={e => setJobForm(f => ({ ...f, salary_min: e.target.value }))} placeholder="150000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Salaire max (KMF)</Label>
                      <Input type="number" value={jobForm.salary_max} onChange={e => setJobForm(f => ({ ...f, salary_max: e.target.value }))} placeholder="300000" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Prérequis (un par ligne)</Label>
                    <Textarea rows={3} value={jobForm.requirements} onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))} placeholder={"Bac+3 en informatique\n2 ans d'expérience\nMaîtrise du français"} />
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? "Publication..." : "Publier l'offre"}
                  </Button>
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
