import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut, LayoutDashboard, Shield, MessageSquare } from "lucide-react";
import Logo from "@/components/Logo";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AdBanner from "@/components/AdBanner";

import { toast } from "sonner";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; email: string | null; location: string | null } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("full_name, email, location").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleLogout = async () => {
    const { error } = await signOut();

    if (error) {
      toast.error("La déconnexion a échoué, veuillez réessayer.");
      return;
    }

    setProfile(null);
    setMobileOpen(false);
    navigate("/", { replace: true });
    toast.success("Déconnexion réussie");
  };

  const dashboardUrl = role === "admin" || role === "moderator" ? "/admin" : "/dashboard";
  const roleLabel = role === "employer" ? "Employeur" : role === "admin" ? "Admin" : role === "moderator" ? "Modérateur" : "Candidat";
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Mon compte";
  const displayEmail = profile?.email ?? user?.email ?? null;
  const displayLocation = profile?.location ?? null;

  return (
    <div className="sticky top-0 z-50">
      <AdBanner />
      <nav className="border-b bg-primary backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">

        <Logo variant="light" />

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Accueil</Link>
          <Link to="/jobs" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Offres d'emploi</Link>
          <Link to="/talents" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">Talents</Link>
          <Link to="/about" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">À propos</Link>
          <Link to="/cgu" className="text-sm font-medium text-primary-foreground/80 hover:text-primary-foreground transition-colors">CGU</Link>

          {loading ? (
            <div className="h-10 w-28 rounded-md bg-primary-foreground/10" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 text-primary-foreground hover:bg-primary-foreground/10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground font-bold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{displayName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                      {displayLocation && <span className="text-xs text-muted-foreground">{displayLocation}</span>}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(dashboardUrl)}>
                  {role === "admin" ? <Shield className="mr-2 h-4 w-4" /> : <LayoutDashboard className="mr-2 h-4 w-4" />}
                  {role === "admin" ? "Admin" : "Tableau de bord"}
                </DropdownMenuItem>
                {role !== "admin" && (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/profile")}>
                      <User className="mr-2 h-4 w-4" /> Mon profil
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/dashboard/messages")}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Messages
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10" asChild><Link to="/login">Se connecter</Link></Button>
              <Button variant="secondary" asChild><Link to="/signup">S'inscrire</Link></Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6 text-primary-foreground" /> : <Menu className="h-6 w-6 text-primary-foreground" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Accueil</Link>
            <Link to="/jobs" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Offres d'emploi</Link>
            <Link to="/talents" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Talents</Link>
            <Link to="/about" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>À propos</Link>
            <Link to="/cgu" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>CGU</Link>

            {loading ? (
              <div className="h-10 w-full rounded-md bg-muted" />
            ) : user ? (
              <>
                <div className="border-t pt-3 mt-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{displayEmail}</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="w-full mb-2" onClick={() => setMobileOpen(false)}>
                    <Link to={dashboardUrl}>{role === "admin" ? "Admin" : "Tableau de bord"}</Link>
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Se déconnecter
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/login" onClick={() => setMobileOpen(false)}>Se connecter</Link>
                </Button>
                <Button asChild className="w-full">
                  <Link to="/signup" onClick={() => setMobileOpen(false)}>S'inscrire</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
    </div>
  );
};

export default Navbar;
