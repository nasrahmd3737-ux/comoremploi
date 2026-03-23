import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Loader2, Send, MessageSquare, Search, ArrowLeft, Circle,
} from "lucide-react";

interface Profile {
  user_id: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
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

export default function MessagesPage() {
  const { user } = useAuth();
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
    if (!user) return;
    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${user.id},participant_two.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user IDs
    const otherIds = convs.map(c =>
      c.participant_one === user.id ? c.participant_two : c.participant_one
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, avatar_url")
      .in("user_id", otherIds);

    const profileMap = new Map<string, Profile>();
    (profiles ?? []).forEach(p => profileMap.set(p.user_id, p as Profile));

    // Get last message and unread count for each conversation
    const enriched = await Promise.all(
      convs.map(async (c) => {
        const otherId = c.participant_one === user.id ? c.participant_two : c.participant_one;
        const { data: lastMsgs } = await supabase
          .from("messages")
          .select("content")
          .eq("conversation_id", c.id)
          .order("created_at", { ascending: false })
          .limit(1);
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", c.id)
          .eq("read", false)
          .neq("sender_id", user.id);

        return {
          ...c,
          otherUser: profileMap.get(otherId),
          lastMsg: lastMsgs?.[0]?.content ?? "",
          unread: count ?? 0,
        } as Conversation;
      })
    );

    setConversations(enriched);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (activeConv && msg.conversation_id === activeConv.id) {
            setMessages(prev => [...prev, msg]);
            // Mark as read if from other user
            if (msg.sender_id !== user.id) {
              supabase.from("messages").update({ read: true }).eq("id", msg.id).then();
            }
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeConv, fetchConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    setMsgLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data ?? []);
    setMsgLoading(false);

    // Mark unread as read
    if (user) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("read", false);
      fetchConversations();
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !activeConv || !user) return;
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: newMsg.trim(),
    });
    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeConv.id);

    setNewMsg("");
    setSending(false);
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, avatar_url")
      .neq("user_id", user?.id ?? "")
      .ilike("full_name", `%${q}%`)
      .limit(10);
    setSearchResults((data as Profile[]) ?? []);
  };

  const startConversation = async (otherUserId: string) => {
    if (!user) return;
    // Check existing
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .or(
        `and(participant_one.eq.${user.id},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${user.id})`
      )
      .maybeSingle();

    if (existing) {
      const conv = conversations.find(c => c.id === existing.id);
      if (conv) { openConversation(conv); }
      else {
        await fetchConversations();
        // Will be picked up after refresh
      }
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    const { data: newConv, error } = await supabase
      .from("conversations")
      .insert({ participant_one: user.id, participant_two: otherUserId })
      .select()
      .single();

    if (error) { toast.error(error.message); return; }
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    await fetchConversations();

    // Find and open the new conv
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id, full_name, role, avatar_url")
      .eq("user_id", otherUserId)
      .maybeSingle();

    const enriched: Conversation = {
      ...newConv,
      otherUser: profile as Profile,
      lastMsg: "",
      unread: 0,
    };
    openConversation(enriched);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays === 0) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Hier";
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const roleLabel = (r: string) => r === "employer" ? "Employeur" : r === "admin" ? "Admin" : "Candidat";

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm">Communiquez avec les candidats et employeurs</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
          {showSearch ? <ArrowLeft className="mr-2 h-4 w-4" /> : <MessageSquare className="mr-2 h-4 w-4" />}
          {showSearch ? "Retour" : "Nouveau"}
        </Button>
      </div>

      {/* Search new user */}
      {showSearch && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={e => handleSearchUsers(e.target.value)}
              autoFocus
            />
            {searchResults.length > 0 && (
              <div className="space-y-1">
                {searchResults.map(p => (
                  <button
                    key={p.user_id}
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => startConversation(p.user_id)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {p.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.full_name}</p>
                      <Badge variant="secondary" className="text-xs">{roleLabel(p.role)}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun utilisateur trouvé</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3" style={{ minHeight: "calc(100vh - 280px)" }}>
        {/* Conversations list */}
        <Card className="lg:col-span-1">
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">Aucune conversation</p>
                  <Button variant="link" size="sm" onClick={() => setShowSearch(true)}>Démarrer une conversation</Button>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    className={`flex w-full items-center gap-3 border-b p-4 text-left transition-colors hover:bg-muted/50 ${activeConv?.id === conv.id ? "bg-muted" : ""}`}
                    onClick={() => openConversation(conv)}
                  >
                    <div className="relative">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                        {conv.otherUser?.full_name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      {(conv.unread ?? 0) > 0 && (
                        <Circle className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 fill-primary text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-medium truncate ${(conv.unread ?? 0) > 0 ? "text-foreground" : ""}`}>
                          {conv.otherUser?.full_name ?? "Utilisateur"}
                        </p>
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground truncate">{conv.lastMsg || "Aucun message"}</p>
                        {(conv.unread ?? 0) > 0 && (
                          <Badge className="ml-2 shrink-0 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                            {conv.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col">
          {!activeConv ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <MessageSquare className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="font-semibold text-lg">Sélectionnez une conversation</h3>
              <p className="text-sm text-muted-foreground mt-1">Choisissez une conversation ou démarrez-en une nouvelle</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setActiveConv(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {activeConv.otherUser?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-medium">{activeConv.otherUser?.full_name ?? "Utilisateur"}</p>
                  <Badge variant="secondary" className="text-xs">
                    {roleLabel(activeConv.otherUser?.role ?? "")}
                  </Badge>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4" style={{ height: "calc(100vh - 420px)" }}>
                {msgLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    Envoyez le premier message !
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => {
                      const isMe = msg.sender_id === user?.id;
                      const showDate = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="text-center my-4">
                              <span className="text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
                                {new Date(msg.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                              </span>
                            </div>
                          )}
                          <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${isMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3">
                <Input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  placeholder="Écrire un message..."
                  className="flex-1"
                  maxLength={5000}
                  disabled={sending}
                />
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
