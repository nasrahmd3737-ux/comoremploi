import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
        location: profile.location,
        bio: profile.bio,
        skills: profile.skills,
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
