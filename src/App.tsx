//App.tsx 
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/components/auth/AuthContext";
import { Auth } from "./pages/Auth";
import { Dashboard } from "./pages/Dashboard";
import { ProductAnalyzer } from "@/components/product/ProductAnalyzer";
import { KeywordExplorer } from "@/components/keyword/KeywordExplorer";
import { StoreSpy } from "@/components/store/StoreSpy";
import { Layout } from "@/components/layout/Layout";
import NotFound from "./pages/NotFound";
import { Pricing } from "./pages/Pricing";
import { Account } from "./pages/Account";
import { Success } from "./pages/Success";
import { Cancel } from "./pages/Cancel";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/product-analyzer" element={<ProductAnalyzer />} />
        <Route path="/keyword-explorer" element={<KeywordExplorer />} />
        <Route path="/store-spy" element={<StoreSpy />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/Account" element={<Account />} />
        <Route path="/Auth" element={<Auth />} /> 
        <Route path="/Cancel" element={<Cancel />} />
        <Route path="/Success" element={<Success />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
