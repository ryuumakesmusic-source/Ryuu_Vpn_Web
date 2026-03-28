// ─────────────────────────────────────────────────────────────────
//  artifacts/ryuu-vpn/src/App.tsx  (FIXED)
//
//  Changes vs original:
//  1. Wrapped Router inside ErrorBoundary so any unhandled runtime
//     error shows a user-friendly message instead of a blank screen.
// ─────────────────────────────────────────────────────────────────

import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/topup" component={TopupPage} />
      <Route path="/admin" component={AdminPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ErrorBoundary>
              <Router />
            </ErrorBoundary>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
