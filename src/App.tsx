import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SetupSession from "./pages/SetupSession";
import SessionDemo from "./pages/SessionDemo";
import KnowledgeLibrary from "./pages/KnowledgeLibrary";
import EmailToMeeting from "./pages/EmailToMeeting";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import MeetingTypeComingSoon from "./pages/MeetingTypeComingSoon";
import RachelAutomation from "./pages/RachelAutomation";
import ContractRevRecPOC from "./pages/ContractRevRecPOC";
import ManuPOC from "./pages/ManuPOC";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Set dark mode by default to match Supabase theme
    document.documentElement.classList.add('dark');

    // Test Supabase connection
    const testSupabaseConnection = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('⚠️ Supabase connection test:', error.message);
        } else {
          console.log('✅ Supabase connection successful');
        }
      } catch (err) {
        console.error('❌ Failed to test Supabase connection:', err);
      }
    };
    testSupabaseConnection();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/setup-session" element={<SetupSession />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/:agentId/:automationId/:sessionId"
                element={
                  <ProtectedRoute>
                    <RachelAutomation />
                  </ProtectedRoute>
                }
              />
              <Route path="/session/demo" element={<SessionDemo />} />
              <Route path="/knowledge-library" element={<KnowledgeLibrary />} />
              <Route path="/email-to-meeting" element={<EmailToMeeting />} />
              <Route path="/contract-revrec" element={<ContractRevRecPOC />} />
              <Route path="/manu" element={<ManuPOC />} />
              <Route
                path="/meeting-type/coming-soon"
                element={
                  <ProtectedRoute>
                    <MeetingTypeComingSoon />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;