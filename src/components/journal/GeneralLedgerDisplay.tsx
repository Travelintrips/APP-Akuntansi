import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ChartOfAccount } from "@/components/coa/COAList";
import supabase from "@/lib/supabase";

interface GeneralLedgerEntry {
  id: string;
  account_id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  created_at: string;
}

export default function GeneralLedgerDisplay() {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [ledgerEntries, setLedgerEntries] = useState<GeneralLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from("chart_of_accounts")
          .select("*")
          .order("account_code");

        if (error) throw error;
        setAccounts(data || []);

        // If accounts are loaded and none is selected yet, select the first non-header account
        if (data && data.length > 0 && !selectedAccountId) {
          const firstNonHeaderAccount = data.find((acc) => !acc.is_header);
          if (firstNonHeaderAccount) {
            setSelectedAccountId(firstNonHeaderAccount.id);
          }
        }
      } catch (err: any) {
        console.error("Error fetching accounts:", err);
        setError("Gagal memuat daftar akun");
      }
    };

    fetchAccounts();
  }, []);

  // Fetch ledger entries when account is selected
  useEffect(() => {
    if (!selectedAccountId) return;
    fetchLedgerEntries(selectedAccountId);
  }, [selectedAccountId]);

  // Get the selected account details
  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const refreshData = () => {
    if (selectedAccountId) {
      setIsLoading(true);
      setError(null);
      fetchLedgerEntries(selectedAccountId);
    }
  };

  const fetchLedgerEntries = async (accountId: string) => {
    try {
      const { data, error } = await supabase
        .from("general_ledger")
        .select("*")
        .eq("account_id", accountId)
        .order("date", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLedgerEntries(data || []);
    } catch (err: any) {
      console.error("Error fetching ledger entries:", err);
      setError("Gagal memuat data buku besar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Buku Besar</h3>
          <p className="text-sm text-muted-foreground">
            Lihat transaksi dan saldo untuk setiap akun
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshData}
          disabled={isLoading || !selectedAccountId}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="max-w-xs">
          <label className="text-sm font-medium mb-2 block">Pilih Akun</label>
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih akun" />
            </SelectTrigger>
            <SelectContent>
              {accounts
                .filter((account) => !account.is_header)
                .map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_code} - {account.account_name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAccount && (
          <div className="rounded-md border overflow-hidden">
            <div className="bg-muted/50 p-3">
              <h4 className="font-medium">
                {selectedAccount.account_code} - {selectedAccount.account_name}
              </h4>
              <p className="text-sm text-muted-foreground">
                Tipe: {selectedAccount.account_type}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-6 text-muted-foreground"
                    >
                      Belum ada transaksi untuk akun ini
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {entry.manual_entry ? "🖊️ " : ""}
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(entry.balance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
