import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabase";

interface TrendData {
  month: string;
  revenue: number;
  expenses: number;
}

const RevenueExpenseTrend = () => {
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      // Get the last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          monthName: date.toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
          }),
        });
      }

      const trendData: TrendData[] = [];

      for (const monthInfo of months) {
        const startDate = `${monthInfo.year}-${monthInfo.month.toString().padStart(2, "0")}-01`;

        // Calculate end date properly handling year boundary
        let endYear = monthInfo.year;
        let endMonth = monthInfo.month + 1;
        if (endMonth > 12) {
          endMonth = 1;
          endYear += 1;
        }
        const endDate = `${endYear}-${endMonth.toString().padStart(2, "0")}-01`;

        // Fetch revenue from bookings_trips
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings_trips")
          .select("harga_jual")
          .gte("tanggal", startDate)
          .lt("tanggal", endDate);

        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
        }

        const revenue =
          bookings?.reduce(
            (sum, booking) => sum + (booking.harga_jual || 0),
            0,
          ) || 0;

        // Fetch expenses from general_ledger
        const { data: ledgerEntries, error: ledgerError } = await supabase
          .from("general_ledger")
          .select("debit, credit, account_type")
          .in("account_type", ["Expense", "Cost of Goods Sold"])
          .gte("date", startDate)
          .lt("date", endDate);

        if (ledgerError) {
          console.error("Error fetching ledger entries:", ledgerError);
        }

        const expenses =
          ledgerEntries?.reduce((sum, entry) => {
            // For expense accounts, debit increases the expense
            return sum + (entry.debit || 0) - (entry.credit || 0);
          }, 0) || 0;

        trendData.push({
          month: monthInfo.monthName,
          revenue: revenue,
          expenses: Math.abs(expenses), // Ensure positive value for display
        });
      }

      setData(trendData);
    } catch (error) {
      console.error("Error fetching trend data:", error);
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

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Tren Pendapatan vs Biaya (12 Bulan Terakhir)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "revenue" ? "Pendapatan" : "Biaya",
                ]}
                labelFormatter={(label) => `Periode: ${label}`}
              />
              <Legend
                formatter={(value) =>
                  value === "revenue" ? "Pendapatan" : "Biaya"
                }
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#10b981"
                fill="url(#colorRevenue)"
                name="revenue"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="2"
                stroke="#ef4444"
                fill="url(#colorExpenses)"
                name="expenses"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default RevenueExpenseTrend;
