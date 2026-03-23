import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, User, Building2, Mail, Lock, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type Role = "candidate" | "employer";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "employer" ? "employer" : null;

  const [role, setRole] = useState<Role | null>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
    }
  };

  // Role selection screen
  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Briefcase className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">Kazi <span className="text-primary">Comores</span></span>
        </Link>

        <h1 className="font-display text-2xl font-bold md:text-3xl">Comment souhaitez-vous utiliser Kazi ?</h1>
        <p className="mt-2 text-muted-foreground">Choisissez votre profil pour commencer</p>

        <div className="mt-10 grid w-full max-w-lg gap-4 sm:grid-cols-2">
          <button
            onClick={() => setRole("candidate")}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <User className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold">Candidat</h3>
              <p className="mt-1 text-sm text-muted-foreground">Je cherche un emploi aux Comores</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => setRole("employer")}
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h3 className="font-display text-lg font-semibold">Employeur</h3>
              <p className="mt-1 text-sm text-muted-foreground">Je recrute des talents aux Comores</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Déjà inscrit ?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden w-1/2 bg-hero-gradient lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="flex items-center gap-3 text-white">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
            <Briefcase className="h-7 w-7" />
          </div>
          <span className="font-display text-3xl font-bold">Kazi Comores</span>
        </div>
        <p className="mt-6 max-w-sm text-center text-lg text-white/70">
          {role === "candidate"
            ? "Créez votre profil et postulez aux meilleures offres d'emploi aux Comores."
            : "Publiez vos offres et trouvez les meilleurs talents aux Comores."}
        </p>
      </div>

      {/* Right panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Briefcase className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">Kazi <span className="text-primary">Comores</span></span>
          </Link>

          <button onClick={() => setRole(null)} className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Changer de profil
          </button>

          <h1 className="font-display text-2xl font-bold">
            {role === "candidate" ? "Créer un compte candidat" : "Créer un compte employeur"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Remplissez les informations ci-dessous
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{role === "candidate" ? "Nom complet" : "Nom de l'entreprise"}</Label>
              <Input id="fullName" placeholder={role === "candidate" ? "Ali Mohamed" : "Mon Entreprise SARL"} value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="votre@email.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="Min. 6 caractères" className="pl-10" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Inscription..." : "S'inscrire"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
