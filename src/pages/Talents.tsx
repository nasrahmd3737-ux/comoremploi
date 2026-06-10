import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, GraduationCap, Briefcase, Globe, FileText, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Education { school: string; degree: string; field: string; start_year: string; end_year: string; }
interface Experience { company: string; position: string; description: string; start_date: string; end_date: string; current: boolean; }

interface CandidateProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  bio: string | null;
  skills: string[] | null;
  experience_years: number | null;
  cv_url: string | null;
  cv_education: Education[];
  cv_experience: Experience[];
  cv_languages: string[] | null;
}

const LOCATIONS = ["Tous", "Moroni", "Mutsamudu", "Fomboni", "Mitsamiouli", "Domoni", "Mbéni"];

export default function Talents() {
  const [candidates, setCandidates] = useState<CandidateProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, location, bio, skills, experience_years, cv_url, cv_education, cv_experience, cv_languages")
      .eq("role", "candidate")
      .eq("cv_published", true)
      .order("full_name")
      .then(({ data }) => {
        const enriched = (data ?? []).map((c: any) => ({ ...c, email: null, phone: null }));
        setCandidates(enriched as unknown as CandidateProfile[]);
        setLoading(false);
      });
  }, []);

  const filtered = candidates.filter(c => {
    const matchSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills ?? []).some(s => s.toLowerCase().includes(search.toLowerCase())) ||
      (c.bio ?? "").toLowerCase().includes(search.toLowerCase());
    const matchLocation = location === "Tous" || c.location === location;
    return matchSearch && matchLocation;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="bg-gradient-to-br from-primary/10 via-background to-comores-green/5 py-12">
          <div className="container px-4">
            <h1 className="font-display text-3xl font-bold md:text-4xl">
              Vivier de <span className="text-primary">Talents</span>
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">Découvrez les candidats disponibles aux Comores</p>
          </div>
        </div>

        <div className="container px-4 py-8">
          {/* Filters */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, compétence..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-full sm:w-48">
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Search className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30" />
              <h3 className="text-xl font-semibold">Aucun candidat trouvé</h3>
              <p className="mt-1 text-muted-foreground">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{filtered.length} candidat{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p>
              {filtered.map(c => {
                const isExpanded = expandedId === c.id;
                return (
                  <Card key={c.id} className="overflow-hidden transition-shadow hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                              {c.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{c.full_name}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                {c.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.location}</span>}
                                {c.experience_years != null && <span>• {c.experience_years} an{c.experience_years > 1 ? "s" : ""} d'exp.</span>}
                              </div>
                            </div>
                          </div>

                          {c.bio && <p className="text-sm text-muted-foreground line-clamp-2">{c.bio}</p>}

                          {(c.skills ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {c.skills!.slice(0, 6).map(s => (
                                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                              ))}
                              {c.skills!.length > 6 && <Badge variant="outline" className="text-xs">+{c.skills!.length - 6}</Badge>}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {c.cv_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={c.cv_url} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-1 h-4 w-4" /> CV
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                            {isExpanded ? "Réduire" : "Voir plus"}
                          </Button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 space-y-4 border-t pt-4">
                          {/* Contact masqué — visible uniquement par l'admin */}
                          <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs italic text-muted-foreground">
                            🔒 Les coordonnées (email, téléphone) du candidat sont visibles uniquement par l'administrateur.
                          </div>

                          {/* Education */}
                          {c.cv_education.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 font-semibold text-sm mb-2"><GraduationCap className="h-4 w-4" /> Formation</h4>
                              <div className="space-y-2">
                                {c.cv_education.map((edu, i) => (
                                  <div key={i} className="rounded-md bg-muted/50 p-3 text-sm">
                                    <p className="font-medium">{edu.degree} — {edu.field}</p>
                                    <p className="text-muted-foreground">{edu.school} • {edu.start_year}–{edu.end_year || "en cours"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {c.cv_experience.length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 font-semibold text-sm mb-2"><Briefcase className="h-4 w-4" /> Expérience</h4>
                              <div className="space-y-2">
                                {c.cv_experience.map((exp, i) => (
                                  <div key={i} className="rounded-md bg-muted/50 p-3 text-sm">
                                    <p className="font-medium">{exp.position}</p>
                                    <p className="text-muted-foreground">{exp.company} • {exp.start_date}–{exp.current ? "Présent" : exp.end_date}</p>
                                    {exp.description && <p className="mt-1 text-muted-foreground">{exp.description}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Languages */}
                          {(c.cv_languages ?? []).length > 0 && (
                            <div>
                              <h4 className="flex items-center gap-2 font-semibold text-sm mb-2"><Globe className="h-4 w-4" /> Langues</h4>
                              <div className="flex flex-wrap gap-1.5">
                                {c.cv_languages!.map(l => <Badge key={l} variant="outline">{l}</Badge>)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
