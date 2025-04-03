import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/auth/useAuth";
import { OrganizationProvider } from "@/hooks/useOrganization";
import { OnboardingProvider } from "@/hooks/onboarding";
import { TeamProvider } from "@/hooks/teams";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import AcceptInvitation from "./pages/AcceptInvitation";
import NotFound from "./pages/NotFound";
import { Layout } from "./components/layout/Layout";
import { useAuth } from "./hooks/useAuth";
import { useOnboarding } from "./hooks/onboarding";

const queryClient = new QueryClient();

const ProtectedDashboardRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const { onboarding } = useOnboarding();
  
  useEffect(() => {
    if (user) {
      console.log("ProtectedDashboardRoute - User:", user.id);
      console.log("ProtectedDashboardRoute - Onboarding completed:", onboarding.isCompleted);
    }
  }, [user, onboarding]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log("User not authenticated, redirecting to auth");
    return <Navigate to="/auth" replace />;
  }
  
  if (!onboarding.isCompleted) {
    console.log("Onboarding not completed, redirecting to onboarding");
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-lg font-medium">Loading...</p>
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
