import { useState } from "react";
import JournalTableEditor from "@/components/journal/JournalTableEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function JournalPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Jurnal Entri</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/ledger">Lihat Buku Besar</Link>
          </Button>
        </div>
      </div>

      <JournalTableEditor onRefresh={handleRefresh} />
    </div>
  );
}
