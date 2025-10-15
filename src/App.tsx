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
import TransactionReports from "./pages/TransactionReports";
import supabase from "./lib/supabase";
import { CartProvider } from "./context/CartContext";
import { useUserRole } from "./hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

// Import sub-account pages
import SubAccountDashboard from "./pages/sub-account/SubAccountDashboard";
import TiketPesawatPage from "./pages/sub-account/TiketPesawat";
import HotelPage from "./pages/sub-account/Hotel";
import PassengerHandlingPage from "./pages/sub-account/PassengerHandling";
import TravelPage from "./pages/sub-account/Travel";
import AirportTransferPage from "./pages/sub-account/AirportTransfer";
import RentalCarPage from "./pages/sub-account/RentalCar";
import UserRoleDebug from "./components/debug/UserRoleDebug";
import UsersPage from "./pages/Users";
import DriverTopupsPage from "./pages/DriverTopups";
import PengajuanPembelian from "./pages/layanan/PengajuanPembelian";
import StokBarang from "./pages/layanan/StokBarang";
import Supplier from "./pages/layanan/Supplier";

// Protected route component
const ProtectedRoute = ({
  children,
  allowedRoles = ["admin", "staff_trips"],
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) => {
  const { userProfile, loading: profileLoading } = useUserRole();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth session error:", error);
          if (isMounted) {
            setIsAuthenticated(false);
            setIsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setIsAuthenticated(!!data.session);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Show loading only when we're actually checking auth state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading for user profile only after auth is confirmed
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (
    userProfile &&
    !allowedRoles
      .map((role) => role.toLowerCase())
      .includes(userProfile.role.toLowerCase())
  ) {
    const handleLogout = async () => {
      try {
        await supabase.auth.signOut();
        // Navigation will be handled by the auth state listener
      } catch (error) {
        console.error("Error logging out:", error);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center max-w-md mx-auto p-8 bg-card rounded-lg border shadow-sm">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-destructive mb-2">
              Akses Ditolak
            </h2>
            <p className="text-muted-foreground mb-4">
              Anda tidak memiliki izin untuk mengakses halaman ini.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Role Anda:{" "}
              <span className="font-semibold">{userProfile.role}</span>
              <br />
              Role yang dibutuhkan:{" "}
              <span className="font-semibold">{allowedRoles.join(", ")}</span>
            </p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={handleLogout}
              className="w-full"
              variant="destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <p className="text-xs text-muted-foreground">
              Silakan login dengan akun yang memiliki izin yang sesuai
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Admin-only route component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute allowedRoles={["admin", "Admin"]}>
      {children}
    </ProtectedRoute>
  );
};

// Staff trips route component (for services and transaction reports)
const StaffTripsRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute allowedRoles={["admin", "staff_trips"]}>
      {children}
    </ProtectedRoute>
  );
};

function App() {
  console.log(
    "App component rendering, current location:",
    window.location.pathname,
  );

  return (
    <CartProvider>
      <Suspense fallback={<p>Loading...</p>}>
        <div className="min-h-screen">
          <Routes>
            {/* For the tempo routes */}
            {import.meta.env.VITE_TEMPO === "true" && (
              <Route path="/tempobook/*" element={<div />} />
            )}

            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/coa"
              element={
                <AdminRoute>
                  <COAPage />
                </AdminRoute>
              }
            />

            {/* Sub-account protected routes - Available to both admin and staff_trips */}
            <Route
              path="/sub-account"
              element={
                <StaffTripsRoute>
                  <SubAccountDashboard />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/tiket-pesawat"
              element={
                <StaffTripsRoute>
                  <TiketPesawatPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/hotel"
              element={
                <StaffTripsRoute>
                  <HotelPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/passenger-handling"
              element={
                <StaffTripsRoute>
                  <PassengerHandlingPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/travel"
              element={
                <StaffTripsRoute>
                  <TravelPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/airport-transfer"
              element={
                <StaffTripsRoute>
                  <AirportTransferPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/sub-account/rental-car"
              element={
                <StaffTripsRoute>
                  <RentalCarPage />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/layanan/stok-barang"
              element={
                <StaffTripsRoute>
                  <StokBarang />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/layanan/pengajuan-pembelian"
              element={
                <StaffTripsRoute>
                  <PengajuanPembelian />
                </StaffTripsRoute>
              }
            />
            <Route
              path="/layanan/supplier"
              element={
                <StaffTripsRoute>
                  <Supplier />
                </StaffTripsRoute>
              }
            />

            <Route
              path="/journal"
              element={
                <AdminRoute>
                  <JournalPage />
                </AdminRoute>
              }
            />
            <Route
              path="/ledger"
              element={
                <AdminRoute>
                  <LedgerPage />
                </AdminRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <AdminRoute>
                  <ReportsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/balance-sheet"
              element={
                <AdminRoute>
                  <BalanceSheetPage />
                </AdminRoute>
              }
            />
            <Route
              path="/transaction-reports"
              element={
                <StaffTripsRoute>
                  <TransactionReports />
                </StaffTripsRoute>
              }
            />

            {/* Users Data Section - Only for Admin */}
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <UsersPage />
                </AdminRoute>
              }
            />

            {/* Driver Topups - Only for Admin */}
            <Route
              path="/reports/driver-topups"
              element={
                <AdminRoute>
                  <DriverTopupsPage />
                </AdminRoute>
              }
            />

            {/* Debug route - only in development */}
            <Route
              path="/debug-roles"
              element={
                <ProtectedRoute>
                  <UserRoleDebug />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>

          {/* For the tempo routes */}
          {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        </div>
      </Suspense>
    </CartProvider>
  );
}

export default App;