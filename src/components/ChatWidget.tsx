import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, MessageSquare, ArrowLeft, Circle } from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  role: string;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  otherUser?: Profile;
  lastMsg?: string;
  unread?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const roleLabel = (r: string) => r === "employer" ? "Employeur" : r === "admin" ? "Admin" : "Candidat";

const formatTime = (d: string) => {
  const date = new Date(d);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Hier";
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

interface Props {
  userId: string;
  userRole?: string;
  height?: string;
}

export default function ChatWidget({ userId, userRole, height = "calc(100vh - 300px)" }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (!convs || convs.length === 0) { setConversations([]); setLoading(false); return; }

    const otherIds = convs.map(c => c.participant_one === userId ? c.participant_two : c.participant_one);
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, role").in("user_id", otherIds);
    const profileMap = new Map<string, Profile>();
    (profiles ?? []).forEach(p => profileMap.set(p.user_id, p as Profile));

    const enriched = await Promise.all(convs.map(async (c) => {
      const otherId = c.participant_one === userId ? c.participant_two : c.participant_one;
      const { data: lastMsgs } = await supabase.from("messages").select("content").eq("conversation_id", c.id).order("created_at", { ascending: false }).limit(1);
      const { count } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", c.id).eq("read", false).neq("sender_id", userId);
      return { ...c, otherUser: profileMap.get(otherId), lastMsg: lastMsgs?.[0]?.content ?? "", unread: count ?? 0 } as Conversation;
    }));

    setConversations(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const channel = supabase
      .channel("chat-widget-rt")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (activeConv && msg.conversation_id === activeConv.id) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id !== userId) supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
        }
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, activeConv, fetchConversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setMsgLoading(true);
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true });
    setMessages(data ?? []);
    setMsgLoading(false);
    await supabase.from("messages").update({ read: true }).eq("conversation_id", conv.id).neq("sender_id", userId).eq("read", false);
    fetchConversations();
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv) return;
    setSending(true);
    await supabase.from("messages").insert({ conversation_id: activeConv.id, sender_id: userId, content: newMsg.trim() });
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", activeConv.id);
    setNewMsg("");
    setSending(false);
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    let query = supabase.from("profiles").select("user_id, full_name, role").neq("user_id", userId).ilike("full_name", `%${q}%`).limit(10);
    // Candidates and employers can only message admins; admins can message anyone
    if (userRole && userRole !== "admin" && userRole !== "moderator") {
      query = query.in("role", ["admin" as any]);
    }
    const { data } = await query;
    setSearchResults((data as Profile[]) ?? []);
  };

  const startConversation = async (otherUserId: string) => {
    const { data: existing } = await supabase
      .from("conversations").select("*")
      .or(`and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`)
      .maybeSingle();

    if (existing) {
      await fetchConversations();
      const conv = conversations.find(c => c.id === existing.id);
      if (conv) openConversation(conv);
    } else {
      const { data: newConv } = await supabase.from("conversations").insert({ participant_one: userId, participant_two: otherUserId }).select().single();
      if (newConv) {
        await fetchConversations();
        const { data: profile } = await supabase.from("profiles").select("user_id, full_name, role").eq("user_id", otherUserId).maybeSingle();
        openConversation({ ...newConv, otherUser: profile as Profile, lastMsg: "", unread: 0 });
      }
    }
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{conversations.length} conversation{conversations.length !== 1 ? "s" : ""}</p>
        <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
          {showSearch ? <ArrowLeft className="mr-1 h-4 w-4" /> : <MessageSquare className="mr-1 h-4 w-4" />}
          {showSearch ? "Retour" : "Nouveau"}
        </Button>
      </div>

      {showSearch && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <Input placeholder="Rechercher un utilisateur..." value={searchQuery} onChange={e => handleSearchUsers(e.target.value)} autoFocus />
            {searchResults.map(p => (
              <button key={p.user_id} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50" onClick={() => startConversation(p.user_id)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">{p.full_name.charAt(0).toUpperCase()}</div>
                <div><p className="text-sm font-medium">{p.full_name}</p><Badge variant="secondary" className="text-[10px]">{roleLabel(p.role)}</Badge></div>
              </button>
            ))}
            {searchQuery.length >= 2 && searchResults.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Aucun résultat</p>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 lg:grid-cols-3" style={{ minHeight: height }}>
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <ScrollArea style={{ height }}>
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">Aucune conversation</p>
                </div>
              ) : conversations.map(conv => (
                <button
                  key={conv.id}
                  className={`flex w-full items-center gap-3 border-b p-3 text-left hover:bg-muted/50 transition-colors ${activeConv?.id === conv.id ? "bg-muted" : ""}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">{conv.otherUser?.full_name?.charAt(0).toUpperCase() ?? "?"}</div>
                    {(conv.unread ?? 0) > 0 && <Circle className="absolute -right-0.5 -top-0.5 h-3 w-3 fill-primary text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{conv.otherUser?.full_name ?? "Utilisateur"}</p>
                      <span className="text-[10px] text-muted-foreground ml-1">{formatTime(conv.last_message_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMsg || "..."}</p>
                      {(conv.unread ?? 0) > 0 && <Badge className="ml-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px]">{conv.unread}</Badge>}
                    </div>
                  </div>
                </button>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 flex flex-col">
          {!activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Sélectionnez une conversation</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-2.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setActiveConv(null)}><ArrowLeft className="h-4 w-4" /></Button>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">{activeConv.otherUser?.full_name?.charAt(0).toUpperCase() ?? "?"}</div>
                <div>
                  <p className="text-sm font-medium">{activeConv.otherUser?.full_name ?? "Utilisateur"}</p>
                  <Badge variant="secondary" className="text-[10px]">{roleLabel(activeConv.otherUser?.role ?? "")}</Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4" style={{ height: `calc(${height} - 110px)` }}>
                {msgLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">Envoyez le premier message !</div>
                ) : (
                  <div className="space-y-2">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === userId;
                      const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && <div className="text-center my-3"><span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</span></div>}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-0.5 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-2.5">
                <Input value={newMsg} onChange={e => setNewMsg(e.target.value)} placeholder="Écrire un message..." className="flex-1" maxLength={5000} disabled={sending} />
                <Button type="submit" size="icon" disabled={!newMsg.trim() || sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
