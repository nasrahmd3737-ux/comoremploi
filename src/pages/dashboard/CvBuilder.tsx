import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, FileText, GraduationCap, Briefcase, Globe, Eye, EyeOff, Download, Save } from "lucide-react";
import { generateCvPdf } from "@/lib/generateCvPdf";

interface Education {
  school: string;
  degree: string;
  field: string;
  start_year: string;
  end_year: string;
}

interface Experience {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
  current: boolean;
}

const emptyEducation: Education = { school: "", degree: "", field: "", start_year: "", end_year: "" };
const emptyExperience: Experience = { company: "", position: "", description: "", start_date: "", end_date: "", current: false };

export default function CvBuilder() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [languages, setLanguages] = useState("");
  const [published, setPublished] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data);
          setEducation(Array.isArray(data.cv_education) ? (data.cv_education as unknown as Education[]) : []);
          setExperience(Array.isArray(data.cv_experience) ? (data.cv_experience as unknown as Experience[]) : []);
          setLanguages((data.cv_languages ?? []).join(", "));
          setPublished(data.cv_published ?? false);
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        cv_education: education as any,
        cv_experience: experience as any,
        cv_languages: languages.split(",").map(l => l.trim()).filter(Boolean),
        cv_published: published,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(published ? "CV publié et visible par les entreprises !" : "CV enregistré sur votre profil !");
  };

  const updateEdu = (idx: number, field: keyof Education, value: string) => {
    setEducation(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  const updateExp = (idx: number, field: keyof Experience, value: string | boolean) => {
    setExperience(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Créer mon CV</h1>
          <p className="text-muted-foreground">Remplissez vos informations pour générer votre CV</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {published ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
            <Label htmlFor="publish-toggle" className="text-sm cursor-pointer">
              {published ? "Visible par les entreprises" : "CV privé"}
            </Label>
            <Switch id="publish-toggle" checked={published} onCheckedChange={setPublished} />
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-sm text-muted-foreground">{profile.location ?? "—"} • {profile.email ?? "—"}</p>
            </div>
            <Badge variant="default" className="ml-auto">
              {published ? "Publié" : "Enregistré"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Formation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {education.map((edu, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Formation {idx + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setEducation(prev => prev.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Établissement</Label>
                  <Input value={edu.school} onChange={e => updateEdu(idx, "school", e.target.value)} placeholder="Université des Comores" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Diplôme</Label>
                  <Input value={edu.degree} onChange={e => updateEdu(idx, "degree", e.target.value)} placeholder="Licence, Master..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Domaine</Label>
                  <Input value={edu.field} onChange={e => updateEdu(idx, "field", e.target.value)} placeholder="Informatique, Gestion..." />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Début</Label>
                    <Input value={edu.start_year} onChange={e => updateEdu(idx, "start_year", e.target.value)} placeholder="2020" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fin</Label>
                    <Input value={edu.end_year} onChange={e => updateEdu(idx, "end_year", e.target.value)} placeholder="2023" />
                  </div>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setEducation(prev => [...prev, { ...emptyEducation }])}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une formation
          </Button>
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" /> Expérience professionnelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {experience.map((exp, idx) => (
            <div key={idx} className="space-y-3 rounded-lg border p-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">Expérience {idx + 1}</span>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setExperience(prev => prev.filter((_, i) => i !== idx))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Entreprise</Label>
                  <Input value={exp.company} onChange={e => updateExp(idx, "company", e.target.value)} placeholder="Nom de l'entreprise" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Poste</Label>
                  <Input value={exp.position} onChange={e => updateExp(idx, "position", e.target.value)} placeholder="Développeur, Manager..." />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Textarea rows={2} value={exp.description} onChange={e => updateExp(idx, "description", e.target.value)} placeholder="Décrivez vos responsabilités..." />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label className="text-xs">Début</Label>
                  <Input type="month" value={exp.start_date} onChange={e => updateExp(idx, "start_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fin</Label>
                  <Input type="month" value={exp.end_date} onChange={e => updateExp(idx, "end_date", e.target.value)} disabled={exp.current} />
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={exp.current} onCheckedChange={v => updateExp(idx, "current", v)} id={`current-${idx}`} />
                  <Label htmlFor={`current-${idx}`} className="text-xs cursor-pointer">En cours</Label>
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setExperience(prev => [...prev, { ...emptyExperience }])}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter une expérience
          </Button>
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Langues</CardTitle>
        </CardHeader>
        <CardContent>
          <Input value={languages} onChange={e => setLanguages(e.target.value)} placeholder="Français, Comorien, Arabe, Anglais..." />
          <p className="mt-1 text-xs text-muted-foreground">Séparez les langues par des virgules</p>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="min-w-[160px]">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saving ? "Enregistrement..." : published ? "Publier le CV" : "Enregistrer le CV"}
        </Button>
      </div>
    </div>
  );
}
