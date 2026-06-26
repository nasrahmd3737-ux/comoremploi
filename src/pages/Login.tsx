import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import logoImg from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    navigate(role === "admin" || role === "moderator" ? "/admin" : "/dashboard", { replace: true });
  }, [authLoading, navigate, role, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

      if (error) {
        toast.error(
          error.message === "Invalid login credentials"
            ? "Email ou mot de passe incorrect"
            : error.message === "Email not confirmed"
              ? "Veuillez confirmer votre email avant de vous connecter"
              : error.message,
        );
        return;
      }

      toast.success("Connexion réussie !");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Erreur de connexion, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 bg-hero-gradient lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <img src={logoImg} alt="Comores Emploi" className="h-14 w-14 rounded-full object-cover" style={{ objectPosition: '25% center' }} />
          <span className="font-display text-3xl font-bold">Comores Emploi</span>
        </div>
        <p className="mt-6 max-w-sm text-center text-lg text-white/70">
          Connectez-vous pour accéder à votre tableau de bord et gérer vos candidatures ou offres d'emploi.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />

          <h1 className="font-display text-2xl font-bold">Bon retour !</h1>
          <p className="mt-2 text-sm text-muted-foreground">Connectez-vous à votre compte</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="votre@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
