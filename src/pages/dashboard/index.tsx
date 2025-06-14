import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/Sidebar";
import COAList from "@/components/coa/COAList";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<string>("dashboard");

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
      }
    };

    checkSession();
  }, [navigate]);

  const handleNavItemClick = (item: string) => {
    setActiveItem(item);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onNavItemClick={handleNavItemClick} activeItem={activeItem} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">
              {activeItem === "coa"
                ? "Bagan Akun"
                : activeItem === "journal"
                  ? "Jurnal"
                  : activeItem === "ledger"
                    ? "Buku Besar"
                    : activeItem === "reports"
                      ? "Laporan"
                      : activeItem === "balance-sheet"
                        ? "Neraca"
                        : "Dashboard"}
            </h1>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth");
              }}
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>

          {activeItem === "dashboard" && (
            <div className="bg-card rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Selamat Datang</h2>
              <p className="text-muted-foreground">
                Selamat datang di aplikasi akuntansi. Gunakan menu di sidebar
                untuk navigasi.
              </p>
            </div>
          )}

          {activeItem === "coa" && (
            <div className="w-full">
              <COAList />
            </div>
          )}

          {activeItem === "journal" && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Jurnal</h2>
                <p className="text-muted-foreground mb-4">
                  Buat dan kelola entri jurnal
                </p>
                <Button onClick={() => navigate("/journal")}>
                  Buka Halaman Jurnal
                </Button>
              </div>
            </div>
          )}

          {activeItem === "ledger" && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Buku Besar</h2>
                <p className="text-muted-foreground mb-4">
                  Lihat saldo akun dan riwayat transaksi
                </p>
                <Button onClick={() => navigate("/ledger")}>
                  Buka Halaman Buku Besar
                </Button>
              </div>
            </div>
          )}

          {activeItem === "reports" && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Laporan Keuangan</h2>
                <p className="text-muted-foreground mb-4">
                  Lihat neraca dan laporan laba rugi
                </p>
                <Button onClick={() => navigate("/reports")}>
                  Buka Halaman Laporan
                </Button>
              </div>
            </div>
          )}

          {activeItem === "balance-sheet" && (
            <div className="w-full">
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Neraca</h2>
                <p className="text-muted-foreground mb-4">
                  Lihat neraca keuangan
                </p>
                <Button onClick={() => navigate("/balance-sheet")}>
                  Buka Halaman Neraca
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
