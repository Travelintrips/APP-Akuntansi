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
import {
  RefreshCw,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import supabase from "@/lib/supabase";

interface TrialBalanceAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
  net_balance: number;
}

interface BalanceSheetEntry {
  account_type: string;
  total_debit: number;
  total_credit: number;
  net_balance: number;
  account_count: number;
  accounts: TrialBalanceAccount[];
}

interface BalanceSheetData {
  assets: BalanceSheetEntry;
  liabilities: BalanceSheetEntry;
  equity: BalanceSheetEntry;
  total_assets: number;
  total_liabilities_equity: number;
  is_balanced: boolean;
}

const BalanceSheetDisplay = () => {
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0],
  );
  const [periodEnd, setPeriodEnd] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [expandedSections, setExpandedSections] = useState<{
    assets: boolean;
    liabilities: boolean;
    equity: boolean;
  }>({ assets: false, liabilities: false, equity: false });

  useEffect(() => {
    fetchBalanceSheet();
  }, [periodStart, periodEnd]);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, sync trial balance with general ledger to ensure latest data
      const { error: syncError } = await supabase.rpc(
        "sync_trial_balance_with_gl",
        {
          p_period_start: periodStart,
          p_period_end: periodEnd,
        },
      );

      if (syncError) {
        console.warn("Warning syncing trial balance:", syncError);
      }

      // Fetch trial balance data with chart of accounts information
      const { data: trialBalanceData, error: fetchError } = await supabase
        .from("trial_balance")
        .select(
          `
          id,
          account_code,
          account_name,
          debit_balance,
          credit_balance,
          net_balance,
          account_id,
          chart_of_accounts!inner(account_type)
        `,
        )
        .eq("period_start", periodStart)
        .eq("period_end", periodEnd)
        .order("account_code");

      if (fetchError) {
        console.error("Error fetching trial balance:", fetchError);
        setError("Gagal mengambil data neraca");
        return;
      }

      if (!trialBalanceData || trialBalanceData.length === 0) {
        // Try to get data from chart_of_accounts if trial_balance is empty
        await fetchFromChartOfAccounts();
        return;
      }

      // Group data by account type and collect individual accounts
      const groupedData = trialBalanceData.reduce(
        (acc, entry) => {
          const accountType = entry.chart_of_accounts?.account_type;
          if (!accountType) return acc;

          const debitBalance = entry.debit_balance || 0;
          const creditBalance = entry.credit_balance || 0;
          const netBalance = entry.net_balance || 0;

          const accountData: TrialBalanceAccount = {
            id: entry.id,
            account_code: entry.account_code,
            account_name: entry.account_name || "",
            account_type: accountType,
            debit_balance: debitBalance,
            credit_balance: creditBalance,
            net_balance: netBalance,
          };

          if (accountType === "Aset" || accountType === "Asset") {
            acc.assets.total_debit += debitBalance;
            acc.assets.total_credit += creditBalance;
            acc.assets.net_balance += netBalance;
            acc.assets.account_count += 1;
            acc.assets.accounts.push(accountData);
          } else if (
            accountType === "Kewajiban" ||
            accountType === "Liability"
          ) {
            acc.liabilities.total_debit += debitBalance;
            acc.liabilities.total_credit += creditBalance;
            acc.liabilities.net_balance += Math.abs(netBalance); // Liabilities are positive
            acc.liabilities.account_count += 1;
            acc.liabilities.accounts.push(accountData);
          } else if (accountType === "Ekuitas" || accountType === "Equity") {
            acc.equity.total_debit += debitBalance;
            acc.equity.total_credit += creditBalance;
            acc.equity.net_balance += Math.abs(netBalance); // Equity is positive
            acc.equity.account_count += 1;
            acc.equity.accounts.push(accountData);
          }

          return acc;
        },
        {
          assets: {
            account_type: "Aset",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
          liabilities: {
            account_type: "Kewajiban",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
          equity: {
            account_type: "Ekuitas",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
        },
      );

      const totalAssets = groupedData.assets.net_balance;
      const totalLiabilitiesEquity =
        groupedData.liabilities.net_balance + groupedData.equity.net_balance;
      const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

      setBalanceSheet({
        ...groupedData,
        total_assets: totalAssets,
        total_liabilities_equity: totalLiabilitiesEquity,
        is_balanced: isBalanced,
      });

      setLastUpdated(new Date().toLocaleString("id-ID"));
    } catch (err: any) {
      console.error("Exception fetching balance sheet:", err);
      setError("Terjadi kesalahan saat mengambil data neraca");
    } finally {
      setLoading(false);
    }
  };

  const fetchFromChartOfAccounts = async () => {
    try {
      const { data: coaData, error: coaError } = await supabase
        .from("chart_of_accounts")
        .select("account_type, current_balance")
        .not("current_balance", "is", null)
        .order("account_code");

      if (coaError) {
        console.error("Error fetching from chart of accounts:", coaError);
        setError("Gagal mengambil data dari bagan akun");
        return;
      }

      const groupedData = coaData?.reduce(
        (acc, account) => {
          const balance = Math.abs(account.current_balance || 0);

          const accountData: TrialBalanceAccount = {
            id: account.id || "",
            account_code: account.account_code,
            account_name: account.account_name,
            account_type: account.account_type,
            debit_balance: 0,
            credit_balance: 0,
            net_balance: balance,
          };

          if (
            account.account_type === "Aset" ||
            account.account_type === "Asset"
          ) {
            acc.assets.net_balance += balance;
            acc.assets.account_count += 1;
            acc.assets.accounts.push(accountData);
          } else if (
            account.account_type === "Kewajiban" ||
            account.account_type === "Liability"
          ) {
            acc.liabilities.net_balance += balance;
            acc.liabilities.account_count += 1;
            acc.liabilities.accounts.push(accountData);
          } else if (
            account.account_type === "Ekuitas" ||
            account.account_type === "Equity"
          ) {
            acc.equity.net_balance += balance;
            acc.equity.account_count += 1;
            acc.equity.accounts.push(accountData);
          }

          return acc;
        },
        {
          assets: {
            account_type: "Aset",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
          liabilities: {
            account_type: "Kewajiban",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
          equity: {
            account_type: "Ekuitas",
            total_debit: 0,
            total_credit: 0,
            net_balance: 0,
            account_count: 0,
            accounts: [] as TrialBalanceAccount[],
          },
        },
      ) || {
        assets: {
          account_type: "Aset",
          total_debit: 0,
          total_credit: 0,
          net_balance: 0,
          account_count: 0,
          accounts: [] as TrialBalanceAccount[],
        },
        liabilities: {
          account_type: "Kewajiban",
          total_debit: 0,
          total_credit: 0,
          net_balance: 0,
          account_count: 0,
          accounts: [] as TrialBalanceAccount[],
        },
        equity: {
          account_type: "Ekuitas",
          total_debit: 0,
          total_credit: 0,
          net_balance: 0,
          account_count: 0,
          accounts: [] as TrialBalanceAccount[],
        },
      };

      const totalAssets = groupedData.assets.net_balance;
      const totalLiabilitiesEquity =
        groupedData.liabilities.net_balance + groupedData.equity.net_balance;
      const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

      setBalanceSheet({
        ...groupedData,
        total_assets: totalAssets,
        total_liabilities_equity: totalLiabilitiesEquity,
        is_balanced: isBalanced,
      });

      setLastUpdated(new Date().toLocaleString("id-ID"));
    } catch (err: any) {
      console.error("Error in fetchFromChartOfAccounts:", err);
      setError("Gagal mengambil data cadangan");
    }
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

  const toggleSection = (section: "assets" | "liabilities" | "equity") => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderAccountRows = (
    accounts: TrialBalanceAccount[],
    sectionType: string,
  ) => {
    return accounts.map((account) => (
      <TableRow key={account.id} className="bg-gray-25 text-sm">
        <TableCell className="pl-8 text-gray-600">
          {account.account_code} - {account.account_name}
        </TableCell>
        <TableCell className="text-right text-gray-600">1</TableCell>
        <TableCell className="text-right font-mono text-gray-600">
          {formatCurrency(account.debit_balance)}
        </TableCell>
        <TableCell className="text-right font-mono text-gray-600">
          {formatCurrency(account.credit_balance)}
        </TableCell>
        <TableCell className="text-right font-mono text-gray-600">
          {formatCurrency(Math.abs(account.net_balance))}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-6 bg-white" data-testid="balance-sheet">
      <Card className="bg-white border border-gray-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Neraca (Balance Sheet)
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
                onClick={fetchBalanceSheet}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                title="Sinkronisasi data terbaru dari trial balance"
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

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Memuat data neraca...</span>
            </div>
          ) : !balanceSheet ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Tidak ada data neraca untuk periode ini</p>
              <p className="text-sm mt-2">
                Silakan pilih periode yang berbeda atau pastikan ada transaksi
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Balance Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-700">
                    Total Aset
                  </div>
                  <div className="text-xl font-bold text-green-800">
                    {formatCurrency(balanceSheet.total_assets)}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-700">
                    Total Kewajiban + Ekuitas
                  </div>
                  <div className="text-xl font-bold text-blue-800">
                    {formatCurrency(balanceSheet.total_liabilities_equity)}
                  </div>
                </div>
                <div
                  className={`${balanceSheet.is_balanced ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"} border rounded-lg p-4`}
                >
                  <div
                    className={`text-sm font-medium ${balanceSheet.is_balanced ? "text-green-700" : "text-red-700"}`}
                  >
                    Status Neraca
                  </div>
                  <div
                    className={`text-xl font-bold ${balanceSheet.is_balanced ? "text-green-800" : "text-red-800"}`}
                  >
                    {balanceSheet.is_balanced ? "Seimbang" : "Tidak Seimbang"}
                  </div>
                </div>
              </div>

              {/* Balance Sheet Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold text-gray-700">
                        Jenis Akun
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Jumlah Akun
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Total Debit
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Total Kredit
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Saldo Bersih
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Assets */}
                    <TableRow
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleSection("assets")}
                    >
                      <TableCell className="font-semibold text-green-700">
                        <div className="flex items-center gap-2">
                          {expandedSections.assets ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          ASET
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {balanceSheet.assets.account_count}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.assets.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.assets.total_credit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-green-600">
                        {formatCurrency(balanceSheet.assets.net_balance)}
                      </TableCell>
                    </TableRow>
                    {expandedSections.assets &&
                      renderAccountRows(balanceSheet.assets.accounts, "assets")}

                    {/* Liabilities */}
                    <TableRow
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleSection("liabilities")}
                    >
                      <TableCell className="font-semibold text-red-700">
                        <div className="flex items-center gap-2">
                          {expandedSections.liabilities ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          KEWAJIBAN
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {balanceSheet.liabilities.account_count}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.liabilities.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.liabilities.total_credit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-red-600">
                        {formatCurrency(balanceSheet.liabilities.net_balance)}
                      </TableCell>
                    </TableRow>
                    {expandedSections.liabilities &&
                      renderAccountRows(
                        balanceSheet.liabilities.accounts,
                        "liabilities",
                      )}

                    {/* Equity */}
                    <TableRow
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleSection("equity")}
                    >
                      <TableCell className="font-semibold text-blue-700">
                        <div className="flex items-center gap-2">
                          {expandedSections.equity ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          EKUITAS
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {balanceSheet.equity.account_count}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.equity.total_debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(balanceSheet.equity.total_credit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-blue-600">
                        {formatCurrency(balanceSheet.equity.net_balance)}
                      </TableCell>
                    </TableRow>
                    {expandedSections.equity &&
                      renderAccountRows(balanceSheet.equity.accounts, "equity")}

                    {/* Total Row */}
                    <TableRow className="bg-gray-100 border-t-2 border-gray-300">
                      <TableCell className="font-bold text-gray-800">
                        TOTAL
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {balanceSheet.assets.account_count +
                          balanceSheet.liabilities.account_count +
                          balanceSheet.equity.account_count}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(
                          balanceSheet.assets.total_debit +
                            balanceSheet.liabilities.total_debit +
                            balanceSheet.equity.total_debit,
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(
                          balanceSheet.assets.total_credit +
                            balanceSheet.liabilities.total_credit +
                            balanceSheet.equity.total_credit,
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {formatCurrency(
                          balanceSheet.assets.net_balance +
                            balanceSheet.liabilities.net_balance +
                            balanceSheet.equity.net_balance,
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Balance Equation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Persamaan Neraca
                </h3>
                <div className="text-blue-700">
                  <div className="flex items-center justify-center text-lg">
                    <span className="font-semibold">
                      Aset = Kewajiban + Ekuitas
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-sm mt-2">
                    <span>
                      {formatCurrency(balanceSheet.total_assets)} ={" "}
                      {formatCurrency(balanceSheet.liabilities.net_balance)} +{" "}
                      {formatCurrency(balanceSheet.equity.net_balance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-sm mt-1">
                    <span>
                      {formatCurrency(balanceSheet.total_assets)} ={" "}
                      {formatCurrency(balanceSheet.total_liabilities_equity)}
                    </span>
                  </div>
                  {!balanceSheet.is_balanced && (
                    <div className="flex items-center justify-center text-sm mt-2 text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>
                        Selisih:{" "}
                        {formatCurrency(
                          Math.abs(
                            balanceSheet.total_assets -
                              balanceSheet.total_liabilities_equity,
                          ),
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BalanceSheetDisplay;
