import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import ChatWidget from "@/components/ChatWidget";

export default function MessagesPage() {
  const { user, role } = useAuth();

  if (!user) return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground text-sm">Communiquez avec les candidats et employeurs</p>
      </div>
      <ChatWidget userId={user.id} />
    </div>
  );
}
