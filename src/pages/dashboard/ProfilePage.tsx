import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User, Upload, FileText, Trash2, ExternalLink, GraduationCap, Briefcase, Globe, Eye, Pencil, Download, Save } from "lucide-react";
import { Link } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { generateCvPdf } from "@/lib/generateCvPdf";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBuiltCv, setShowBuiltCv] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const buildCvData = () => {
    if (!profile) return null;
    return {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      bio: profile.bio,
      skills: profile.skills,
      cv_education: Array.isArray(profile.cv_education) ? (profile.cv_education as any[]) : [],
      cv_experience: Array.isArray(profile.cv_experience) ? (profile.cv_experience as any[]) : [],
      cv_languages: profile.cv_languages ?? [],
    };
  };

  const handleDownloadPdf = () => {
    const cvData = buildCvData();
    if (!cvData) return;
    const doc = generateCvPdf(cvData);
    doc.save(`CV_${profile!.full_name.replace(/\s+/g, "_")}.pdf`);
  };

  const handleSavePdfToProfile = async () => {
    const cvData = buildCvData();
    if (!cvData || !user || !profile) return;
    setGeneratingPdf(true);
    try {
      const doc = generateCvPdf(cvData);
      const pdfBlob = doc.output("blob");
      const filePath = `${user.id}/cv-online-${Date.now()}.pdf`;

      if (profile.cv_url) {
        await supabase.storage.from("cvs").remove([profile.cv_url]);
      }

      const { error: upErr } = await supabase.storage.from("cvs").upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase.from("profiles").update({ cv_url: filePath }).eq("id", profile.id);
      if (updErr) throw updErr;

      setProfile((p: Profile | null) => p ? { ...p, cv_url: filePath } : p);
      toast.success("CV PDF enregistré dans votre profil !");
    } catch (err: any) {
      toast.error(err.message ?? "Erreur lors de la génération du PDF");
    } finally {
      setGeneratingPdf(false);
    }
  };
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data);
        setSkillsText((data?.skills ?? []).join(", "));
        setLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const skillsArray = skillsText.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        skills: skillsArray,
        company_name: profile.company_name,
        company_website: profile.company_website,
        company_description: profile.company_description,
        experience_years: profile.experience_years,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profil mis à jour !");
  };

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez PDF ou Word.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/cv-${Date.now()}.${ext}`;

    // Delete old CV if exists
    if (profile.cv_url) {
      await supabase.storage.from("cvs").remove([profile.cv_url]);
    }

    const { error: uploadError } = await supabase.storage.from("cvs").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error("Erreur d'upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    // Use path-based reference for private bucket (generate signed URLs when needed)
    const cvUrl = filePath;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ cv_url: cvUrl })
      .eq("id", profile.id);

    setUploading(false);
    if (updateError) { toast.error(updateError.message); return; }
    setProfile(p => p ? { ...p, cv_url: cvUrl } : p);
    toast.success("CV uploadé avec succès !");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteCv = async () => {
    if (!profile?.cv_url || !user) return;
    await supabase.storage.from("cvs").remove([profile.cv_url]);
    await supabase.from("profiles").update({ cv_url: null }).eq("id", profile.id);
    setProfile(p => p ? { ...p, cv_url: null } : p);
    toast.success("CV supprimé");
  };

  const getCvSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from("cvs").createSignedUrl(path, 3600);
    return data?.signedUrl ?? null;
  };

  const handleViewCv = async () => {
    if (!profile?.cv_url) return;
    const url = await getCvSignedUrl(profile.cv_url);
    if (url) window.open(url, "_blank");
    else toast.error("Impossible de charger le CV");
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!profile) return null;

  const update = (field: keyof Profile, value: any) => setProfile(p => p ? { ...p, [field]: value } : p);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground">Mettez à jour vos informations</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input value={profile.full_name} onChange={e => update("full_name", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={profile.email ?? ""} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={profile.phone ?? ""} onChange={e => update("phone", e.target.value)} placeholder="+269 3XX XX XX" />
              </div>
              <div className="space-y-2">
                <Label>Localisation</Label>
                <Input value={profile.location ?? ""} onChange={e => update("location", e.target.value)} placeholder="Moroni" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea rows={3} value={profile.bio ?? ""} onChange={e => update("bio", e.target.value)} placeholder="Parlez-nous de vous..." />
            </div>

            {role === "candidate" && (
              <>
                <div className="space-y-2">
                  <Label>Compétences (séparées par des virgules)</Label>
                  <Input
                    value={skillsText}
                    onChange={e => setSkillsText(e.target.value)}
                    placeholder="JavaScript, React, Communication..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Années d'expérience</Label>
                  <Input type="number" value={profile.experience_years ?? ""} onChange={e => update("experience_years", e.target.value ? parseInt(e.target.value) : null)} />
                </div>

                {/* CV Upload Section */}
                <div className="space-y-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-5 w-5 text-primary" /> Mon CV
                  </Label>
                  {profile.cv_url ? (
                    <div className="flex items-center gap-3">
                      <div className="flex flex-1 items-center gap-2 rounded-md bg-background px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="truncate">CV uploadé</span>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={handleViewCv}>
                          <ExternalLink className="mr-1 h-4 w-4" /> Voir
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={handleDeleteCv}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun CV uploadé</p>
                  )}
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleCvUpload}
                      className="hidden"
                      id="cv-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {uploading ? "Upload en cours..." : profile.cv_url ? "Remplacer le CV" : "Uploader mon CV"}
                    </Button>
                    <span className="text-xs text-muted-foreground">PDF ou Word, max 10 Mo</span>
                  </div>
                </div>

                {/* Built CV Section */}
                {(() => {
                  const edu = Array.isArray(profile.cv_education) ? profile.cv_education as any[] : [];
                  const exp = Array.isArray(profile.cv_experience) ? profile.cv_experience as any[] : [];
                  const langs = profile.cv_languages ?? [];
                  const hasBuiltCv = edu.length > 0 || exp.length > 0;
                  return (
                    <div className="space-y-3 rounded-lg border border-dashed border-comores-green/30 bg-comores-green/5 p-4">
                      <Label className="flex items-center gap-2 text-base font-semibold">
                        <GraduationCap className="h-5 w-5 text-comores-green" /> CV créé en ligne
                      </Label>
                      {hasBuiltCv ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{edu.length} formation{edu.length !== 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{exp.length} expérience{exp.length !== 1 ? "s" : ""}</span>
                            {langs.length > 0 && <><span>·</span><span>{langs.length} langue{langs.length !== 1 ? "s" : ""}</span></>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setShowBuiltCv(true)}>
                              <Eye className="mr-1 h-4 w-4" /> Voir
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={handleDownloadPdf}>
                              <Download className="mr-1 h-4 w-4" /> Télécharger PDF
                            </Button>
                            <Button type="button" variant="default" size="sm" onClick={handleSavePdfToProfile} disabled={generatingPdf}>
                              {generatingPdf ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                              Enregistrer dans profil
                            </Button>
                            <Button type="button" variant="outline" size="sm" asChild>
                              <Link to="/dashboard/cv-builder"><Pencil className="mr-1 h-4 w-4" /> Modifier</Link>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Aucun CV créé en ligne</p>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <Link to="/dashboard/cv-builder"><Pencil className="mr-1 h-4 w-4" /> Créer mon CV</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}

            {role === "employer" && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nom de l'entreprise</Label>
                    <Input value={profile.company_name ?? ""} onChange={e => update("company_name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Site web</Label>
                    <Input value={profile.company_website ?? ""} onChange={e => update("company_website", e.target.value)} placeholder="https://" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description de l'entreprise</Label>
                  <Textarea rows={3} value={profile.company_description ?? ""} onChange={e => update("company_description", e.target.value)} />
                </div>
              </>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Built CV Preview Dialog */}
      <Dialog open={showBuiltCv} onOpenChange={setShowBuiltCv}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Mon CV en ligne
            </DialogTitle>
          </DialogHeader>
          {profile && (
            <div className="space-y-6 py-2">
              {/* Header */}
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">{profile.full_name}</h2>
                <p className="text-sm text-muted-foreground">
                  {[profile.email, profile.phone, profile.location].filter(Boolean).join(" · ")}
                </p>
                {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Compétences</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {Array.isArray(profile.cv_education) && (profile.cv_education as any[]).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> Formation</h3>
                  <div className="space-y-3">
                    {(profile.cv_education as any[]).map((edu: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className="font-medium">{edu.degree} {edu.field && `— ${edu.field}`}</p>
                        <p className="text-sm text-muted-foreground">{edu.school}</p>
                        <p className="text-xs text-muted-foreground">{edu.start_year} – {edu.end_year || "En cours"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {Array.isArray(profile.cv_experience) && (profile.cv_experience as any[]).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Expérience professionnelle</h3>
                  <div className="space-y-3">
                    {(profile.cv_experience as any[]).map((exp: any, i: number) => (
                      <div key={i} className="rounded-lg border p-3">
                        <p className="font-medium">{exp.position}</p>
                        <p className="text-sm text-muted-foreground">{exp.company}</p>
                        <p className="text-xs text-muted-foreground">{exp.start_date} – {exp.current ? "Présent" : exp.end_date}</p>
                        {exp.description && <p className="mt-1 text-sm">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages */}
              {profile.cv_languages && profile.cv_languages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Langues</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.cv_languages.map((l, i) => (
                      <span key={i} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{l}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBuiltCv(false)}>Fermer</Button>
            <Button asChild><Link to="/dashboard/cv-builder"><Pencil className="mr-1 h-4 w-4" /> Modifier</Link></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
