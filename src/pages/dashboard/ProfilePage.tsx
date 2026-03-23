import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User, Upload, FileText, Trash2, ExternalLink } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `${user.id}/cv-${Date.now()}.${ext}`;

    // Delete old CV if exists
    if (profile.cv_url) {
      const oldPath = profile.cv_url.split("/cvs/")[1];
      if (oldPath) await supabase.storage.from("cvs").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage.from("cvs").upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast.error("Erreur d'upload: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("cvs").getPublicUrl(filePath);
    const cvUrl = urlData.publicUrl;

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
    const oldPath = profile.cv_url.split("/cvs/")[1];
    if (oldPath) await supabase.storage.from("cvs").remove([oldPath]);
    await supabase.from("profiles").update({ cv_url: null }).eq("id", profile.id);
    setProfile(p => p ? { ...p, cv_url: null } : p);
    toast.success("CV supprimé");
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
                    value={(profile.skills ?? []).join(", ")}
                    onChange={e => update("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
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
                      <Button type="button" variant="outline" size="sm" asChild>
                        <a href={profile.cv_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-1 h-4 w-4" /> Voir
                        </a>
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
                    <span className="text-xs text-muted-foreground">PDF ou Word, max 5 Mo</span>
                  </div>
                </div>
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
    </div>
  );
}
