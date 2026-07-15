import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Send, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

type Audience = "all" | "candidate" | "employer";

interface Props {
  adminId: string;
}

export default function BroadcastMessage({ adminId }: Props) {
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const text = content.trim();
    if (!text) return;
    setSending(true);
    try {
      let query = supabase.from("profiles").select("user_id, role").neq("user_id", adminId);
      if (audience !== "all") query = query.eq("role", audience);
      const { data: profiles, error } = await query;
      if (error) throw error;
      const targets = (profiles ?? []).filter(p => p.role !== "admin" && p.role !== "moderator");
      if (targets.length === 0) {
        toast.info("Aucun destinataire trouvé");
        setSending(false);
        return;
      }

      // Fetch existing conversations for admin
      const { data: existing } = await supabase
        .from("conversations")
        .select("id, participant_one, participant_two")
        .or(`participant_one.eq.${adminId},participant_two.eq.${adminId}`);

      const convMap = new Map<string, string>();
      (existing ?? []).forEach(c => {
        const other = c.participant_one === adminId ? c.participant_two : c.participant_one;
        convMap.set(other, c.id);
      });

      const now = new Date().toISOString();
      let success = 0;
      let failed = 0;

      for (const t of targets) {
        try {
          let convId = convMap.get(t.user_id);
          if (!convId) {
            const { data: newConv, error: cErr } = await supabase
              .from("conversations")
              .insert({ participant_one: adminId, participant_two: t.user_id })
              .select("id")
              .single();
            if (cErr || !newConv) { failed++; continue; }
            convId = newConv.id;
          }
          const { error: mErr } = await supabase
            .from("messages")
            .insert({ conversation_id: convId, sender_id: adminId, content: text });
          if (mErr) { failed++; continue; }
          await supabase.from("conversations").update({ last_message_at: now }).eq("id", convId);
          success++;
        } catch {
          failed++;
        }
      }

      if (success > 0) toast.success(`Message envoyé à ${success} utilisateur${success > 1 ? "s" : ""}`);
      if (failed > 0) toast.error(`Échec pour ${failed} destinataire${failed > 1 ? "s" : ""}`);
      setContent("");
    } catch (e: any) {
      toast.error(e.message ?? "Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const audiences: { key: Audience; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "candidate", label: "Candidats" },
    { key: "employer", label: "Employeurs" },
  ];

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" /> Diffusion à tous les utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground mr-2">Audience :</span>
          {audiences.map(a => (
            <Badge
              key={a.key}
              variant={audience === a.key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setAudience(a.key)}
            >
              {a.label}
            </Badge>
          ))}
        </div>
        <Textarea
          placeholder="Rédigez votre message à diffuser…"
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          maxLength={5000}
          disabled={sending}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Le message sera envoyé dans la messagerie de chaque utilisateur.
          </p>
          <Button onClick={send} disabled={!content.trim() || sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Envoyer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
