import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Edit, Save, Trash2, X } from "lucide-react";
import supabase from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartOfAccount } from "@/components/coa/COAList";

interface JournalEntry {
  id: string;
  date: string;
  description: string;
  items: JournalEntryItem[];
}

interface JournalEntryItem {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  account?: ChartOfAccount;
}

interface JournalTableEditorProps {
  onRefresh?: () => void;
}

export default function JournalTableEditor({
  onRefresh,
}: JournalTableEditorProps) {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<
    Record<string, boolean>
  >({});

  // Load journal entries and accounts when component mounts
  useEffect(() => {
    fetchJournalEntries();
    fetchAccounts();

    // Set up realtime subscription for journal entries
    const journalChannel = supabase
      .channel("journal_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entries" },
        () => {
          console.log("Journal entries changed, refreshing data...");
          fetchJournalEntries();
        },
      )
      .subscribe();

    // Set up realtime subscription for journal entry items
    const itemsChannel = supabase
      .channel("journal_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "journal_entry_items" },
        () => {
          console.log("Journal entry items changed, refreshing data...");
          fetchJournalEntries();
        },
      )
      .subscribe();

    // Clean up subscriptions when component unmounts
    return () => {
      supabase.removeChannel(journalChannel);
      supabase.removeChannel(itemsChannel);
    };
  }, []);

  const fetchJournalEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch journal entries
      const { data: entriesData, error: entriesError } = await supabase
        .from("journal_entries")
        .select("*")
        .order("date", { ascending: false });

      if (entriesError) throw entriesError;

      console.log("Journal entries fetched:", entriesData);

      if (!entriesData || entriesData.length === 0) {
        setJournalEntries([]);
        setLoading(false);
        return;
      }

      // Fetch journal entry items for all entries
      const { data: itemsData, error: itemsError } = await supabase
        .from("journal_entry_items")
        .select("*, chart_of_accounts(id, account_code, account_name)")
        .in(
          "journal_entry_id",
          entriesData.map((entry) => entry.id),
        );

      if (itemsError) throw itemsError;

      console.log("Journal entry items fetched:", itemsData);

      // Group items by journal entry
      const entriesWithItems = entriesData.map((entry) => {
        const items = itemsData
          ? itemsData
              .filter((item) => item.journal_entry_id === entry.id)
              .map((item) => ({
                ...item,
                account: item.chart_of_accounts,
              }))
          : [];

        return {
          ...entry,
          items,
        };
      });

      console.log("Processed entries with items:", entriesWithItems);
      setJournalEntries(entriesWithItems);
    } catch (err: any) {
      console.error("Error fetching journal entries:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil data jurnal");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");

      if (error) throw error;
      console.log("Chart of accounts fetched:", data);
      setAccounts(data || []);
    } catch (err: any) {
      console.error("Error fetching accounts:", err);
      setError(err.message || "Terjadi kesalahan saat mengambil data akun");
    }
  };

  const toggleExpandEntry = (entryId: string) => {
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const handleEditEntry = (entryId: string) => {
    setEditingEntry(entryId);
    // Ensure the entry is expanded when editing
    setExpandedEntries((prev) => ({
      ...prev,
      [entryId]: true,
    }));
  };

  const handleEditItem = (itemId: string) => {
    setEditingItem(itemId);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditingItem(null);
    // Refresh data to revert any unsaved changes
    fetchJournalEntries();
  };

  const handleUpdateEntry = async (entry: JournalEntry) => {
    try {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          description: entry.description,
        })
        .eq("id", entry.id);

      if (error) throw error;

      setEditingEntry(null);
      fetchJournalEntries();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Error updating journal entry:", err);
      setError(err.message || "Terjadi kesalahan saat memperbarui jurnal");
    }
  };

  const handleUpdateItem = async (item: JournalEntryItem) => {
    try {
      const { error } = await supabase
        .from("journal_entry_items")
        .update({
          account_id: item.account_id,
          debit: item.debit,
          credit: item.credit,
        })
        .eq("id", item.id);

      if (error) throw error;

      setEditingItem(null);
      fetchJournalEntries();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Error updating journal item:", err);
      setError(err.message || "Terjadi kesalahan saat memperbarui item jurnal");
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus jurnal ini?")) return;

    try {
      // Delete journal entry items first (due to foreign key constraint)
      const { error: itemsError } = await supabase
        .from("journal_entry_items")
        .delete()
        .eq("journal_entry_id", entryId);

      if (itemsError) throw itemsError;

      // Then delete the journal entry
      const { error: entryError } = await supabase
        .from("journal_entries")
        .delete()
        .eq("id", entryId);

      if (entryError) throw entryError;

      // Update general ledger
      const { error: functionError } = await supabase.rpc(
        "update_all_account_totals",
      );

      if (functionError) throw functionError;

      fetchJournalEntries();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Error deleting journal entry:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus jurnal");
    }
  };

  const handleDescriptionChange = (entryId: string, value: string) => {
    setJournalEntries((prev) =>
      prev.map((entry) =>
        entry.id === entryId ? { ...entry, description: value } : entry,
      ),
    );
  };

  const handleItemChange = (
    itemId: string,
    field: "account_id" | "debit" | "credit",
    value: string | number,
  ) => {
    setJournalEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        items: entry.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                [field]: field === "account_id" ? value : Number(value),
                // If setting debit and it has a value, clear credit (and vice versa)
                ...(field === "debit" && Number(value) > 0
                  ? { credit: 0 }
                  : field === "credit" && Number(value) > 0
                    ? { debit: 0 }
                    : {}),
              }
            : item,
        ),
      })),
    );
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat data jurnal...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        Error: {error}
        <Button
          variant="outline"
          className="ml-4"
          onClick={() => {
            fetchJournalEntries();
            fetchAccounts();
          }}
        >
          Coba Lagi
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div>
        <h3 className="text-lg font-medium">Tabel Editor Jurnal</h3>
        <p className="text-sm text-muted-foreground">
          Lihat, edit, dan hapus jurnal entri yang sudah ada.
        </p>
      </div>

      {journalEntries.length === 0 ? (
        <div className="text-center p-6 border rounded-md">
          Belum ada jurnal entri. Silakan buat jurnal baru menggunakan form
          jurnal.
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                fetchJournalEntries();
                fetchAccounts();
              }}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Tanggal</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[120px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journalEntries.map((entry) => {
                const totalDebit = entry.items.reduce(
                  (sum, item) => sum + (item.debit || 0),
                  0,
                );

                return (
                  <React.Fragment key={entry.id}>
                    <TableRow
                      className={expandedEntries[entry.id] ? "bg-muted/50" : ""}
                    >
                      <TableCell>
                        {format(new Date(entry.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {editingEntry === entry.id ? (
                          <Input
                            value={entry.description}
                            onChange={(e) =>
                              handleDescriptionChange(entry.id, e.target.value)
                            }
                          />
                        ) : (
                          <div
                            className="cursor-pointer"
                            onClick={() => toggleExpandEntry(entry.id)}
                          >
                            {entry.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {totalDebit.toLocaleString("id-ID", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-1">
                          {editingEntry === entry.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUpdateEntry(entry)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditEntry(entry.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteEntry(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleExpandEntry(entry.id)}
                              >
                                {expandedEntries[entry.id] ? (
                                  <X className="h-4 w-4" />
                                ) : (
                                  <Edit className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded view with journal items */}
                    {expandedEntries[entry.id] && (
                      <TableRow>
                        <TableCell colSpan={4} className="p-0">
                          <div className="bg-muted/30 p-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[50%]">
                                    Akun
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Debit
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Kredit
                                  </TableHead>
                                  <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {entry.items.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell>
                                      {editingItem === item.id ? (
                                        <Select
                                          value={item.account_id}
                                          onValueChange={(value) =>
                                            handleItemChange(
                                              item.id,
                                              "account_id",
                                              value,
                                            )
                                          }
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Pilih akun" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {accounts.map((account) => (
                                              <SelectItem
                                                key={account.id}
                                                value={account.id}
                                                disabled={account.is_header}
                                              >
                                                {account.account_code} -{" "}
                                                {account.account_name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <>
                                          {item.account?.account_code} -{" "}
                                          {item.account?.account_name}
                                        </>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingItem === item.id ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.debit || ""}
                                          onChange={(e) =>
                                            handleItemChange(
                                              item.id,
                                              "debit",
                                              e.target.value,
                                            )
                                          }
                                          className="text-right"
                                        />
                                      ) : (
                                        item.debit?.toLocaleString("id-ID", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }) || "-"
                                      )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {editingItem === item.id ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={item.credit || ""}
                                          onChange={(e) =>
                                            handleItemChange(
                                              item.id,
                                              "credit",
                                              e.target.value,
                                            )
                                          }
                                          className="text-right"
                                        />
                                      ) : (
                                        item.credit?.toLocaleString("id-ID", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        }) || "-"
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {editingItem === item.id ? (
                                        <div className="flex space-x-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() =>
                                              handleUpdateItem(item)
                                            }
                                          >
                                            <Save className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={handleCancelEdit}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() =>
                                            handleEditItem(item.id)
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => fetchJournalEntries()}>
          Refresh Data
        </Button>
      </div>
    </div>
  );
}
