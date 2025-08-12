import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Sidebar from "@/components/Sidebar";
import COAList from "@/components/coa/COAList";
import ProfitLossChart from "@/components/dashboard/ProfitLossChart";
import BalanceSheetPieChart from "@/components/dashboard/BalanceSheetPieChart";
import RevenueExpenseTrend from "@/components/dashboard/RevenueExpenseTrend";
import AccountSummaryCards from "@/components/dashboard/AccountSummaryCards";
import TrialBalanceDisplay from "@/components/dashboard/TrialBalanceDisplay";
import BalanceSheetDisplay from "@/components/dashboard/BalanceSheetDisplay";
import COADisplay from "@/components/dashboard/COADisplay";
import {
  Plane,
  Hotel,
  Users,
  Briefcase,
  Bus,
  Car,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
  ListTree,
  BookOpen,
  FileText,
  X,
  Filter,
  Eye,
  EyeOff,
  FileImage,
  RefreshCw,
} from "lucide-react";

interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  selfie_url: string | null;
  ktp_url: string | null;
  sim_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

interface UsersListPanelProps {
  onClose: () => void;
}

const UsersListPanel = ({ onClose }: UsersListPanelProps) => {
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, full_name, email, role, selfie_url, ktp_url, sim_url, phone, address, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        return;
      }

      if (data) {
        setUsersData(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    if (role === "all") {
      setFilteredUsers(usersData);
    } else {
      setFilteredUsers(usersData.filter((user) => user.role === role));
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff_trips":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const PhotoDialog = ({
    photoUrl,
    title,
  }: {
    photoUrl: string | null;
    title: string;
  }) => {
    if (!photoUrl) {
      return (
        <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
          <FileImage className="h-4 w-4 text-gray-400" />
        </div>
      );
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <img
            src={photoUrl}
            alt={title}
            className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
          />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={photoUrl}
              alt={title}
              className="max-w-full max-h-96 object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  useEffect(() => {
    fetchUsersData();
  }, []);

  return (
    <div className="w-96 bg-card border-l p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Data Users dari Supabase
          </h2>
          <p className="text-sm text-muted-foreground">
            Menampilkan data pengguna yang tersimpan di database
          </p>
        </div>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Controls */}
      <div className="space-y-3 mb-4">
        {/* Role Filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Filter Role:</span>
          </div>
          <Select value={selectedRole} onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                Semua Role ({usersData.length})
              </SelectItem>
              <SelectItem value="admin">
                Admin ({usersData.filter((u) => u.role === "admin").length})
              </SelectItem>
              <SelectItem value="staff_trips">
                Staff Trips (
                {usersData.filter((u) => u.role === "staff_trips").length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Refresh Button */}
        <Button
          onClick={fetchUsersData}
          variant="outline"
          size="sm"
          className="w-full"
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">
              Memuat data users dari Supabase...
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              {selectedRole === "all"
                ? "Tidak ada data user"
                : `Tidak ada user dengan role ${selectedRole}`}
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card
              key={user.id}
              className="p-3 hover:shadow-md transition-shadow"
            >
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {(user.full_name || user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {user.full_name || "Nama tidak tersedia"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || "Email tidak tersedia"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {user.id.substring(0, 8)}...
                    </p>
                  </div>
                  <Badge className={getRoleColor(user.role)}>
                    {user.role || "No Role"}
                  </Badge>
                </div>

                {/* Photos Section */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <FileImage className="h-3 w-3" />
                    Dokumen & Foto:
                  </div>
                  <div className="flex gap-2 justify-center">
                    <div className="text-center">
                      <PhotoDialog
                        photoUrl={user.selfie_url}
                        title="Foto Selfie"
                      />
                      <div className="text-xs mt-1">Selfie</div>
                    </div>
                    <div className="text-center">
                      <PhotoDialog photoUrl={user.ktp_url} title="Foto KTP" />
                      <div className="text-xs mt-1">KTP</div>
                    </div>
                    <div className="text-center">
                      <PhotoDialog photoUrl={user.sim_url} title="Foto SIM" />
                      <div className="text-xs mt-1">SIM</div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(user.phone || user.address) && (
                  <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                    {user.phone && (
                      <div className="flex items-center gap-1 truncate">
                        <span>📞</span>
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex items-center gap-1 truncate">
                        <span>📍</span>
                        <span>{user.address}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Created Date */}
                {user.created_at && (
                  <div className="text-xs text-muted-foreground pt-1 border-t">
                    Terdaftar:{" "}
                    {new Date(user.created_at).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Summary */}
      {usersData.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200 mt-4">
          <div className="text-sm font-medium text-blue-800 mb-1">
            Ringkasan Data Users
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-blue-700">
              Total:{" "}
              <span className="font-semibold">{filteredUsers.length}</span> user
              {filteredUsers.length !== 1 ? "s" : ""}
            </div>
            <div className="text-blue-700">
              Filter:{" "}
              <span className="font-semibold">
                {selectedRole === "all" ? "Semua" : selectedRole}
              </span>
            </div>
            <div className="text-blue-700">
              Admin:{" "}
              <span className="font-semibold">
                {usersData.filter((u) => u.role === "admin").length}
              </span>
            </div>
            <div className="text-blue-700">
              Staff:{" "}
              <span className="font-semibold">
                {usersData.filter((u) => u.role === "staff_trips").length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Users Data Summary Component
const UsersDataSummary = () => {
  const [usersStats, setUsersStats] = useState({
    totalUsers: 0,
    adminUsers: 0,
    staffTripsUsers: 0,
    usersWithPhotos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsersStats();
  }, []);

  const fetchUsersStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, role, selfie_url, ktp_url, sim_url");

      if (error) {
        console.error("Error fetching users stats:", error);
        return;
      }

      if (data) {
        const totalUsers = data.length;
        const adminUsers = data.filter((user) => user.role === "admin").length;
        const staffTripsUsers = data.filter(
          (user) => user.role === "staff_trips",
        ).length;
        const usersWithPhotos = data.filter(
          (user) => user.selfie_url || user.ktp_url || user.sim_url,
        ).length;

        setUsersStats({
          totalUsers,
          adminUsers,
          staffTripsUsers,
          usersWithPhotos,
        });
      }
    } catch (error) {
      console.error("Error fetching users stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
      <h2 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <Users className="h-6 w-6" />
        Data Users dari Supabase
      </h2>
      <p className="text-green-600 mb-4">
        Ringkasan data pengguna yang tersimpan di database Supabase
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {loading ? "..." : usersStats.totalUsers}
          </div>
          <div className="text-sm text-green-600">Total Users</div>
          <div className="text-xs text-green-500">Dari tabel users</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {loading ? "..." : usersStats.adminUsers}
          </div>
          <div className="text-sm text-green-600">Admin</div>
          <div className="text-xs text-green-500">Role admin</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {loading ? "..." : usersStats.staffTripsUsers}
          </div>
          <div className="text-sm text-green-600">Staff Trips</div>
          <div className="text-xs text-green-500">Role staff_trips</div>
        </div>
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {loading ? "..." : usersStats.usersWithPhotos}
          </div>
          <div className="text-sm text-green-600">Dengan Foto</div>
          <div className="text-xs text-green-500">Ada selfie/KTP/SIM</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 justify-center">
        <Button
          onClick={fetchUsersStats}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
        <Button
          onClick={() => window.open("/users", "_blank")}
          variant="default"
          size="sm"
          className="bg-green-600 hover:bg-green-700"
        >
          <Eye className="h-4 w-4 mr-2" />
          Lihat Detail Users
        </Button>
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-green-600">
          💡 Lihat detail lengkap di sidebar kiri atau klik tombol di atas
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const [activeItem, setActiveItem] = useState<string>("dashboard");
  const [showUsersList, setShowUsersList] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    monthlyBookings: 0,
    serviceStats: {
      tiket_pesawat: { count: 0, revenue: 0 },
      hotel: { count: 0, revenue: 0 },
      passenger_handling: { count: 0, revenue: 0 },
      travel: { count: 0, revenue: 0 },
      airport_transfer: { count: 0, revenue: 0 },
      rental_car: { count: 0, revenue: 0 },
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
      }
    };

    checkSession();
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch bookings data
      const { data: bookings, error } = await supabase
        .from("bookings_trips")
        .select("*");

      if (error) {
        console.error("Error fetching stats:", error);
        return;
      }

      if (bookings) {
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce(
          (sum, booking) => sum + (booking.harga_jual || 0),
          0,
        );

        // Calculate monthly bookings (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyBookings = bookings.filter((booking) => {
          const bookingDate = new Date(booking.tanggal);
          return (
            bookingDate.getMonth() === currentMonth &&
            bookingDate.getFullYear() === currentYear
          );
        }).length;

        // Calculate service-specific stats
        const serviceStats = {
          tiket_pesawat: { count: 0, revenue: 0 },
          hotel: { count: 0, revenue: 0 },
          passenger_handling: { count: 0, revenue: 0 },
          travel: { count: 0, revenue: 0 },
          airport_transfer: { count: 0, revenue: 0 },
          rental_car: { count: 0, revenue: 0 },
        };

        bookings.forEach((booking) => {
          const serviceType = booking.service_type;
          if (serviceStats[serviceType as keyof typeof serviceStats]) {
            serviceStats[serviceType as keyof typeof serviceStats].count += 1;
            serviceStats[serviceType as keyof typeof serviceStats].revenue +=
              booking.harga_jual || 0;
          }
        });

        setStats({
          totalBookings,
          totalRevenue,
          monthlyBookings,
          serviceStats,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavItemClick = (item: string) => {
    setActiveItem(item);
  };

  const handleShowUsersList = (show: boolean) => {
    setShowUsersList(show);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        onNavItemClick={handleNavItemClick}
        activeItem={activeItem}
        onShowUsersList={handleShowUsersList}
      />

      <div className="flex-1 flex">
        <div
          className={`${showUsersList ? "flex-1" : "w-full"} p-6 overflow-auto`}
        >
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
              <div className="space-y-8">
                {/* Interactive Financial Dashboard */}
                <div className="space-y-8">
                  {/* Quick Accounting Actions */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                    <h2 className="text-xl font-bold text-blue-800 mb-4">
                      Sistem Akuntansi Terintegrasi
                    </h2>
                    <p className="text-blue-600 mb-4">
                      Kelola semua aspek keuangan bisnis Anda dalam satu
                      dashboard
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Button
                        onClick={() => navigate("/coa")}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <ListTree className="h-4 w-4 mr-2" />
                        Bagan Akun
                      </Button>
                      <Button
                        onClick={() => navigate("/journal")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <BookOpen className="h-4 w-4 mr-2" />
                        Jurnal
                      </Button>
                      <Button
                        onClick={() => navigate("/ledger")}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Buku Besar
                      </Button>
                      <Button
                        onClick={() => navigate("/reports")}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Laporan
                      </Button>
                      <Button
                        onClick={() => {
                          const element = document.querySelector(
                            '[data-testid="coa-display"]',
                          );
                          if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        <ListTree className="h-4 w-4 mr-2" />
                        Lihat Bagan Akun
                      </Button>
                    </div>
                  </div>

                  {/* Account Summary Cards */}
                  <AccountSummaryCards />

                  {/* Chart of Accounts Section - Connected with Supabase */}
                  <div className="w-full">
                    <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-indigo-800 mb-2">
                        Bagan Akun Terintegrasi
                      </h3>
                      <p className="text-indigo-600 text-sm">
                        Data bagan akun ini terhubung langsung dengan database
                        Supabase. Menampilkan semua akun yang tersedia dalam
                        sistem akuntansi dengan informasi saldo terkini dan
                        klasifikasi akun.
                      </p>
                    </div>
                    <COADisplay />
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ProfitLossChart />
                    <BalanceSheetPieChart />
                  </div>

                  {/* Charts Row 2 */}
                  <div className="w-full">
                    <RevenueExpenseTrend />
                  </div>

                  {/* Balance Sheet Section - From Trial Balance Data */}
                  <div className="w-full">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Neraca Keuangan (Balance Sheet)
                      </h3>
                      <p className="text-green-600 text-sm">
                        Neraca menampilkan posisi keuangan perusahaan dengan
                        mengelompokkan data dari trial balance berdasarkan jenis
                        akun (Aset, Kewajiban, Ekuitas). Data diambil langsung
                        dari tabel trial_balance yang terintegrasi dengan jurnal
                        umum.
                      </p>
                    </div>
                    <BalanceSheetDisplay />
                  </div>

                  {/* Trial Balance Section - Connected with Journal Entries */}
                  <div className="w-full">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        Neraca Saldo Terintegrasi
                      </h3>
                      <p className="text-blue-600 text-sm">
                        Data neraca saldo ini terhubung langsung dengan jurnal
                        umum dan buku besar. Setiap entri jurnal akan otomatis
                        memperbarui saldo akun di neraca saldo.
                      </p>
                    </div>
                    <TrialBalanceDisplay />
                  </div>
                </div>

                {/* Users Data Summary - Only for Admin */}
                {isAdmin && <UsersDataSummary />}

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => navigate("/transaction-reports")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Bookings
                      </CardTitle>
                      <BarChart3 className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "..." : stats.totalBookings}
                      </div>
                      <p className="text-xs text-blue-100">
                        Total semua pemesanan
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => navigate("/transaction-reports")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Revenue
                      </CardTitle>
                      <DollarSign className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading
                          ? "..."
                          : `Rp ${stats.totalRevenue.toLocaleString("id-ID")}`}
                      </div>
                      <p className="text-xs text-green-100">Total pendapatan</p>
                    </CardContent>
                  </Card>

                  <Card
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => {
                      const currentMonth = new Date().getMonth() + 1;
                      const currentYear = new Date().getFullYear();
                      const dateFrom = `${currentYear}-${currentMonth.toString().padStart(2, "0")}-01`;
                      const dateTo = new Date(currentYear, currentMonth, 0)
                        .toISOString()
                        .split("T")[0];
                      navigate(
                        `/transaction-reports?dateFrom=${dateFrom}&dateTo=${dateTo}`,
                      );
                    }}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Bulan Ini
                      </CardTitle>
                      <Calendar className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading ? "..." : stats.monthlyBookings}
                      </div>
                      <p className="text-xs text-purple-100">
                        Booking bulan ini
                      </p>
                    </CardContent>
                  </Card>

                  <Card
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                    onClick={() => navigate("/transaction-reports")}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Avg per Booking
                      </CardTitle>
                      <TrendingUp className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {loading
                          ? "..."
                          : stats.totalBookings > 0
                            ? `Rp ${Math.round(stats.totalRevenue / stats.totalBookings).toLocaleString("id-ID")}`
                            : "Rp 0"}
                      </div>
                      <p className="text-xs text-orange-100">
                        Rata-rata per booking
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Service Stats Cards */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">
                    Laporan per Layanan
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-sky-50 to-blue-50 border-sky-200"
                      onClick={() => navigate("/sub-account/tiket-pesawat")}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-sky-700">
                            Tiket Pesawat
                          </CardTitle>
                          <CardDescription className="text-sky-600">
                            Penjualan tiket penerbangan
                          </CardDescription>
                        </div>
                        <Plane className="h-8 w-8 text-sky-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : stats.serviceStats.tiket_pesawat.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.tiket_pesawat.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200"
                      onClick={() => navigate("/sub-account/hotel")}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-emerald-700">
                            Hotel
                          </CardTitle>
                          <CardDescription className="text-emerald-600">
                            Pemesanan hotel
                          </CardDescription>
                        </div>
                        <Hotel className="h-8 w-8 text-emerald-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading ? "..." : stats.serviceStats.hotel.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.hotel.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200"
                      onClick={() =>
                        navigate("/sub-account/passenger-handling")
                      }
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-purple-700">
                            Passenger Handling
                          </CardTitle>
                          <CardDescription className="text-purple-600">
                            Layanan penanganan penumpang
                          </CardDescription>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : stats.serviceStats.passenger_handling.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.passenger_handling.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                      onClick={() => navigate("/sub-account/travel")}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-amber-700">
                            Travel
                          </CardTitle>
                          <CardDescription className="text-amber-600">
                            Paket perjalanan wisata
                          </CardDescription>
                        </div>
                        <Briefcase className="h-8 w-8 text-amber-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : stats.serviceStats.travel.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.travel.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"
                      onClick={() => navigate("/sub-account/airport-transfer")}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-orange-700">
                            Airport Transfer
                          </CardTitle>
                          <CardDescription className="text-orange-600">
                            Layanan antar-jemput bandara
                          </CardDescription>
                        </div>
                        <Bus className="h-8 w-8 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : stats.serviceStats.airport_transfer.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.airport_transfer.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                      onClick={() => navigate("/sub-account/rental-car")}
                    >
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div>
                          <CardTitle className="text-lg font-semibold text-red-700">
                            Rental Car
                          </CardTitle>
                          <CardDescription className="text-red-600">
                            Layanan sewa mobil
                          </CardDescription>
                        </div>
                        <Car className="h-8 w-8 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Total Booking:
                            </span>
                            <span className="font-semibold">
                              {loading
                                ? "..."
                                : stats.serviceStats.rental_car.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              Revenue:
                            </span>
                            <span className="font-semibold text-green-600">
                              {loading
                                ? "..."
                                : `Rp ${stats.serviceStats.rental_car.revenue.toLocaleString("id-ID")}`}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h2 className="text-2xl font-bold mb-6">Aksi Cepat</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Button
                      onClick={() => navigate("/sub-account")}
                      className="h-16 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-semibold">Sub Akun COA</div>
                        <div className="text-sm text-muted-foreground">
                          Kelola layanan
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/journal")}
                      className="h-16 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-semibold">Jurnal</div>
                        <div className="text-sm text-muted-foreground">
                          Buat entri jurnal
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/reports")}
                      className="h-16 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-semibold">Laporan</div>
                        <div className="text-sm text-muted-foreground">
                          Lihat laporan keuangan
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/balance-sheet")}
                      className="h-16 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-semibold">Neraca</div>
                        <div className="text-sm text-muted-foreground">
                          Lihat neraca
                        </div>
                      </div>
                    </Button>
                    <Button
                      onClick={() => navigate("/transaction-reports")}
                      className="h-16 text-left justify-start"
                      variant="outline"
                    >
                      <div>
                        <div className="font-semibold">Laporan Transaksi</div>
                        <div className="text-sm text-muted-foreground">
                          Lihat semua transaksi
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>
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
                  <h2 className="text-xl font-semibold mb-4">
                    Laporan Keuangan
                  </h2>
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

        {/* Users List Panel */}
        {showUsersList && (
          <UsersListPanel onClose={() => setShowUsersList(false)} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
