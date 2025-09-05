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
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Filter, Search, Eye, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";

interface TopupRequest {
  id: string;
  topup_code: string;
  user_id: string;
  driver_id: string;
  user_full_name: string;
  user_email: string;
  amount: number;
  method: string;
  bank_name: string | null;
  status: string;
  approved_by: string | null;
  approver_id: string | null;
  verifier_full_name: string | null;
  verifier_email: string | null;
  decision_at: string | null;
  note: string | null;
  created_at: string;
}

interface DriverStats {
  approved_count: number;
  total_amount: number;
  last_approved: string | null;
}

interface ApproverStats {
  approvals_count: number;
  unique_drivers: number;
}

const DriverTopupsPage = () => {
  const { userProfile } = useUserRole();
  const navigate = useNavigate();
  const [topups, setTopups] = useState<TopupRequest[]>([]);
  const [filteredTopups, setFilteredTopups] = useState<TopupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopup, setSelectedTopup] = useState<TopupRequest | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStats | null>(null);
  const [approverStats, setApproverStats] = useState<ApproverStats | null>(
    null,
  );
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
    status: "all",
  });

  const statusOptions = ["pending", "approved", "rejected"];

  useEffect(() => {
    fetchTopups();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [topups, filters]);

  const fetchTopups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("v_topup_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching topups:", error);
        return;
      }

      setTopups(data || []);
    } catch (error) {
      console.error("Error fetching topups:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...topups];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (topup) =>
          topup.topup_code?.toLowerCase().includes(searchLower) ||
          topup.user_full_name?.toLowerCase().includes(searchLower) ||
          topup.user_email?.toLowerCase().includes(searchLower) ||
          topup.verifier_full_name?.toLowerCase().includes(searchLower),
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(
        (topup) => new Date(topup.created_at) >= new Date(filters.dateFrom),
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (topup) =>
          new Date(topup.created_at) <= new Date(filters.dateTo + "T23:59:59"),
      );
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status === "approved") {
        // Include both 'approved' and 'verified' statuses for APPROVED filter
        filtered = filtered.filter(
          (topup) =>
            topup.status.toLowerCase() === "approved" ||
            topup.status.toLowerCase() === "verified",
        );
      } else {
        filtered = filtered.filter((topup) => topup.status === filters.status);
      }
    }

    setFilteredTopups(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      dateFrom: "",
      dateTo: "",
      status: "all",
    });
  };

  const fetchStats = async (topup: TopupRequest) => {
    try {
      setStatsLoading(true);
      setDriverStats(null);
      setApproverStats(null);

      // Fetch driver stats
      const { data: driverData, error: driverError } = await supabase.rpc(
        "get_driver_topup_stats",
        { p_driver_id: topup.user_id },
      );

      if (driverError) {
        console.error("Error fetching driver stats:", driverError);
      } else {
        setDriverStats(driverData);
      }

      // Fetch approver stats if there's an approver
      if (topup.approver_id) {
        const { data: approverData, error: approverError } = await supabase.rpc(
          "get_approver_topup_stats",
          { p_approver_id: topup.approver_id },
        );

        if (approverError) {
          console.error("Error fetching approver stats:", approverError);
        } else {
          setApproverStats(approverData);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleDetailsClick = (topup: TopupRequest) => {
    setSelectedTopup(topup);
    fetchStats(topup);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "approved" || statusLower === "verified") {
      return (
        <Badge className="bg-green-500 text-white hover:bg-green-600">
          APPROVED
        </Badge>
      );
    } else if (statusLower === "rejected") {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          REJECTED
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          PENDING
        </Badge>
      );
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTopups.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTopups = filteredTopups.slice(startIndex, endIndex);

  return (
    <div className="container py-8 max-w-7xl bg-background">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">History Topup Driver</h1>
        </div>
        <div className="flex items-center gap-2">
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

      {/* User Info */}
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
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-card p-6 rounded-lg border shadow-sm mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Filter Topup</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="search">Pencarian</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Cari kode, nama, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

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
        </div>

        <Button onClick={clearFilters} variant="outline">
          Reset Filter
        </Button>
      </div>

      {/* Summary */}
      <div className="bg-card p-4 rounded-lg border shadow-sm mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Total Topup Requests
        </h3>
        <p className="text-2xl font-bold">{filteredTopups.length}</p>
      </div>

      {/* Topup Table */}
      <div className="bg-card rounded-lg border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Daftar Topup Driver</h2>
          <p className="text-sm text-muted-foreground">
            Menampilkan {currentTopups.length} dari {filteredTopups.length}{" "}
            topup requests
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <p>Memuat data topup...</p>
          </div>
        ) : filteredTopups.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              Tidak ada topup request yang ditemukan
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTopups.map((topup) => (
                  <TableRow key={topup.id}>
                    <TableCell className="font-medium">
                      {topup.topup_code || "-"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {topup.user_full_name || "-"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {topup.user_email || "-"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(topup.amount)}
                    </TableCell>
                    <TableCell>{topup.method || "-"}</TableCell>
                    <TableCell>{getStatusBadge(topup.status)}</TableCell>
                    <TableCell>
                      {topup.verifier_full_name ? (
                        <div>
                          <p className="font-medium">
                            {topup.verifier_full_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {topup.verifier_email}
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(topup.created_at), "dd/MM/yyyy HH:mm", {
                        locale: id,
                      })}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDetailsClick(topup)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detail Topup Request</DialogTitle>
                          </DialogHeader>
                          {selectedTopup && (
                            <div className="space-y-6">
                              {/* Topup Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Informasi Topup
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <strong>Kode:</strong>{" "}
                                      {selectedTopup.topup_code}
                                    </p>
                                    <p>
                                      <strong>Amount:</strong>{" "}
                                      {formatCurrency(selectedTopup.amount)}
                                    </p>
                                    <p>
                                      <strong>Method:</strong>{" "}
                                      {selectedTopup.method}
                                    </p>
                                    <p>
                                      <strong>Status:</strong>{" "}
                                      {getStatusBadge(selectedTopup.status)}
                                    </p>
                                    <p>
                                      <strong>Note:</strong>{" "}
                                      {selectedTopup.note || "-"}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">
                                    Driver Info
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <p>
                                      <strong>Nama:</strong>{" "}
                                      {selectedTopup.user_full_name}
                                    </p>
                                    <p>
                                      <strong>Email:</strong>{" "}
                                      {selectedTopup.user_email}
                                    </p>
                                  </div>
                                  {selectedTopup.verifier_full_name && (
                                    <div className="mt-4">
                                      <h4 className="font-semibold mb-2">
                                        Approver Info
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <p>
                                          <strong>Nama:</strong>{" "}
                                          {selectedTopup.verifier_full_name}
                                        </p>
                                        <p>
                                          <strong>Email:</strong>{" "}
                                          {selectedTopup.verifier_email}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Statistics */}
                              {statsLoading ? (
                                <div className="text-center py-4">
                                  <p>Loading statistics...</p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Driver Stats */}
                                  {driverStats && (
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                      <h4 className="font-semibold mb-2 text-blue-800">
                                        Driver Statistics
                                      </h4>
                                      <div className="space-y-1 text-sm text-blue-700">
                                        <p>
                                          <strong>Approved Count:</strong>{" "}
                                          {driverStats.approved_count}
                                        </p>
                                        <p>
                                          <strong>Total Amount:</strong>{" "}
                                          {formatCurrency(
                                            driverStats.total_amount,
                                          )}
                                        </p>
                                        <p>
                                          <strong>Last Approved:</strong>{" "}
                                          {driverStats.last_approved
                                            ? format(
                                                new Date(
                                                  driverStats.last_approved,
                                                ),
                                                "dd/MM/yyyy",
                                                { locale: id },
                                              )
                                            : "-"}
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Approver Stats */}
                                  {approverStats && (
                                    <div className="bg-green-50 p-4 rounded-lg">
                                      <h4 className="font-semibold mb-2 text-green-800">
                                        Approver Statistics
                                      </h4>
                                      <div className="space-y-1 text-sm text-green-700">
                                        <p>
                                          <strong>Total Approvals:</strong>{" "}
                                          {approverStats.approvals_count}
                                        </p>
                                        <p>
                                          <strong>Unique Drivers:</strong>{" "}
                                          {approverStats.unique_drivers}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverTopupsPage;
