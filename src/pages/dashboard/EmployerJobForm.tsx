import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { ISLANDS, formatLocation } from "@/lib/locations";

const CATEGORIES = ["Technologie", "Tourisme", "Administration", "Construction", "Éducation", "Santé", "Commerce", "Autre"];

export default function EmployerJobForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [island, setIsland] = useState("Grande Comore");
  const [city, setCity] = useState("Moroni");
  const [customCity, setCustomCity] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", company_name: "",
    category: "Technologie", job_type: "CDI" as "CDI" | "CDD" | "Stage" | "Freelance",
    salary_min: "", salary_max: "", requirements: "",
  });

  const cities = ISLANDS[island] ?? [];
  const effectiveCity = city === "__other__" ? customCity : city;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("jobs").insert({
      title: form.title,
      description: form.description,
      company_name: form.company_name,
      location: formatLocation(island, effectiveCity),
      category: form.category,
      job_type: form.job_type,
      salary_min: form.salary_min ? parseInt(form.salary_min) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      requirements: form.requirements ? form.requirements.split("\n").filter(Boolean) : null,
      employer_id: user.id,
      status: "published",
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Offre publiée avec succès !");
    navigate("/dashboard/jobs");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Publier une offre</h1>
        <p className="text-muted-foreground">Remplissez les détails du poste</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" /> Nouvelle offre</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Titre du poste</Label><Input required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Développeur Web" /></div>
              <div className="space-y-2"><Label>Entreprise</Label><Input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Nom de l'entreprise" /></div>
            </div>
            <div className="space-y-2"><Label>Description</Label><Textarea required rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Décrivez le poste..." /></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Île</Label>
                <Select value={island} onValueChange={v => { setIsland(v); setCity(ISLANDS[v]?.[0] ?? ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(ISLANDS).map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ville</Label>
                <Select value={city} onValueChange={v => { setCity(v); if (v !== "__other__") setCustomCity(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    <SelectItem value="__other__">Autre...</SelectItem>
                  </SelectContent>
                </Select>
                {city === "__other__" && (
                  <Input placeholder="Nom de la ville" value={customCity} onChange={e => setCustomCity(e.target.value)} required />
                )}
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type de contrat</Label>
                <Select value={form.job_type} onValueChange={v => setForm(f => ({ ...f, job_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CDI">CDI</SelectItem><SelectItem value="CDD">CDD</SelectItem>
                    <SelectItem value="Stage">Stage</SelectItem><SelectItem value="Freelance">Freelance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Salaire min (KMF)</Label><Input type="number" value={form.salary_min} onChange={e => setForm(f => ({ ...f, salary_min: e.target.value }))} placeholder="150000" /></div>
              <div className="space-y-2"><Label>Salaire max (KMF)</Label><Input type="number" value={form.salary_max} onChange={e => setForm(f => ({ ...f, salary_max: e.target.value }))} placeholder="300000" /></div>
            </div>
            <div className="space-y-2"><Label>Prérequis (un par ligne)</Label><Textarea rows={3} value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} placeholder={"Bac+3 en informatique\n2 ans d'expérience"} /></div>
            <Button type="submit" disabled={submitting}>{submitting ? "Publication..." : "Publier l'offre"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
