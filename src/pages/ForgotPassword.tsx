import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import logoImg from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
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
          Réinitialisez votre mot de passe pour retrouver l'accès à votre compte.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Logo className="mb-8 lg:hidden" />

          {sent ? (
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-comores-green/10">
                <CheckCircle2 className="h-6 w-6 text-comores-green" />
              </div>
              <h1 className="font-display text-2xl font-bold">Email envoyé !</h1>
              <p className="text-sm text-muted-foreground">
                Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un lien pour réinitialiser votre mot de passe. Vérifiez aussi vos spams.
              </p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Mot de passe oublié ?</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Entrez votre email, nous vous envoyons un lien pour le réinitialiser.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="votre@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
