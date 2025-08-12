import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import TransactionDescriptionInput from "./TransactionDescriptionInput";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import supabase from "@/lib/supabase";
import { ChartOfAccount } from "@/components/coa/COAList";

const journalEntrySchema = z.object({
  date: z.date(),
  description: z.string().min(1, "Deskripsi harus diisi"),
  items: z
    .array(
      z.object({
        account_id: z.string().min(1, "Akun harus dipilih"),
        debit: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
        credit: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
      }),
    )
    .min(2, "Minimal 2 entri jurnal diperlukan")
    .refine(
      (items) => {
        // Check if at least one item has a debit value and at least one has a credit value
        const hasDebit = items.some((item) => item.debit > 0);
        const hasCredit = items.some((item) => item.credit > 0);
        return hasDebit && hasCredit;
      },
      {
        message: "Harus ada minimal satu debit dan satu kredit",
      },
    )
    .refine(
      (items) => {
        // Check if total debits equals total credits
        const totalDebit = items.reduce(
          (sum, item) => sum + (item.debit || 0),
          0,
        );
        const totalCredit = items.reduce(
          (sum, item) => sum + (item.credit || 0),
          0,
        );
        return Math.abs(totalDebit - totalCredit) < 0.01; // Allow for small floating point differences
      },
      {
        message: "Total debit harus sama dengan total kredit",
      },
    ),
});

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>;

interface JournalEntryFormProps {
  onSuccess?: () => void;
}

export default function JournalEntryForm({ onSuccess }: JournalEntryFormProps) {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      date: new Date(),
      description: "",
      items: [
        { account_id: "", debit: 0, credit: 0 },
        { account_id: "", debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .order("account_code");

      if (error) {
        console.error("Error fetching accounts:", error);
        return;
      }

      setAccounts(data || []);
    };

    fetchAccounts();
  }, []);

  const onSubmit = async (values: JournalEntryFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure description is not empty
      if (!values.description.trim()) {
        throw new Error("Deskripsi tidak boleh kosong");
      }

      // Validate all account IDs before proceeding
      const invalidAccounts = values.items
        .filter((item) => item.account_id)
        .filter(
          (item) => !accounts.some((account) => account.id === item.account_id),
        );

      if (invalidAccounts.length > 0) {
        throw new Error(
          "Terdapat akun yang tidak valid. Silakan pilih akun yang tersedia.",
        );
      }

      // Insert journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          date: format(values.date, "yyyy-MM-dd"),
          description: values.description.trim(),
        })
        .select()
        .single();

      if (journalError) throw journalError;

      // Insert journal entry items
      const journalItems = values.items.map((item) => ({
        journal_entry_id: journalEntry.id,
        account_id: item.account_id,
        debit: item.debit || 0,
        credit: item.credit || 0,
      }));

      const { error: itemsError } = await supabase
        .from("journal_entry_items")
        .insert(journalItems);

      if (itemsError) throw itemsError;

      // Process the journal entry directly using RPC instead of edge function
      const { error: functionError } = await supabase.rpc(
        "process_journal_entry",
        { p_journal_entry_id: journalEntry.id },
      );

      if (functionError) throw functionError;

      // Reset form and call onSuccess callback
      form.reset({
        date: new Date(),
        description: "",
        items: [
          { account_id: "", debit: 0, credit: 0 },
          { account_id: "", debit: 0, credit: 0 },
        ],
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error submitting journal entry:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan jurnal");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalDebit = form
    .watch("items")
    .reduce((sum, item) => sum + (parseFloat(item.debit as any) || 0), 0);

  const totalCredit = form
    .watch("items")
    .reduce((sum, item) => sum + (parseFloat(item.credit as any) || 0), 0);

  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div>
        <h3 className="text-lg font-medium">Buat Jurnal Entri Baru</h3>
        <p className="text-sm text-muted-foreground">
          Masukkan informasi jurnal entri dan pastikan total debit dan kredit
          seimbang.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd MMMM yyyy")
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <TransactionDescriptionInput
              form={form}
              name="description"
              label="Deskripsi"
              placeholder="Masukkan Deskripsi Transaksi"
              required={true}
            />
          </div>

          {/* Journal Entry Items */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Detail Jurnal</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ account_id: "", debit: 0, credit: 0 })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Baris
              </Button>
            </div>

            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 font-medium text-sm">
                <div className="col-span-5">Akun</div>
                <div className="col-span-3 text-right">Debit</div>
                <div className="col-span-3 text-right">Kredit</div>
                <div className="col-span-1"></div>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-12 gap-2 p-3 border-t items-center"
                >
                  <div className="col-span-5">
                    <FormField
                      control={form.control}
                      name={`items.${index}.account_id`}
                      render={({ field }) => (
                        <FormItem>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih akun" />
                              </SelectTrigger>
                            </FormControl>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.debit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="text-right"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // If debit has value, clear credit
                                if (e.target.value && e.target.value !== "0") {
                                  form.setValue(`items.${index}.credit`, 0);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.credit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="text-right"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // If credit has value, clear debit
                                if (e.target.value && e.target.value !== "0") {
                                  form.setValue(`items.${index}.debit`, 0);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {fields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="grid grid-cols-12 gap-2 p-3 border-t bg-muted/30 font-medium">
                <div className="col-span-5 text-right">Total:</div>
                <div
                  className={cn(
                    "col-span-3 text-right",
                    !isBalanced && "text-destructive",
                  )}
                >
                  {totalDebit.toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={cn(
                    "col-span-3 text-right",
                    !isBalanced && "text-destructive",
                  )}
                >
                  {totalCredit.toLocaleString("id-ID", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="col-span-1"></div>
              </div>
            </div>

            {!isBalanced && (
              <p className="text-sm text-destructive">
                Total debit dan kredit harus sama
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSubmitting || !isBalanced}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Jurnal"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
