import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Reports = () => {
  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Button asChild className="w-full max-w-md">
          <Link to="/balance-sheet">Neraca (Balance Sheet)</Link>
        </Button>
        <Button asChild className="w-full max-w-md" variant="outline">
          <Link to="/transaction-reports">Laporan Transaksi</Link>
        </Button>
      </div>
    </div>
  );
};

export default Reports;
