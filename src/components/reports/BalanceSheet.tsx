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

      // Fetch assets
      const { data: assetsData, error: assetsError } = await supabase
        .from("chart_of_accounts")
        .select("account_type, account_code, account_name, balance_total")
        .eq("account_type", "Aset")
        .not("is_header", "eq", true)
        .order("account_code");

      if (assetsError) throw assetsError;

      // Fetch liabilities
      const { data: liabilitiesData, error: liabilitiesError } = await supabase
        .from("chart_of_accounts")
        .select("account_type, account_code, account_name, balance_total")
        .eq("account_type", "Kewajiban")
        .not("is_header", "eq", true)
        .order("account_code");

      if (liabilitiesError) throw liabilitiesError;

      // Fetch equity
      const { data: equityData, error: equityError } = await supabase
        .from("chart_of_accounts")
        .select("account_type, account_code, account_name, balance_total")
        .eq("account_type", "Modal")
        .not("is_header", "eq", true)
        .order("account_code");

      if (equityError) throw equityError;

      // Calculate totals
      const assets = assetsData.map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance: item.balance_total || 0,
      }));

      const liabilities = liabilitiesData.map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance: item.balance_total || 0,
      }));

      const equity = equityData.map((item) => ({
        account_type: item.account_type,
        account_code: item.account_code,
        account_name: item.account_name,
        balance: item.balance_total || 0,
      }));

      const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
      const totalLiabilities = liabilities.reduce(
        (sum, item) => sum + item.balance,
        0,
      );
      const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);

      setBalanceSheetData({
        assets,
        liabilities,
        equity,
        totalAssets,
        totalLiabilities,
        totalEquity,
      });
    } catch (err: any) {
      console.error("Error fetching balance sheet data:", err);
      setError("Gagal memuat data neraca");
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
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
          <TableCell colSpan={2} className="font-bold">
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
          <TableCell colSpan={3} className="h-2"></TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Neraca (Balance Sheet)</h3>
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
                  colSpan={3}
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
                  <TableCell colSpan={2} className="font-bold">
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
  );
}
