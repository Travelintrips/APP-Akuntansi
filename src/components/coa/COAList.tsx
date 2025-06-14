import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search } from "lucide-react";
import supabase from "@/lib/supabase";

export interface ChartOfAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  description?: string;
  is_header: boolean;
  parent_id?: string;
  balance_total: number;
  total_debit?: number;
  total_credit?: number;
}

export default function COAList() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchAccounts();

    // Set up realtime subscription
    const channel = supabase
      .channel("coa_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chart_of_accounts" },
        () => {
          console.log("COA changed, refreshing data...");
          fetchAccounts();
        },
      )
      .subscribe();

    // Clean up subscription when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");

      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      console.error("Error fetching chart of accounts:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil data akun");
    } finally {
      setLoading(false);
    }
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(
    (account) =>
      account.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Bagan Akun (Chart of Accounts)
          </h3>
          <p className="text-sm text-muted-foreground">
            Daftar semua akun yang tersedia dalam sistem.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari akun..."
              className="pl-8 w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchAccounts}
            disabled={loading}
          >
            <RefreshCw
              className={loading ? "animate-spin h-4 w-4" : "h-4 w-4"}
            />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Kode</TableHead>
              <TableHead>Nama Akun</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-muted-foreground"
                >
                  {searchTerm
                    ? "Tidak ada akun yang sesuai dengan pencarian"
                    : "Belum ada akun yang tersedia"}
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow
                  key={account.id}
                  className={account.is_header ? "bg-muted/50 font-medium" : ""}
                >
                  <TableCell>{account.account_code}</TableCell>
                  <TableCell>{account.account_name}</TableCell>
                  <TableCell>{account.account_type}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(account.balance_total || 0)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
