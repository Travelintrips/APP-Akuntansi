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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import supabase from "@/lib/supabase";

interface BalanceSheetItem {
  account_type: string;
  account_code: string;
  account_name: string;
  balance: number;
}

interface ProfitLossSummary {
  period: string;
  total_income: number;
  total_expense: number;
  net: number;
}

interface TrialBalanceItem {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
  closing_balance: number;
  period: string;
}

export default function BalanceSheet() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<{
    assets: BalanceSheetItem[];
    liabilities: BalanceSheetItem[];
    equity: BalanceSheetItem[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  }>({
    assets: [],
    liabilities: [],
    equity: [],
    totalAssets: 0,
    totalLiabilities: 0,
    totalEquity: 0,
  });

  const [profitLossData, setProfitLossData] =
    useState<ProfitLossSummary | null>(null);
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceItem[]>(
    [],
  );

  useEffect(() => {
    if (date) {
      fetchBalanceSheetData();
    }
  }, [date]);

  const fetchBalanceSheetData = async () => {
    if (!date) return;

    setIsLoading(true);
    setError(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const period = format(date, "yyyy-MM");

      // Try to fetch from balance_sheet_view first, fallback to chart_of_accounts
      const { data: balanceSheetViewData, error: balanceSheetViewError } =
        await supabase
          .from("balance_sheet_view")
          .select("*")
          .eq("period", period);

      let assetsData, liabilitiesData, equityData;

      if (balanceSheetViewData && balanceSheetViewData.length > 0) {
        // Use data from balance_sheet_view
        console.log("Using balance_sheet_view data:", balanceSheetViewData);

        assetsData = balanceSheetViewData.filter(
          (item) => item.account_type === "Aset",
        );
        liabilitiesData = balanceSheetViewData.filter(
          (item) => item.account_type === "Kewajiban",
        );
        equityData = balanceSheetViewData.filter(
          (item) => item.account_type === "Modal",
        );
      } else {
        // Fallback to chart_of_accounts with balance_total
        console.log("Fallback to chart_of_accounts");

        const { data: assetsDataFallback, error: assetsError } = await supabase
          .from("chart_of_accounts")
          .select("account_type, account_code, account_name, balance_total")
          .eq("account_type", "Aset")
          .eq("is_header", false)
          .order("account_code");

        if (assetsError) {
          console.error("Assets error:", assetsError);
          throw assetsError;
        }

        const { data: liabilitiesDataFallback, error: liabilitiesError } =
          await supabase
            .from("chart_of_accounts")
            .select("account_type, account_code, account_name, balance_total")
            .eq("account_type", "Kewajiban")
            .eq("is_header", false)
            .order("account_code");

        if (liabilitiesError) {
          console.error("Liabilities error:", liabilitiesError);
          throw liabilitiesError;
        }

        const { data: equityDataFallback, error: equityError } = await supabase
          .from("chart_of_accounts")
          .select("account_type, account_code, account_name, balance_total")
          .eq("account_type", "Modal")
          .eq("is_header", false)
          .order("account_code");

        if (equityError) {
          console.error("Equity error:", equityError);
          throw equityError;
        }

        assetsData = assetsDataFallback;
        liabilitiesData = liabilitiesDataFallback;
        equityData = equityDataFallback;
      }

      // Fetch profit loss summary
      const { data: profitLossData, error: profitLossError } = await supabase
        .from("profit_loss_summary_view")
        .select("*")
        .eq("period", period)
        .single();

      if (profitLossError && profitLossError.code !== "PGRST116") {
        console.error("Profit Loss error:", profitLossError);
      }

      // Fetch trial balance from trial_balance_view
      const { data: trialBalanceData, error: trialBalanceError } =
        await supabase
          .from("trial_balance_view")
          .select("*")
          .eq("period_start", formattedDate)
          .eq("period_end", formattedDate)
          .order("account_code");

      if (trialBalanceError) {
        console.error("Trial Balance error:", trialBalanceError);
      }

      console.log("Raw data:", {
        assetsData,
        liabilitiesData,
        equityData,
        profitLossData,
        trialBalanceData,
      });

      // Calculate totals - handle both balance_sheet_view and chart_of_accounts data
      const assets = (assetsData || []).map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance:
          Number(item.balance || item.balance_total || item.current_balance) ||
          0,
      }));

      const liabilities = (liabilitiesData || []).map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance:
          Number(item.balance || item.balance_total || item.current_balance) ||
          0,
      }));

      const equity = (equityData || []).map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance:
          Number(item.balance || item.balance_total || item.current_balance) ||
          0,
      }));

      const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, item) => sum + item.balance,
        0,
      );
      const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

      console.log("Processed data:", {
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
      });

      setBalanceSheetData({
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
      });

      // Set profit loss data
      if (profitLossData) {
        setProfitLossData({
          period: profitLossData.period || period,
          total_income: Number(profitLossData.total_income) || 0,
          total_expense: Number(profitLossData.total_expense) || 0,
          net: Number(profitLossData.net) || 0,
        });
      } else {
        setProfitLossData(null);
      }

      // Set trial balance data
      const processedTrialBalance = (trialBalanceData || []).map((item) => ({
        account_code: item.account_code || "",
        account_name: item.account_name || "",
        debit: Number(item.debit) || 0,
        credit: Number(item.credit) || 0,
        closing_balance: Number(item.closing_balance) || 0,
        period: item.period || period,
      }));
      setTrialBalanceData(processedTrialBalance);
    } catch (err: any) {
      console.error("Error fetching balance sheet data:", err);
      setError(`Gagal memuat data neraca: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount === null || amount === undefined) {
      return "0,00";
    }
    return amount.toLocaleString("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const renderAccountSection = (
    title: string,
    items: BalanceSheetItem[],
    total: number,
  ) => {
    return (
      <>
        <TableRow className="bg-muted/50">
          <TableCell colSpan={3} className="font-bold">
            {title}
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(total)}
          </TableCell>
        </TableRow>
        {items.map((item) => (
          <TableRow key={item.account_code}>
            <TableCell className="w-[100px]">{item.account_code}</TableCell>
            <TableCell>{item.account_name}</TableCell>
            <TableCell>{item.account_type}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(item.balance)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow>
          <TableCell colSpan={4} className="h-2"></TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Laporan Keuangan Lengkap</h3>
          <p className="text-sm text-muted-foreground">
            {date
              ? `Per tanggal ${format(date, "dd MMMM yyyy")}`
              : "Pilih tanggal"}
          </p>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "dd MMMM yyyy") : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchBalanceSheetData}
            disabled={isLoading || !date}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Balance Sheet Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">Neraca (Balance Sheet)</h4>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Kode</TableHead>
                <TableHead>Nama Akun</TableHead>
                <TableHead>Tipe Akun</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-6 text-muted-foreground"
                  >
                    Memuat data...
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {renderAccountSection(
                    "ASET",
                    balanceSheetData.assets,
                    balanceSheetData.totalAssets,
                  )}
                  {renderAccountSection(
                    "KEWAJIBAN",
                    balanceSheetData.liabilities,
                    balanceSheetData.totalLiabilities,
                  )}
                  {renderAccountSection(
                    "EKUITAS",
                    balanceSheetData.equity,
                    balanceSheetData.totalEquity,
                  )}

                  <TableRow className="bg-primary/10">
                    <TableCell colSpan={3} className="font-bold">
                      TOTAL KEWAJIBAN & EKUITAS
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(
                        balanceSheetData.totalLiabilities +
                          balanceSheetData.totalEquity,
                      )}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Profit Loss Summary Section */}
      {profitLossData && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Ringkasan Laba Rugi</h4>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Total Pendapatan
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatCurrency(profitLossData.total_income)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Beban</TableCell>
                  <TableCell className="text-right text-red-600">
                    {formatCurrency(profitLossData.total_expense)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Laba/Rugi Bersih</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-bold",
                      profitLossData.net >= 0
                        ? "text-green-600"
                        : "text-red-600",
                    )}
                  >
                    {formatCurrency(profitLossData.net)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Trial Balance Section */}
      {trialBalanceData.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">
            Neraca Saldo (Trial Balance)
          </h4>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Kode</TableHead>
                  <TableHead>Nama Akun</TableHead>
                  <TableHead className="text-right">Debit</TableHead>
                  <TableHead className="text-right">Kredit</TableHead>
                  <TableHead className="text-right">Saldo Akhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trialBalanceData.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="w-[100px]">
                      {item.account_code}
                    </TableCell>
                    <TableCell>{item.account_name}</TableCell>
                    <TableCell className="text-right">
                      {item.debit > 0 ? formatCurrency(item.debit) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.credit > 0 ? formatCurrency(item.credit) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.closing_balance)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/10">
                  <TableCell colSpan={2} className="font-bold">
                    TOTAL
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      trialBalanceData.reduce(
                        (sum, item) => sum + item.debit,
                        0,
                      ),
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      trialBalanceData.reduce(
                        (sum, item) => sum + item.credit,
                        0,
                      ),
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatCurrency(
                      trialBalanceData.reduce(
                        (sum, item) => sum + item.closing_balance,
                        0,
                      ),
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}