import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Briefcase, Plus, Trash2, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Job = Tables<"jobs">;

export default function EmployerJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("jobs")
      .select("*")
      .eq("employer_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => { setJobs(data ?? []); setLoading(false); });
  }, [user]);

  const toggleStatus = async (job: Job) => {
    const newStatus = job.status === "published" ? "closed" : "published";
    const { error } = await supabase.from("jobs").update({ status: newStatus }).eq("id", job.id);
    if (error) { toast.error(error.message); return; }
    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: newStatus } : j));
  };

  const deleteJob = async (id: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setJobs(prev => prev.filter(j => j.id !== id));
    toast.success("Offre supprimée");
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Mes offres</h1>
          <p className="text-muted-foreground">Gérez vos offres d'emploi</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/jobs/new" className="gap-1"><Plus className="h-4 w-4" /> Nouvelle offre</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Briefcase className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="font-medium">Aucune offre</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
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
                      <TableCell>{j.location}</TableCell>
                      <TableCell><Badge variant="outline">{j.job_type}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={j.status === "published" ? "default" : "secondary"}>
                          {j.status === "published" ? "Active" : "Fermée"}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(j.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => toggleStatus(j)}>
                          {j.status === "published" ? "Fermer" : "Publier"}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteJob(j.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
