
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/auth/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { OnboardingProvider } from "@/hooks/onboarding";
import { TeamProvider } from "@/hooks/teams";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import CreateProfile from "./pages/CreateProfile";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/layout/Layout";
import { useAuth } from "./hooks/useAuth";
import { useOnboarding } from "./hooks/onboarding";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
    },
  },
});

const ProtectedDashboardRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading: authLoading, sessionChecked } = useAuth();
  const { onboarding, isLoading: onboardingLoading, dataFetched } = useOnboarding();
  
  // Show loading state when checking session or fetching onboarding data
  if (authLoading || !sessionChecked || (user && !dataFetched) || (user && onboardingLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  if (!onboarding.isCompleted) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, sessionChecked } = useAuth();
  
  if (isLoading || !sessionChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F7]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#007AFF] mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Verifying your account...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />
      <Route path="/create-profile" element={<CreateProfile />} />
      
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedDashboardRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedDashboardRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedDashboardRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedDashboardRoute>
        }
      />
      <Route
        path="/settings/users"
        element={
          <ProtectedDashboardRoute>
            <Layout>
              <UserManagement />
            </Layout>
          </ProtectedDashboardRoute>
        }
      />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <OnboardingProvider>
              <OrganizationProvider>
                <TeamProvider>
                  <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <AppRoutes />
                  </TooltipProvider>
                </TeamProvider>
              </OrganizationProvider>
            </OnboardingProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
