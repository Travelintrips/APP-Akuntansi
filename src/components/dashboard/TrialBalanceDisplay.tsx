import React, { useState, useEffect, useCallback } from "react";
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
import { Calendar, RefreshCw, AlertCircle } from "lucide-react";
import supabase from "@/lib/supabase";

interface TrialBalanceEntry {
  id: string;
  account_code: string;
  account_name: string;
  debit_balance: number;
  credit_balance: number;
  net_balance: number;
}

interface TrialBalanceSummary {
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  record_count: number;
  gl_total_debit: number;
  gl_total_credit: number;
}

const TrialBalanceDisplay = () => {
  const [trialBalance, setTrialBalance] = useState<TrialBalanceEntry[]>([]);
  const [summary, setSummary] = useState<TrialBalanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  useEffect(() => {
    fetchTrialBalance();
  }, [periodStart, periodEnd]);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calculate Trial Balance from ledger_summaries
      await calculateTrialBalanceFromLedgerSummaries();

      // Fetch the most recent trial balance data with explicit ordering
      const { data: trialBalanceData, error: fetchError } = await supabase
        .from("trial_balance")
        .select("*")
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .order("updated_at", { ascending: false })
        .order("account_code", { ascending: true });

      if (fetchError) {
        console.error("Error fetching trial balance:", fetchError);
        // If trial balance table is empty, try to get data from chart_of_accounts
        await fetchFromChartOfAccounts();
        return;
      }

      if (!trialBalanceData || trialBalanceData.length === 0) {
        // If no trial balance data, try to get from chart_of_accounts
        await fetchFromChartOfAccounts();
        return;
      }

      setTrialBalance(trialBalanceData || []);

      // Update last updated timestamp
      if (trialBalanceData && trialBalanceData.length > 0) {
        const latestUpdate = trialBalanceData.reduce((latest, entry) => {
          // Safely handle potentially null timestamp values
          const updatedAt = entry.updated_at
            ? new Date(entry.updated_at).getTime()
            : 0;
          const createdAt = entry.created_at
            ? new Date(entry.created_at).getTime()
            : 0;
          const entryTime = Math.max(updatedAt, createdAt, 0);
          return entryTime > latest ? entryTime : latest;
        }, 0);
        if (latestUpdate > 0) {
          setLastUpdated(new Date(latestUpdate).toLocaleString("id-ID"));
        }
      }

      // Calculate summary manually from the fetched data
      calculateSummaryManually(trialBalanceData);
    } catch (err: any) {
      console.error("Exception fetching trial balance:", err);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const fetchFromChartOfAccounts = async () => {
    try {
      // Fallback: Get data directly from chart_of_accounts
      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name, current_balance, account_type")
        .not("current_balance", "is", null)
        .order("account_code");

      if (coaError) {
        console.error("Error fetching from chart of accounts:", coaError);
        setError("Gagal mengambil data dari bagan akun");
        return;
      }

      // Transform COA data to trial balance format
      const transformedData: TrialBalanceEntry[] =
        coaData?.map((account) => {
          const balance = account.current_balance || 0;
          const isDebitAccount = ["Asset", "Expense"].includes(
            account.account_type,
          );

          return {
            id: account.id,
            account_code: account.account_code,
            account_name: account.account_name,
            debit_balance: isDebitAccount && balance > 0 ? balance : 0,
            credit_balance:
              !isDebitAccount && balance > 0 ? Math.abs(balance) : 0,
            net_balance: balance,
          };
        }) || [];

      setTrialBalance(transformedData);
      calculateSummaryManually(transformedData);
    } catch (err: any) {
      console.error("Error in fetchFromChartOfAccounts:", err);
      setError("Gagal mengambil data cadangan");
    }
  };

  const calculateTrialBalanceFromLedgerSummaries = async () => {
    try {
      // Get period string for ledger_summaries (format: YYYY-MM)
      const periodString = periodStart.substring(0, 7); // Extract YYYY-MM from YYYY-MM-DD

      // Fetch data from ledger_summaries for the selected period
      const { data: ledgerData, error: ledgerError } = await supabase
        .from("ledger_summaries")
        .select("*")
        .eq("period", periodString);

      if (ledgerError) {
        console.error("Error fetching ledger summaries:", ledgerError);
        return;
      }

      if (!ledgerData || ledgerData.length === 0) {
        console.warn("No ledger summaries found for period:", periodString);
        return;
      }

      // Get chart of accounts to map account_code to account_id
      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("id, account_code, account_name");

      if (coaError) {
        console.error("Error fetching chart of accounts:", coaError);
        return;
      }

      // Create a map for quick lookup
      const coaMap = new Map();
      coaData?.forEach((account) => {
        coaMap.set(account.account_code, account);
      });

      // Calculate trial balance entries
      const trialBalanceEntries = ledgerData
        .map((ledgerEntry) => {
          const openingBalance = ledgerEntry.opening_balance || 0;
          const totalDebit = ledgerEntry.total_debit || 0;
          const totalCredit = ledgerEntry.total_credit || 0;

          // Calculate closing balance: opening_balance + total_debit - total_credit
          const closingBalance = openingBalance + totalDebit - totalCredit;

          // Calculate debit_balance and credit_balance
          const debitBalance = Math.max(closingBalance, 0);
          const creditBalance = Math.max(-closingBalance, 0);

          // Get account info from COA
          const accountInfo = coaMap.get(ledgerEntry.account_code);

          return {
            account_id: accountInfo?.id || null,
            period_start: periodStart,
            period_end: periodEnd,
            account_code: ledgerEntry.account_code,
            account_name:
              ledgerEntry.account_name ||
              accountInfo?.account_name ||
              "Unknown Account",
            opening_balance: openingBalance,
            period_debit: totalDebit,
            period_credit: totalCredit,
            closing_balance: closingBalance,
            debit_balance: debitBalance,
            credit_balance: creditBalance,
            balance: closingBalance,
            net_balance: closingBalance,
          };
        })
        .filter((entry) => entry.account_id); // Only include entries with valid account_id

      // UPSERT to trial_balance table
      if (trialBalanceEntries.length > 0) {
        // First, delete existing entries for this period
        const { error: deleteError } = await supabase
          .from("trial_balance")
          .delete()
          .eq("period_start", periodStart)
          .eq("period_end", periodEnd);

        if (deleteError) {
          console.error("Error deleting existing trial balance:", deleteError);
        }

        // Insert new entries
        const { error: insertError } = await supabase
          .from("trial_balance")
          .insert(trialBalanceEntries);

        if (insertError) {
          console.error("Error inserting trial balance:", insertError);
        } else {
          console.log(
            `Successfully upserted ${trialBalanceEntries.length} trial balance entries`,
          );
        }
      }
    } catch (err: any) {
      console.error(
        "Error calculating trial balance from ledger summaries:",
        err,
      );
    }
  };

  const calculateSummaryManually = (data: TrialBalanceEntry[]) => {
    const totalDebit = data.reduce(
      (sum, entry) => sum + (entry.debit_balance || 0),
      0,
    );
    const totalCredit = data.reduce(
      (sum, entry) => sum + (entry.credit_balance || 0),
      0,
    );

    setSummary({
      total_debit: totalDebit,
      total_credit: totalCredit,
      is_balanced: Math.abs(totalDebit - totalCredit) < 0.01, // Allow for small rounding differences
      record_count: data.length,
      gl_total_debit: totalDebit,
      gl_total_credit: totalCredit,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 bg-white" data-testid="trial-balance">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Neraca Saldo (Trial Balance)
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Periode: {formatDate(periodStart)} - {formatDate(periodEnd)}
              </p>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Terakhir diperbarui: {lastUpdated}
                </p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <Button
                onClick={fetchTrialBalance}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Sinkronisasi data terbaru dari buku besar"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {loading ? "Memuat..." : "Sinkronisasi"}
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

          {summary && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm font-medium text-green-700">
                  Total Debit
                </div>
                <div className="text-xl font-bold text-green-800">
                  {formatCurrency(summary.total_debit)}
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-700">
                  Total Kredit
                </div>
                <div className="text-xl font-bold text-blue-800">
                  {formatCurrency(summary.total_credit)}
                </div>
              </div>
              <div
                className={`${summary.is_balanced ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-4`}
              >
                <div
                  className={`text-sm font-medium ${summary.is_balanced ? "text-green-700" : "text-red-700"}`}
                >
                  Status Neraca
                </div>
                <div
                  className={`text-xl font-bold ${summary.is_balanced ? "text-green-800" : "text-red-800"}`}
                >
                  {summary.is_balanced ? "Seimbang" : "Tidak Seimbang"}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">
                Memuat data neraca saldo...
              </span>
            </div>
          ) : trialBalance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Tidak ada data neraca saldo untuk periode ini</p>
              <p className="text-sm mt-2">
                Silakan pilih periode yang berbeda atau pastikan ada transaksi
              </p>
            </div>
          ) : (
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
                    <TableHead className="font-semibold text-gray-700 text-right">
                      Debit
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">
                      Kredit
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700 text-right">
                      Saldo Bersih
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialBalance.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm">
                        {entry.account_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {entry.account_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.debit_balance > 0
                          ? formatCurrency(entry.debit_balance)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {entry.credit_balance > 0
                          ? formatCurrency(entry.credit_balance)
                          : "-"}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono font-semibold ${
                          entry.net_balance > 0
                            ? "text-green-600"
                            : entry.net_balance < 0
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {formatCurrency(entry.net_balance)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialBalanceDisplay;
