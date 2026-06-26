import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import logoImg from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Mot de passe mis à jour avec succès !");
      navigate("/login", { replace: true });
    } catch {
      toast.error("Une erreur est survenue, veuillez réessayer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-hero-gradient lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <img src={logoImg} alt="Comores Emploi" className="h-14 w-14 rounded-full object-cover" style={{ objectPosition: '25% center' }} />
          <span className="font-display text-3xl font-bold">Comores Emploi</span>
        </div>
        <p className="mt-6 max-w-sm text-center text-lg text-white/70">
          Choisissez un nouveau mot de passe pour sécuriser votre compte.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />

          {!ready ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Vérification du lien de réinitialisation...</p>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Nouveau mot de passe</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Choisissez un nouveau mot de passe pour votre compte.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••••" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="confirmPassword" type="password" placeholder="••••••••" className="pl-10" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
