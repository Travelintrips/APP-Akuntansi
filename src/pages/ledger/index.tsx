import { useState } from "react";
import GeneralLedgerDisplay from "@/components/journal/GeneralLedgerDisplay";
import DirectLedgerEntryForm from "@/components/journal/DirectLedgerEntryForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, FileText, Edit } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState("view");
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleFormSuccess = () => {
    setFormSubmitted(true);
    // Reset the success message after 3 seconds
    setTimeout(() => setFormSubmitted(false), 3000);
    // Switch back to view tab
    setActiveTab("view");
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
          <h1 className="text-2xl font-bold">Buku Besar</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/journal">
              <Plus className="h-4 w-4 mr-2" />
              Buat Jurnal Baru
            </Link>
          </Button>
        </div>
      </div>

      {formSubmitted && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          Entri buku besar berhasil disimpan!
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="view">
            <FileText className="h-4 w-4 mr-2" />
            Lihat Buku Besar
          </TabsTrigger>
          <TabsTrigger value="entry">
            <Edit className="h-4 w-4 mr-2" />
            Entri Langsung
          </TabsTrigger>
        </TabsList>

        <TabsContent value="view">
          <GeneralLedgerDisplay />
        </TabsContent>

        <TabsContent value="entry">
          <DirectLedgerEntryForm onSuccess={handleFormSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
