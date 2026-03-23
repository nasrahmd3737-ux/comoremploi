import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Building2, Clock, Banknote, Send, CheckCircle, FileText, AlertCircle, Loader2, ArrowLeft, Briefcase, ListChecks } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

function formatSalary(min: number | null, max: number | null) {
  if (!min && !max) return null;
  if (min && max) return `${fmt(min)} – ${fmt(max)} KMF`;
  if (min) return `À partir de ${fmt(min)} KMF`;
  return `Jusqu'à ${fmt(max!)} KMF`;
}

const TYPE_LABELS: Record<string, string> = { CDI: "Contrat à durée indéterminée", CDD: "Contrat à durée déterminée", Stage: "Stage", Freelance: "Freelance" };

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, role } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [profileCvUrl, setProfileCvUrl] = useState<string | null>(null);
  const [hasBuiltCv, setHasBuiltCv] = useState(false);
  const [selectedCvType, setSelectedCvType] = useState<"uploaded" | "built" | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("jobs").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setJob(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      supabase.from("applications").select("id").eq("candidate_id", user.id).eq("job_id", id).maybeSingle(),
      supabase.from("profiles").select("cv_url, cv_education, cv_experience").eq("user_id", user.id).maybeSingle(),
    ]).then(([appRes, profRes]) => {
      setHasApplied(!!appRes.data);
      setProfileCvUrl(profRes.data?.cv_url ?? null);
      const edu = profRes.data?.cv_education;
      const exp = profRes.data?.cv_experience;
      setHasBuiltCv(
        (Array.isArray(edu) && edu.length > 0) || (Array.isArray(exp) && exp.length > 0)
      );
    });
  }, [user, id]);

  const handleApply = async () => {
    if (!user || !job) return;
    setSubmitting(true);
    const cvToSend = selectedCvType === "uploaded" ? profileCvUrl : (selectedCvType === "built" ? "online-cv" : profileCvUrl);
    const { error } = await supabase.from("applications").insert({
      candidate_id: user.id,
      job_id: job.id,
      cv_url: cvToSend,
      cover_letter: coverLetter.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.code === "23505" ? "Vous avez déjà postulé" : error.message);
      return;
    }
    setHasApplied(true);
    setShowApply(false);
    setCoverLetter("");
    setSelectedCvType(null);
    toast.success("Candidature envoyée avec succès !");
  };

  const openApply = () => {
    if (!user) { toast.error("Connectez-vous pour postuler", { action: { label: "Connexion", onClick: () => (window.location.href = "/login") } }); return; }
    if (role !== "candidate") { toast.error("Seuls les candidats peuvent postuler"); return; }
    if (!profileCvUrl && !hasBuiltCv) {
      toast.error("Veuillez d'abord créer ou uploader votre CV", {
        action: { label: "Créer mon CV", onClick: () => (window.location.href = "/dashboard/cv-builder") },
        duration: 6000,
      });
      return;
    }
    setShowApply(true);
    setCoverLetter("");
    if (profileCvUrl && !hasBuiltCv) setSelectedCvType("uploaded");
    else if (!profileCvUrl && hasBuiltCv) setSelectedCvType("built");
    else setSelectedCvType(null);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </div>
  );

  if (!job) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <Briefcase className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Offre introuvable</h2>
        <Button asChild variant="outline"><Link to="/jobs"><ArrowLeft className="mr-2 h-4 w-4" />Retour aux offres</Link></Button>
      </div>
    </div>
  );

  const salary = formatSalary(job.salary_min, job.salary_max);
  const postedAgo = Math.floor((Date.now() - new Date(job.created_at).getTime()) / 86400000);
  const postedLabel = postedAgo === 0 ? "Aujourd'hui" : postedAgo === 1 ? "Hier" : `Il y a ${postedAgo} jours`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-hero-gradient py-10 md:py-14">
        <div className="container px-4">
          <Link to="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Toutes les offres
          </Link>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0">{job.job_type}</Badge>
                <Badge className="bg-white/10 text-white/80 border-0">{job.category}</Badge>
              </div>
              <h1 className="font-display text-2xl font-bold text-white md:text-4xl">{job.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-white/70 text-sm">
                <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{job.company_name}</span>
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{job.location}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{postedLabel}</span>
              </div>
            </div>
            <div className="shrink-0">
              {hasApplied ? (
                <Button size="lg" disabled variant="secondary" className="gap-2">
                  <CheckCircle className="h-5 w-5 text-comores-green" /> Déjà postulé
                </Button>
              ) : (
                <Button size="lg" onClick={openApply} className="gap-2 bg-white text-primary hover:bg-white/90">
                  <Send className="h-5 w-5" /> Postuler maintenant
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-8 flex-1">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-xl font-semibold mb-4">Description du poste</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                  {job.description}
                </div>
              </CardContent>
            </Card>

            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-primary" /> Prérequis
                  </h2>
                  <ul className="space-y-2">
                    {job.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-comores-green shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold">Résumé</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Briefcase className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-muted-foreground">Type de contrat</p><p className="font-medium">{TYPE_LABELS[job.job_type] ?? job.job_type}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><MapPin className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-muted-foreground">Localisation</p><p className="font-medium">{job.location}</p></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-muted-foreground">Entreprise</p><p className="font-medium">{job.company_name}</p></div>
                  </div>
                  {salary && (
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-comores-green/10"><Banknote className="h-4 w-4 text-comores-green" /></div>
                      <div><p className="text-muted-foreground">Salaire</p><p className="font-medium text-comores-green">{salary}</p></div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><Clock className="h-4 w-4 text-primary" /></div>
                    <div><p className="text-muted-foreground">Publiée le</p><p className="font-medium">{new Date(job.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20">
              <CardContent className="p-5 text-center space-y-3">
                <p className="text-sm font-medium">Intéressé(e) par ce poste ?</p>
                {hasApplied ? (
                  <Button className="w-full" disabled variant="outline">
                    <CheckCircle className="mr-2 h-4 w-4 text-comores-green" /> Candidature envoyée
                  </Button>
                ) : (
                  <Button className="w-full" onClick={openApply}>
                    <Send className="mr-2 h-4 w-4" /> Postuler en 1 clic
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Postuler</DialogTitle>
            <DialogDescription>{job.title} — {job.company_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* CV Selection */}
            {profileCvUrl && hasBuiltCv ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Choisissez le CV à envoyer</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${selectedCvType === "uploaded" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                    onClick={() => setSelectedCvType("uploaded")}
                  >
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="text-sm font-medium">CV uploadé</span>
                    <span className="text-xs text-muted-foreground">Fichier PDF</span>
                  </button>
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${selectedCvType === "built" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}
                    onClick={() => setSelectedCvType("built")}
                  >
                    <FileText className="h-6 w-6 text-comores-green" />
                    <span className="text-sm font-medium">CV créé en ligne</span>
                    <span className="text-xs text-muted-foreground">Depuis le CV Builder</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border p-3 border-comores-green/30 bg-comores-green/5">
                <CheckCircle className="h-5 w-5 text-comores-green shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{profileCvUrl ? "CV uploadé joint" : "CV créé en ligne joint"}</p>
                  <p className="text-xs text-muted-foreground">Votre CV sera envoyé avec la candidature</p>
                </div>
                {profileCvUrl && (
                  <Button variant="ghost" size="sm" onClick={async () => { const { data } = await supabase.storage.from("cvs").createSignedUrl(profileCvUrl, 3600); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }}>
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Lettre de motivation (optionnelle)</label>
              <Textarea rows={4} value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Expliquez pourquoi ce poste vous intéresse..." maxLength={2000} />
              <p className="text-xs text-muted-foreground text-right">{coverLetter.length}/2000</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowApply(false)}>Annuler</Button>
            <Button onClick={handleApply} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {submitting ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
