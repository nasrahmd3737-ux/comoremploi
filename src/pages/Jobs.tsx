import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Building2, Clock, Search, Briefcase, Loader2, Banknote } from "lucide-react";
import { Link } from "react-router-dom";
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Toutes");
  const [category, setCategory] = useState("Toutes");
  const [jobType, setJobType] = useState("Tous");

  useEffect(() => {
    supabase
      .from("jobs")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data }) => { setJobs(data ?? []); setLoading(false); });
  }, []);

  const filtered = jobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (location !== "Toutes" && j.location !== location) return false;
    if (category !== "Toutes" && j.category !== category) return false;
    if (jobType !== "Tous" && j.job_type !== jobType) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-hero-gradient py-12">
        <div className="container px-4 text-center">
          <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Offres d'emploi</h1>
          <p className="mt-2 text-white/70">Trouvez l'opportunité qui vous correspond aux Comores</p>
        </div>
      </section>

      <div className="container px-4 py-8 flex-1">
        {/* Filters */}
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
              return (
                <Card key={job.id} className="group transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="outline">{job.job_type}</Badge>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-semibold group-hover:text-primary transition-colors">{job.title}</h3>
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
                    <Button className="mt-4 w-full" size="sm" asChild>
                      <Link to={`/jobs/${job.id}`}>Voir l'offre</Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Jobs;
