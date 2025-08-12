import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Banknote,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
} from "lucide-react";
import supabase from "@/lib/supabase";

interface AccountSummary {
  id: string;
  name: string;
  balance: number;
  type: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const AccountSummaryCards = () => {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccountSummaries();
  }, []);

  const fetchAccountSummaries = async () => {
    try {
      setLoading(true);

      // Fetch key accounts - Cash, Bank, Main Revenue, etc.
      const { data: accountsData, error } = await supabase
        .from("chart_of_accounts")
        .select("id, account_name, account_type, current_balance, account_code")
        .in("account_code", [
          "1101", // Kas
          "1102", // Bank
          "4101", // Pendapatan Utama
          "5101", // Biaya Operasional
          "2101", // Utang Usaha
          "3101", // Modal
        ])
        .order("account_code");

      if (error) {
        console.error("Error fetching account summaries:", error);
        return;
      }

      const getAccountIcon = (accountCode: string, accountType: string) => {
        switch (accountCode) {
          case "1101": // Kas
            return <Wallet className="h-6 w-6" />;
          case "1102": // Bank
            return <CreditCard className="h-6 w-6" />;
          case "4101": // Pendapatan Utama
            return <TrendingUp className="h-6 w-6" />;
          case "5101": // Biaya Operasional
            return <TrendingDown className="h-6 w-6" />;
          case "2101": // Utang Usaha
            return <DollarSign className="h-6 w-6" />;
          case "3101": // Modal
            return <Banknote className="h-6 w-6" />;
          default:
            return <DollarSign className="h-6 w-6" />;
        }
      };

      const getAccountColor = (accountType: string) => {
        switch (accountType) {
          case "Asset":
            return {
              color: "text-green-600",
              bgColor: "bg-green-50 border-green-200",
            };
          case "Revenue":
            return {
              color: "text-blue-600",
              bgColor: "bg-blue-50 border-blue-200",
            };
          case "Expense":
            return {
              color: "text-red-600",
              bgColor: "bg-red-50 border-red-200",
            };
          case "Liability":
            return {
              color: "text-orange-600",
              bgColor: "bg-orange-50 border-orange-200",
            };
          case "Equity":
            return {
              color: "text-purple-600",
              bgColor: "bg-purple-50 border-purple-200",
            };
          default:
            return {
              color: "text-gray-600",
              bgColor: "bg-gray-50 border-gray-200",
            };
        }
      };

      const summaries: AccountSummary[] =
        accountsData?.map((account) => {
          const colors = getAccountColor(account.account_type);
          return {
            id: account.id,
            name: account.account_name,
            balance: account.current_balance || 0,
            type: account.account_type,
            icon: getAccountIcon(account.account_code, account.account_type),
            color: colors.color,
            bgColor: colors.bgColor,
          };
        }) || [];

      setAccounts(summaries);
    } catch (error) {
      console.error("Error fetching account summaries:", error);
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

  const formatBalance = (balance: number, accountType: string) => {
    // For liability and expense accounts, show absolute value
    // For asset, revenue, and equity accounts, show as is
    const displayBalance = Math.abs(balance);
    return formatCurrency(displayBalance);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="bg-white animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Ringkasan Saldo Akun Utama
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <Card
            key={account.id}
            className={`${account.bgColor} border transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">
                    {account.name}
                  </p>
                  <p className={`text-2xl font-bold ${account.color}`}>
                    {formatBalance(account.balance, account.type)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {account.type === "Asset"
                      ? "Aset"
                      : account.type === "Revenue"
                        ? "Pendapatan"
                        : account.type === "Expense"
                          ? "Biaya"
                          : account.type === "Liability"
                            ? "Kewajiban"
                            : "Ekuitas"}
                  </p>
                </div>
                <div className={`${account.color} opacity-80`}>
                  {account.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AccountSummaryCards;
