import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { ArrowLeft, Filter, Download, Search, LogOut, Bug } from "lucide-react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";

interface TransactionData {
  id: string;
  kode_booking: string | null;
  service_type: string | null;
  service_name: string | null;
  nama_penumpang: string | null;
  no_telepon: string | null;
  tanggal: string | null;
  harga_jual: number | null;
  harga_basic: number | null;
  fee_sales: number | null;
  profit: number | null;
  payment_method: string | null;
  status: string | null;
  created_at: string;
  service_details: string | null;
  lokasi: string | null;
  tujuan: string | null;
  user_full_name: string | null;
}

const TransactionReports = () => {
  const { userProfile, loading: userLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    serviceType: searchParams.get("serviceType") || "all",
    paymentMethod: searchParams.get("paymentMethod") || "all",
    status: searchParams.get("status") || "all",
    searchTerm: searchParams.get("searchTerm") || "",
    passengerName: searchParams.get("passengerName") || "",
    userName: searchParams.get("userName") || "",
  });

  const serviceTypes = [
    { value: "tiket_pesawat", label: "Tiket Pesawat" },
    { value: "hotel", label: "Hotel" },
    { value: "passenger_handling", label: "Passenger Handling" },
    { value: "travel", label: "Travel" },
    { value: "airport_transfer", label: "Airport Transfer" },
    { value: "rental_car", label: "Rental Car" },
  ];

  const paymentMethods = [
    "Cash",
    "Transfer Bank",
    "Credit Card",
    "Debit Card",
    "E-Wallet",
    "QRIS",
  ];

  const statusOptions = ["pending", "confirmed", "completed", "cancelled"];

  useEffect(() => {
    if (userProfile) {
      fetchTransactions();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // If user is not loaded yet, return early
      if (!userProfile) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("bookings_trips_with_user")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is not admin, filter by user_id to show only their transactions
      if (userProfile.role !== "admin") {
        query = query.eq("user_id", userProfile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      // Transform the data to flatten the user information
      const transformedData = (data || []).map((transaction: any) => ({
        ...transaction,
        user_full_name:
          transaction.user_full_name || transaction.users?.full_name || null,
      }));

      setTransactions(transformedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (transaction) =>
          new Date(transaction.tanggal || transaction.created_at) >=
          new Date(filters.dateFrom),
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (transaction) =>
          new Date(transaction.tanggal || transaction.created_at) <=
          new Date(filters.dateTo + "T23:59:59"),
      );
    }

    // Service type filter
    if (filters.serviceType && filters.serviceType !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.service_type === filters.serviceType,
      );
    }

    // Payment method filter
    if (filters.paymentMethod && filters.paymentMethod !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.payment_method === filters.paymentMethod,
      );
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === filters.status,
      );
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (transaction) =>
          transaction.kode_booking?.toLowerCase().includes(searchLower) ||
          transaction.nama_penumpang?.toLowerCase().includes(searchLower) ||
          transaction.service_name?.toLowerCase().includes(searchLower) ||
          transaction.no_telepon?.toString().includes(filters.searchTerm),
      );
    }

    // Passenger name filter
    if (filters.passengerName) {
      const passengerNameLower = filters.passengerName.toLowerCase();
      filtered = filtered.filter((transaction) =>
        transaction.nama_penumpang?.toLowerCase().includes(passengerNameLower),
      );
    }

    // User name filter
    if (filters.userName) {
      const userNameLower = filters.userName.toLowerCase();
      filtered = filtered.filter((transaction) =>
        transaction.user_full_name?.toLowerCase().includes(userNameLower),
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: "",
      dateTo: "",
      serviceType: "all",
      paymentMethod: "all",
      status: "all",
      searchTerm: "",
      passengerName: "",
      userName: "",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Kode Booking",
      "Tanggal",
      "Jenis Layanan",
      "Nama Layanan",
      "Nama Penumpang",
      "No. Telepon",
      "Nama User",
      "Harga Jual",
      "Harga Basic",
      "Fee Sales",
      "Profit",
      "Metode Pembayaran",
      "Status",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map((transaction) =>
        [
          transaction.kode_booking || "",
          transaction.tanggal
            ? format(new Date(transaction.tanggal), "dd/MM/yyyy", {
                locale: id,
              })
            : format(new Date(transaction.created_at), "dd/MM/yyyy", {
                locale: id,
              }),
          serviceTypes.find((s) => s.value === transaction.service_type)
            ?.label ||
            transaction.service_type ||
            "",
          transaction.service_name || "",
          transaction.nama_penumpang || "",
          transaction.no_telepon || "",
          transaction.user_full_name || "",
          transaction.harga_jual || 0,
          transaction.harga_basic || 0,
          transaction.fee_sales || 0,
          transaction.profit || 0,
          transaction.payment_method || "",
          transaction.status || "",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `laporan-transaksi-${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getServiceTypeLabel = (serviceType: string | null) => {
    const service = serviceTypes.find((s) => s.value === serviceType);
    return service ? service.label : serviceType || "-";
  };

  const totalRevenue = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.harga_jual || 0),
    0,
  );

  const totalProfit = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.profit || 0),
    0,
  );

  const totalHargaBasic = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.harga_basic || 0),
    0,
  );

  const totalFeeSales = filteredTransactions.reduce(
    (sum, transaction) => sum + (transaction.fee_sales || 0),
    0,
  );

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="container py-8 max-w-7xl bg-background">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sub-account">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Laporan Transaksi</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          {userProfile?.role === "admin" && (
            <Button variant="outline" asChild>
              <Link to="/debug-roles" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Debug
              </Link>
            </Button>
          )}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* User Info and Access Level */}
      {userProfile && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            Info User Saat Ini:
          </h3>
          <div className="text-sm text-blue-700">
            <p>
              <strong>Email:</strong> {userProfile.email}
            </p>
            <p>
              <strong>Nama:</strong> {userProfile.full_name}
            </p>
            <p>
              <strong>Role:</strong> {userProfile.role}
            </p>
            <p>
              <strong>Akses Data:</strong>{" "}
              {userProfile.role === "admin"
                ? "Semua transaksi"
                : "Hanya transaksi Anda"}
            </p>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-card p-6 rounded-lg border shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Filter Transaksi</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom">Tanggal Dari</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateTo">Tanggal Sampai</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceType">Jenis Layanan</Label>
            <Select
              value={filters.serviceType}
              onValueChange={(value) =>
                handleFilterChange("serviceType", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua layanan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua layanan</SelectItem>
                {serviceTypes.map((service) => (
                  <SelectItem key={service.value} value={service.value}>
                    {service.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) =>
                handleFilterChange("paymentMethod", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua metode</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="searchTerm">Pencarian Umum</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchTerm"
                placeholder="Cari kode booking, nama, telepon..."
                value={filters.searchTerm}
                onChange={(e) =>
                  handleFilterChange("searchTerm", e.target.value)
                }
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passengerName">Nama Penumpang</Label>
            <Input
              id="passengerName"
              placeholder="Cari nama penumpang..."
              value={filters.passengerName}
              onChange={(e) =>
                handleFilterChange("passengerName", e.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">Nama User</Label>
            <Input
              id="userName"
              placeholder="Cari nama user..."
              value={filters.userName}
              onChange={(e) => handleFilterChange("userName", e.target.value)}
            />
          </div>
        </div>

        <Button onClick={clearFilters} variant="outline">
          Reset Filter
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Transaksi
          </h3>
          <p className="text-2xl font-bold">{filteredTransactions.length}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </h3>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">
            Total Profit
          </h3>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalProfit)}
          </p>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Daftar Transaksi</h2>
          <p className="text-sm text-muted-foreground">
            Menampilkan {filteredTransactions.length} dari {transactions.length}{" "}
            transaksi{" "}
            {userProfile?.role !== "admin"
              ? "(hanya transaksi Anda)"
              : "(semua transaksi)"}
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p>Memuat data transaksi...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Tidak ada transaksi yang ditemukan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Booking</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jenis Layanan</TableHead>
                  <TableHead>Nama Layanan</TableHead>
                  <TableHead>Nama Penumpang</TableHead>
                  <TableHead>No. Telepon</TableHead>
                  <TableHead>Nama User</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Harga Basic</TableHead>
                  <TableHead className="text-right">Fee Sales</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Metode Pembayaran</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-medium">
                      {transaction.kode_booking || "-"}
                    </TableCell>
                    <TableCell>
                      {transaction.tanggal
                        ? format(new Date(transaction.tanggal), "dd/MM/yyyy", {
                            locale: id,
                          })
                        : format(
                            new Date(transaction.created_at),
                            "dd/MM/yyyy",
                            { locale: id },
                          )}
                    </TableCell>
                    <TableCell>
                      {getServiceTypeLabel(transaction.service_type)}
                    </TableCell>
                    <TableCell>{transaction.service_name || "-"}</TableCell>
                    <TableCell>{transaction.nama_penumpang || "-"}</TableCell>
                    <TableCell>{transaction.no_telepon || "-"}</TableCell>
                    <TableCell>{transaction.user_full_name || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.harga_jual)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.harga_basic)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-blue-600">
                      {formatCurrency(transaction.fee_sales)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(transaction.profit)}
                    </TableCell>
                    <TableCell>{transaction.payment_method || "-"}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : transaction.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : transaction.status === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {transaction.status || "pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={7} className="text-right">
                    Total:
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(totalHargaBasic)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    {formatCurrency(totalFeeSales)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600">
                    {formatCurrency(totalProfit)}
                  </TableCell>
                  <TableCell colSpan={2}></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionReports;
