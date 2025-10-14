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
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  closing_balance: number;
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

      // Fetch trial balance data from trial_balance_view with specific columns
      const { data: trialBalanceData, error: fetchError } = await supabase
        .from("trial_balance_view")
        .select("account_code, account_name, debit, credit, closing_balance")
        .order("account_code", { ascending: true });

      if (fetchError) {
        console.error("Error fetching trial balance:", fetchError);
        setError("Gagal mengambil data neraca saldo");
        return;
      }

      if (!trialBalanceData || trialBalanceData.length === 0) {
        setTrialBalance([]);
        setSummary({
          total_debit: 0,
          total_credit: 0,
          is_balanced: true,
          record_count: 0,
          gl_total_debit: 0,
          gl_total_credit: 0,
        });
        return;
      }

      // Transform data and convert to numbers
      const transformedData: TrialBalanceEntry[] = trialBalanceData.map((entry) => ({
        account_code: entry.account_code,
        account_name: entry.account_name,
        debit: Number(entry.debit) || 0,
        credit: Number(entry.credit) || 0,
        closing_balance: Number(entry.closing_balance) || 0,
      }));

      setTrialBalance(transformedData);

      // Calculate totals
      const totalDebit = transformedData.reduce((sum, row) => sum + Number(row.debit), 0);
      const totalCredit = transformedData.reduce((sum, row) => sum + Number(row.credit), 0);

      setSummary({
        total_debit: totalDebit,
        total_credit: totalCredit,
        is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
        record_count: transformedData.length,
        gl_total_debit: totalDebit,
        gl_total_credit: totalCredit,
      });

      setLastUpdated(new Date().toLocaleString("id-ID"));
    } catch (err: any) {
      console.error("Exception fetching trial balance:", err);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                      Kode Akun
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                      Nama Akun
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Debit
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Kredit
                    </th>
                    <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                      Saldo Akhir
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2 font-mono">
                        {row.account_code}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {row.account_name}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                        {formatCurrency(Number(row.debit))}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                        {formatCurrency(Number(row.credit))}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                        {formatCurrency(Number(row.closing_balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td className="border border-gray-300 px-4 py-2" colSpan={2}>
                      Total
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                      {formatCurrency(summary.total_debit)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                      {formatCurrency(summary.total_credit)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-mono">
                      {formatCurrency(summary.total_debit - summary.total_credit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrialBalanceDisplay;