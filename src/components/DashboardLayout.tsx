import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import {
  Briefcase, LayoutDashboard, FileText, User, Building2, LogOut, Plus, Users, Loader2,
} from "lucide-react";
import { Navigate } from "react-router-dom";

const candidateLinks = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mes candidatures", url: "/dashboard/applications", icon: FileText },
  { title: "Créer mon CV", url: "/dashboard/cv-builder", icon: FileText },
  { title: "Mon profil", url: "/dashboard/profile", icon: User },
];

const employerLinks = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard },
  { title: "Mes offres", url: "/dashboard/jobs", icon: Briefcase },
  { title: "Candidatures reçues", url: "/dashboard/applicants", icon: Users },
  { title: "Vivier de talents", url: "/talents", icon: Users },
  { title: "Publier une offre", url: "/dashboard/jobs/new", icon: Plus },
  { title: "Mon profil", url: "/dashboard/profile", icon: Building2 },
];

function SidebarNav() {
  const { role } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const links = role === "employer" ? employerLinks : candidateLinks;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
            <Briefcase className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-display text-lg font-bold">
              Comores <span className="text-primary">Emploi</span>
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>
            {role === "employer" ? "Employeur" : "Candidat"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function DashboardLayout({ children, allowedRoles }: DashboardLayoutProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/dashboard" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SidebarNav />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md px-4">
            <SidebarTrigger className="ml-0" />
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="capitalize">{role}</Badge>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => { supabase.auth.signOut(); window.location.href = "/"; }}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
