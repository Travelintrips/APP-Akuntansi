import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Hotel,
  Users,
  Briefcase,
  Bus,
  Car,
  FileText,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export default function SubAccountDashboard() {
  const navigate = useNavigate();
  const { userProfile, isStaffTrips } = useUserRole();

  const subAccounts = [
    {
      title: "Tiket Pesawat",
      description: "Manajemen penjualan tiket pesawat",
      icon: <Plane className="h-8 w-8 text-primary" />,
      path: "/sub-account/tiket-pesawat",
      color: "bg-blue-50",
    },
    {
      title: "Hotel",
      description: "Manajemen pemesanan hotel",
      icon: <Hotel className="h-8 w-8 text-primary" />,
      path: "/sub-account/hotel",
      color: "bg-green-50",
    },
    {
      title: "Passenger Handling",
      description: "Layanan penanganan penumpang",
      icon: <Users className="h-8 w-8 text-primary" />,
      path: "/sub-account/passenger-handling",
      color: "bg-purple-50",
    },
    {
      title: "Travel",
      description: "Paket perjalanan wisata",
      icon: <Briefcase className="h-8 w-8 text-primary" />,
      path: "/sub-account/travel",
      color: "bg-yellow-50",
    },
    {
      title: "Airport Transfer",
      description: "Layanan antar-jemput bandara",
      icon: <Bus className="h-8 w-8 text-primary" />,
      path: "/sub-account/airport-transfer",
      color: "bg-orange-50",
    },
    {
      title: "Rental Car",
      description: "Layanan sewa mobil",
      icon: <Car className="h-8 w-8 text-primary" />,
      path: "/sub-account/rental-car",
      color: "bg-red-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Layanan</h1>
            <p className="text-muted-foreground mt-2">
              Pilih kategori sub akun untuk melihat detail dan mengelola
              transaksi
            </p>

            {/* Quick Access for Staff Trips */}
            {isStaffTrips && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">
                      Akses Cepat - Staff Trips
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Lihat laporan transaksi dan data penjualan
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate("/transaction-reports")}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Laporan Transaksi
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subAccounts.map((account, index) => (
              <Card
                key={index}
                className={`${account.color} border hover:shadow-md transition-all cursor-pointer`}
                onClick={() => navigate(account.path)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    {account.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2">
                    {account.title}
                  </CardTitle>
                  <CardDescription>{account.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
