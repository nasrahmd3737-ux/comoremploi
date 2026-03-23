import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Jobs from "./pages/Jobs";
import Talents from "./pages/Talents";
import JobDetail from "./pages/JobDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import DashboardLayout from "./components/DashboardLayout";
import CandidateDashboard from "./pages/dashboard/CandidateDashboard";
import CandidateApplications from "./pages/dashboard/CandidateApplications";
import CvBuilder from "./pages/dashboard/CvBuilder";
import EmployerDashboard from "./pages/dashboard/EmployerDashboard";
import EmployerJobs from "./pages/dashboard/EmployerJobs";
import EmployerJobForm from "./pages/dashboard/EmployerJobForm";
import EmployerApplicants from "./pages/dashboard/EmployerApplicants";
import ProfilePage from "./pages/dashboard/ProfilePage";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

function DashboardRouter() {
  const { role } = useAuth();
  if (role === "employer") return <EmployerDashboard />;
  return <CandidateDashboard />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/talents" element={<Talents />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/dashboard" element={<DashboardLayout><DashboardRouter /></DashboardLayout>} />
          <Route path="/dashboard/applications" element={<DashboardLayout><CandidateApplications /></DashboardLayout>} />
          <Route path="/dashboard/cv-builder" element={<DashboardLayout><CvBuilder /></DashboardLayout>} />
          <Route path="/dashboard/jobs" element={<DashboardLayout allowedRoles={["employer"]}><EmployerJobs /></DashboardLayout>} />
          <Route path="/dashboard/jobs/new" element={<DashboardLayout allowedRoles={["employer"]}><EmployerJobForm /></DashboardLayout>} />
          <Route path="/dashboard/applicants" element={<DashboardLayout allowedRoles={["employer"]}><EmployerApplicants /></DashboardLayout>} />
          <Route path="/dashboard/profile" element={<DashboardLayout><ProfilePage /></DashboardLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
