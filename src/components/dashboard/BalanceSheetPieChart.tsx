import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabase";

interface BalanceSheetData {
  name: string;
  value: number;
  color: string;
}

const BalanceSheetPieChart = () => {
  const [data, setData] = useState<BalanceSheetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceSheetData();
  }, []);

  const fetchBalanceSheetData = async () => {
    try {
      setLoading(true);

      // Fetch all accounts with their current balances
      const { data: accounts, error } = await supabase
        .from("chart_of_accounts")
        .select("account_type, current_balance")
        .not("current_balance", "is", null);

      if (error) {
        console.error("Error fetching balance sheet data:", error);
        return;
      }

      // Group by account type and sum balances
      const balanceSheet = {
        Assets: 0,
        Liabilities: 0,
        Equity: 0,
      };

      accounts?.forEach((account) => {
        const balance = Math.abs(account.current_balance || 0);

        if (account.account_type === "Asset") {
          balanceSheet.Assets += balance;
        } else if (account.account_type === "Liability") {
          balanceSheet.Liabilities += balance;
        } else if (account.account_type === "Equity") {
          balanceSheet.Equity += balance;
        }
      });

      const chartData: BalanceSheetData[] = [
        {
          name: "Aset",
          value: balanceSheet.Assets,
          color: "#10b981",
        },
        {
          name: "Kewajiban",
          value: balanceSheet.Liabilities,
          color: "#ef4444",
        },
        {
          name: "Ekuitas",
          value: balanceSheet.Equity,
          color: "#3b82f6",
        },
      ];

      // Filter out zero values
      const filteredData = chartData.filter((item) => item.value > 0);
      setData(filteredData);
    } catch (error) {
      console.error("Error fetching balance sheet data:", error);
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

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Neraca - Distribusi Aset, Kewajiban & Ekuitas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Memuat data...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Tidak ada data tersedia</div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Nilai",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="lg:ml-6 mt-4 lg:mt-0">
              <div className="space-y-3">
                {data.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">
                        {item.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.value)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceSheetPieChart;
