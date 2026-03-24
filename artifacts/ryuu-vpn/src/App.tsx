import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { WelcomeAnnouncement } from "@/components/WelcomeAnnouncement";
import { useState, useEffect } from "react";
import HomePage from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import TopupPage from "@/pages/topup";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      // Check if user has seen the announcement
      const hasSeenAnnouncement = localStorage.getItem('ryuu_seen_announcement');
      
      if (!hasSeenAnnouncement) {
        setShowAnnouncement(true);
      } else {
        // If logged in and seen announcement, redirect to dashboard from home
        if (window.location.pathname === '/') {
          navigate('/dashboard');
        }
      }
    }
  }, [user, loading, navigate]);

  const handleDismissAnnouncement = () => {
    localStorage.setItem('ryuu_seen_announcement', 'true');
    setShowAnnouncement(false);
    navigate('/dashboard');
  };

  return (
    <>
      {showAnnouncement && <WelcomeAnnouncement onDismiss={handleDismissAnnouncement} />}
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/topup" component={TopupPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
