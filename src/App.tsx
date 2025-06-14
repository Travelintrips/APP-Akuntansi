import { Suspense, useEffect, useState } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/dashboard";
import routes from "tempo-routes";
import AuthPage from "./pages/auth";
import JournalPage from "./pages/journal";
import LedgerPage from "./pages/ledger";
import ReportsPage from "./pages/reports";
import Home from "./pages/Home";
import BalanceSheetPage from "./pages/BalanceSheet";
import COAPage from "./pages/coa/index";
import supabase from "./lib/supabase";
import { CartProvider } from "./context/CartContext";

// Import sub-account pages
import SubAccountDashboard from "./pages/sub-account/SubAccountDashboard";
import TiketPesawatPage from "./pages/sub-account/TiketPesawat";
import HotelPage from "./pages/sub-account/Hotel";
import PassengerHandlingPage from "./pages/sub-account/PassengerHandling";
import TravelPage from "./pages/sub-account/Travel";
import AirportTransferPage from "./pages/sub-account/AirportTransfer";
import RentalCarPage from "./pages/sub-account/RentalCar";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      setIsLoading(false);
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    checkAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <CartProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <div className="min-h-screen">
          {/* For the tempo routes */}
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coa"
              element={
                <ProtectedRoute>
                  <COAPage />
                </ProtectedRoute>
              }
            />

            {/* Sub-account protected routes */}
            <Route
              path="/sub-account"
              element={
                <ProtectedRoute>
                  <SubAccountDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/tiket-pesawat"
              element={
                <ProtectedRoute>
                  <TiketPesawatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/hotel"
              element={
                <ProtectedRoute>
                  <HotelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/passenger-handling"
              element={
                <ProtectedRoute>
                  <PassengerHandlingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/travel"
              element={
                <ProtectedRoute>
                  <TravelPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/airport-transfer"
              element={
                <ProtectedRoute>
                  <AirportTransferPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sub-account/rental-car"
              element={
                <ProtectedRoute>
                  <RentalCarPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/journal"
              element={
                <ProtectedRoute>
                  <JournalPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ledger"
              element={
                <ProtectedRoute>
                  <LedgerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/balance-sheet"
              element={
                <ProtectedRoute>
                  <BalanceSheetPage />
                </ProtectedRoute>
              }
            />

            {/* Add Tempo routes before the catch-all */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" element={<div />} />
            )}
          </Routes>
        </div>
      </Suspense>
    </CartProvider>
  );
}

export default App;
