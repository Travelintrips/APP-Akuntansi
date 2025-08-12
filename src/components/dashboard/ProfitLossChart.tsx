import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabase";

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

const ProfitLossChart = () => {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfitLossData();
  }, []);

  const fetchProfitLossData = async () => {
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
          monthName: date.toLocaleDateString("id-ID", { month: "short" }),
        });
      }

      const monthlyData: MonthlyData[] = [];

      for (const monthInfo of months) {
        // Calculate start and end dates properly
        const startDate = new Date(monthInfo.year, monthInfo.month - 1, 1);
        const endDate = new Date(monthInfo.year, monthInfo.month, 1);

        const startDateStr = startDate.toISOString().split("T")[0];
        const endDateStr = endDate.toISOString().split("T")[0];

        // Fetch revenue from bookings_trips
        const { data: bookings, error: bookingsError } = await supabase
          .from("bookings_trips")
          .select("harga_jual, tanggal")
          .gte("tanggal", startDateStr)
          .lt("tanggal", endDateStr);

        if (bookingsError) {
          console.error("Error fetching bookings:", bookingsError);
          continue;
        }

        const revenue =
          bookings?.reduce(
            (sum, booking) => sum + (booking.harga_jual || 0),
            0,
          ) || 0;

        // Fetch expenses from general_ledger (expense accounts)
        const { data: expenses, error: expensesError } = await supabase
          .from("general_ledger")
          .select("debit, account_type")
          .eq("account_type", "Expense")
          .gte("date", startDateStr)
          .lt("date", endDateStr);

        if (expensesError) {
          console.error("Error fetching expenses:", expensesError);
        }

        const totalExpenses =
          expenses?.reduce((sum, expense) => sum + (expense.debit || 0), 0) ||
          0;

        const profit = revenue - totalExpenses;

        monthlyData.push({
          month: monthInfo.monthName,
          revenue: revenue,
          expenses: totalExpenses,
          profit: profit,
        });
      }

      setData(monthlyData);
    } catch (error) {
      console.error("Error fetching profit loss data:", error);
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
          Grafik Laba Rugi Bulanan
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  formatCurrency(value),
                  name === "revenue"
                    ? "Pendapatan"
                    : name === "expenses"
                      ? "Biaya"
                      : "Laba",
                ]}
                labelFormatter={(label) => `Bulan: ${label}`}
              />
              <Legend
                formatter={(value) =>
                  value === "revenue"
                    ? "Pendapatan"
                    : value === "expenses"
                      ? "Biaya"
                      : "Laba"
                }
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="expenses"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={3}
                name="profit"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitLossChart;
