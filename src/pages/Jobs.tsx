import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Building2, Clock, Search, Briefcase, Loader2, Banknote, Send, CheckCircle, FileText, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

const LOCATIONS = ["Toutes", "Moroni", "Mutsamudu", "Fomboni", "Mitsamiouli", "Domoni", "Mbéni"];
const CATEGORIES = ["Toutes", "Technologie", "Tourisme", "Administration", "Construction", "Éducation", "Santé", "Commerce", "Autre"];
const JOB_TYPES = ["Tous", "CDI", "CDD", "Stage", "Freelance"];

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)} KMF`;
  if (min) return `À partir de ${fmt(min)} KMF`;
  return `Jusqu'à ${fmt(max!)} KMF`;
}

const Jobs = () => {
  const { user, role } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Toutes");
  const [customLocation, setCustomLocation] = useState("");
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [category, setCategory] = useState("Toutes");
  const [jobType, setJobType] = useState("Tous");

  // Application state
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [profileCvUrl, setProfileCvUrl] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setJobs(data ?? []); setLoading(false); });
  }, []);

  // Fetch user's existing applications and CV
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("applications").select("job_id").eq("candidate_id", user.id),
      supabase.from("profiles").select("cv_url").eq("user_id", user.id).maybeSingle(),
    ]).then(([appsRes, profileRes]) => {
      if (appsRes.data) {
        setAppliedJobs(new Set(appsRes.data.map(a => a.job_id)));
      }
      setProfileCvUrl(profileRes.data?.cv_url ?? null);
    });
  }, [user]);

  const handleQuickApply = async () => {
    if (!user || !selectedJob) return;
    setSubmitting(true);

    const { error } = await supabase.from("applications").insert({
      candidate_id: user.id,
      job_id: selectedJob.id,
      cv_url: profileCvUrl,
      cover_letter: coverLetter.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Vous avez déjà postulé à cette offre");
      } else {
        toast.error("Erreur: " + error.message);
      }
      return;
    }

    setAppliedJobs(prev => new Set([...prev, selectedJob.id]));
    toast.success("Candidature envoyée avec succès !");
    setSelectedJob(null);
    setCoverLetter("");
  };

  const openApplyDialog = (job: Job) => {
    if (!user) {
      toast.error("Connectez-vous pour postuler", { action: { label: "Se connecter", onClick: () => window.location.href = "/login" } });
      return;
    }
    if (role !== "candidate") {
      toast.error("Seuls les candidats peuvent postuler");
      return;
    }
    setSelectedJob(job);
    setCoverLetter("");
  };

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (location !== "Toutes" && !j.location.toLowerCase().includes(location.toLowerCase())) return false;
    if (category !== "Toutes" && j.category !== category) return false;
    if (jobType !== "Tous" && j.job_type !== jobType) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <section className="bg-hero-gradient py-12">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Offres d'emploi</h1>
          <p className="mt-2 text-white/70">Trouvez l'opportunité qui vous correspond aux Comores</p>
        </div>
      </section>

      <div className="container px-4 py-8 flex-1">
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un poste..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger><SelectValue placeholder="Localisation" /></SelectTrigger>
            <SelectContent>{LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={jobType} onValueChange={setJobType}>
            <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} offre{filtered.length !== 1 ? "s" : ""} trouvée{filtered.length !== 1 ? "s" : ""}</p>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">Aucune offre trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(job => {
              const salary = formatSalary(job.salary_min, job.salary_max);
              const hasApplied = appliedJobs.has(job.id);
              return (
                <Card key={job.id} className="group transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline">{job.job_type}</Badge>
                    </div>
                    <Link to={`/jobs/${job.id}`}><h3 className="mt-3 font-display text-lg font-semibold group-hover:text-primary transition-colors">{job.title}</h3></Link>
                    <p className="mt-1 text-sm text-muted-foreground">{job.company_name}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(job.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {salary && (
                      <p className="mt-2 flex items-center gap-1 text-sm font-medium text-comores-green">
                        <Banknote className="h-3.5 w-3.5" />{salary}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-3">{job.category}</Badge>
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{job.description}</p>

                    {/* Requirements */}
                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Prérequis :</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {job.requirements.slice(0, 3).map((r, i) => (
                            <li key={i} className="flex gap-1">• {r}</li>
                          ))}
                          {job.requirements.length > 3 && <li className="text-primary text-xs">+{job.requirements.length - 3} autres</li>}
                        </ul>
                      </div>
                    )}

                    <div className="mt-4">
                      {hasApplied ? (
                        <Button className="w-full" size="sm" disabled variant="outline">
                          <CheckCircle className="mr-2 h-4 w-4 text-comores-green" /> Déjà postulé
                        </Button>
                      ) : (
                        <Button className="w-full" size="sm" onClick={() => openApplyDialog(job)}>
                          <Send className="mr-2 h-4 w-4" /> Postuler en 1 clic
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={open => { if (!open) setSelectedJob(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" /> Postuler rapidement
            </DialogTitle>
            <DialogDescription>
              {selectedJob?.title} — {selectedJob?.company_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* CV Status */}
            <div className={`flex items-center gap-3 rounded-lg border p-3 ${profileCvUrl ? "border-comores-green/30 bg-comores-green/5" : "border-gold/30 bg-gold/5"}`}>
              {profileCvUrl ? (
                <>
                  <CheckCircle className="h-5 w-5 text-comores-green shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">CV joint automatiquement</p>
                    <p className="text-xs text-muted-foreground">Votre CV sera envoyé avec la candidature</p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={profileCvUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4" />
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-gold shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Aucun CV uploadé</p>
                    <p className="text-xs text-muted-foreground">
                      <Link to="/dashboard/profile" className="text-primary underline">Uploadez votre CV</Link> pour renforcer votre candidature
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Cover Letter (optional) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lettre de motivation (optionnelle)</label>
              <Textarea
                rows={4}
                value={coverLetter}
                onChange={e => setCoverLetter(e.target.value)}
                placeholder="Expliquez pourquoi ce poste vous intéresse..."
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{coverLetter.length}/2000</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedJob(null)}>Annuler</Button>
            <Button onClick={handleQuickApply} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {submitting ? "Envoi..." : "Envoyer ma candidature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Jobs;
