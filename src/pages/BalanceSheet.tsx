import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import BalanceSheetComponent from "@/components/reports/BalanceSheet";

export default function BalanceSheetPage() {
  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/reports">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Neraca (Balance Sheet)</h1>
        </div>
      </div>

      <BalanceSheetComponent />
    </div>
  );
}
