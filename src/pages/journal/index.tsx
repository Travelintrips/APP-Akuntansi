import { useState } from "react";
import JournalEntryForm from "@/components/journal/JournalEntryForm";
import JournalTableEditor from "@/components/journal/JournalTableEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JournalPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"form" | "table">("form");

  const handleFormSuccess = () => {
    setFormSubmitted(true);
    // Reset the success message after 3 seconds
    setTimeout(() => setFormSubmitted(false), 3000);
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

      {formSubmitted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Jurnal berhasil disimpan dan diproses ke buku besar!
        </div>
      )}

      <Tabs
        defaultValue="form"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "form" | "table")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="form">Form Jurnal</TabsTrigger>
          <TabsTrigger value="table">Tabel Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <JournalEntryForm onSuccess={handleFormSuccess} />
        </TabsContent>

        <TabsContent value="table">
          <JournalTableEditor onRefresh={() => setFormSubmitted(true)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
