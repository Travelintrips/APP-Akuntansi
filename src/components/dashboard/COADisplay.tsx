import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, AlertCircle, ListTree, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import supabase from "@/lib/supabase";

interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  description?: string;
  is_header: boolean;
  parent_id?: string;
  balance_total: number;
  current_balance: number;
  total_debit?: number;
  total_credit?: number;
}

interface COASummary {
  totalAccounts: number;
  assetAccounts: number;
  liabilityAccounts: number;
  equityAccounts: number;
  revenueAccounts: number;
  expenseAccounts: number;
  headerAccounts: number;
  totalBalance: number;
}

const COADisplay = () => {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<ChartOfAccount[]>(
    [],
  );
  const [summary, setSummary] = useState<COASummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  useEffect(() => {
    fetchCOAData();
  }, []);

  useEffect(() => {
    // Filter accounts based on search term
    const filtered = accounts.filter(
      (account) =>
        account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_type.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredAccounts(filtered);
  }, [accounts, searchTerm]);

  const fetchCOAData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: coaData, error: fetchError } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");

      if (fetchError) {
        console.error("Error fetching COA data:", fetchError);
        setError("Gagal mengambil data bagan akun");
        return;
      }

      if (coaData) {
        setAccounts(coaData);
        setFilteredAccounts(coaData);

        // Calculate summary
        const summary: COASummary = {
          totalAccounts: coaData.length,
          assetAccounts: coaData.filter((acc) => acc.account_type === "Asset")
            .length,
          liabilityAccounts: coaData.filter(
            (acc) => acc.account_type === "Liability",
          ).length,
          equityAccounts: coaData.filter((acc) => acc.account_type === "Equity")
            .length,
          revenueAccounts: coaData.filter(
            (acc) => acc.account_type === "Revenue",
          ).length,
          expenseAccounts: coaData.filter(
            (acc) => acc.account_type === "Expense",
          ).length,
          headerAccounts: coaData.filter((acc) => acc.is_header).length,
          totalBalance: coaData.reduce(
            (sum, acc) => sum + (acc.current_balance || 0),
            0,
          ),
        };

        setSummary(summary);
        setLastUpdated(new Date().toLocaleString("id-ID"));
      }
    } catch (err: any) {
      console.error("Exception fetching COA data:", err);
      setError("Terjadi kesalahan saat mengambil data bagan akun");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getAccountTypeColor = (accountType: string) => {
    switch (accountType) {
      case "Asset":
        return "bg-green-100 text-green-800";
      case "Liability":
        return "bg-red-100 text-red-800";
      case "Equity":
        return "bg-blue-100 text-blue-800";
      case "Revenue":
        return "bg-purple-100 text-purple-800";
      case "Expense":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayAccounts = showAllAccounts
    ? filteredAccounts
    : filteredAccounts.slice(0, 10);

  return (
    <div className="space-y-6 bg-white" data-testid="coa-display">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <ListTree className="h-6 w-6 text-blue-600" />
                Bagan Akun (Chart of Accounts)
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Data akun dari Supabase - Terhubung langsung dengan database
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Terakhir diperbarui: {lastUpdated}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={fetchCOAData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Refresh data bagan akun dari Supabase"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? "Memuat..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Summary Cards */}
          {summary && (
            <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700">
                  Total Akun
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {summary.totalAccounts}
                </div>
                <div className="text-xs text-blue-600">
                  {summary.headerAccounts} header akun
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700">Aset</div>
                <div className="text-2xl font-bold text-green-800">
                  {summary.assetAccounts}
                </div>
                <div className="text-xs text-green-600">Akun aset</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-700">
                  Kewajiban
                </div>
                <div className="text-2xl font-bold text-red-800">
                  {summary.liabilityAccounts}
                </div>
                <div className="text-xs text-red-600">Akun kewajiban</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm font-medium text-purple-700">
                  Pendapatan
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  {summary.revenueAccounts}
                </div>
                <div className="text-xs text-purple-600">Akun pendapatan</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari akun berdasarkan kode, nama, atau tipe..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                Memuat data bagan akun...
              </span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>
                {searchTerm
                  ? "Tidak ada akun yang sesuai dengan pencarian"
                  : "Tidak ada data bagan akun"}
              </p>
              <p className="text-sm mt-2">
                {searchTerm
                  ? "Coba kata kunci yang berbeda"
                  : "Silakan refresh data atau periksa koneksi database"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Accounts Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">
                        Kode Akun
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Nama Akun
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Tipe
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Saldo
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-center">
                        Status
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAccounts.map((account) => (
                      <TableRow
                        key={account.id}
                        className={`hover:bg-gray-50 ${account.is_header ? "bg-blue-50 font-medium" : ""}`}
                      >
                        <TableCell className="font-mono text-sm">
                          {account.account_code}
                        </TableCell>
                        <TableCell className="font-medium">
                          {account.is_header && "📁 "}
                          {account.account_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getAccountTypeColor(
                              account.account_type,
                            )}
                          >
                            {account.account_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {account.current_balance !== null &&
                          account.current_balance !== undefined
                            ? formatCurrency(account.current_balance)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {account.is_header ? (
                            <Badge variant="secondary">Header</Badge>
                          ) : (
                            <Badge variant="outline">Akun</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Show More/Less Button */}
              {filteredAccounts.length > 10 && (
                <div className="text-center">
                  <Button
                    onClick={() => setShowAllAccounts(!showAllAccounts)}
                    variant="outline"
                    className="mt-4"
                  >
                    {showAllAccounts
                      ? `Tampilkan Lebih Sedikit (10 dari ${filteredAccounts.length})`
                      : `Tampilkan Semua (${filteredAccounts.length} akun)`}
                  </Button>
                </div>
              )}

              {/* Results Info */}
              <div className="text-sm text-gray-600 text-center">
                {searchTerm ? (
                  <p>
                    Menampilkan {displayAccounts.length} dari{" "}
                    {filteredAccounts.length} akun yang sesuai dengan pencarian
                    "{searchTerm}"
                  </p>
                ) : (
                  <p>
                    Menampilkan {displayAccounts.length} dari {accounts.length}{" "}
                    total akun
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default COADisplay;
