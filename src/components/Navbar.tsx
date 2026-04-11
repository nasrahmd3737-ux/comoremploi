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

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string; email: string | null; location: string | null } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    supabase.from("profiles").select("full_name, email, location").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const dashboardUrl = role === "admin" || role === "moderator" ? "/admin" : "/dashboard";
  const roleLabel = role === "employer" ? "Employeur" : role === "admin" ? "Admin" : role === "moderator" ? "Modérateur" : "Candidat";

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4">
        <Logo />

        {/* Desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Accueil</Link>
          <Link to="/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Offres d'emploi</Link>
          <Link to="/talents" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Talents</Link>

          {user && profile ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{profile.full_name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{profile.full_name}</p>
                    <p className="text-xs text-muted-foreground">{profile.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                      {profile.location && <span className="text-xs text-muted-foreground">{profile.location}</span>}
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
              <Button variant="ghost" asChild><Link to="/login">Se connecter</Link></Button>
              <Button asChild><Link to="/signup">S'inscrire</Link></Button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <Link to="/" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Accueil</Link>
            <Link to="/jobs" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Offres d'emploi</Link>
            <Link to="/talents" className="text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>Talents</Link>

            {user && profile ? (
              <>
                <div className="border-t pt-3 mt-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{profile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <Button variant="outline" asChild className="w-full mb-2" onClick={() => setMobileOpen(false)}>
                    <Link to={dashboardUrl}>{role === "admin" ? "Admin" : "Tableau de bord"}</Link>
                  </Button>
                  <Button variant="ghost" className="w-full text-destructive" onClick={() => { handleLogout(); setMobileOpen(false); }}>
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
  );
};

export default Navbar;
