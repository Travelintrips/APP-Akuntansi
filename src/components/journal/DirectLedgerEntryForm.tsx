import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import TransactionDescriptionInput from "./TransactionDescriptionInput";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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

const directLedgerSchema = z
  .object({
    account_id: z.string().min(1, "Akun harus dipilih"),
    date: z.date(),
    description: z.string().min(1, "Deskripsi harus diisi"),
    debit: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
    credit: z.coerce.number().min(0, "Nilai tidak boleh negatif"),
  })
  .refine(
    (data) => {
      // Either debit or credit must have a value, but not both
      return (
        (data.debit > 0 && data.credit === 0) ||
        (data.credit > 0 && data.debit === 0)
      );
    },
    {
      message: "Isi salah satu nilai debit atau kredit saja",
      path: ["debit"],
    },
  );

type DirectLedgerFormValues = z.infer<typeof directLedgerSchema>;

interface DirectLedgerEntryFormProps {
  onSuccess?: () => void;
}

export default function DirectLedgerEntryForm({
  onSuccess,
}: DirectLedgerEntryFormProps) {
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DirectLedgerFormValues>({
    resolver: zodResolver(directLedgerSchema),
    defaultValues: {
      account_id: "",
      date: new Date(),
      description: "",
      debit: 0,
      credit: 0,
    },
  });

  // Load accounts when component mounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const { data, error } = await supabase
        .from("chart_of_accounts")
        .select("*")
        .eq("is_header", false) // Only get non-header accounts
        .order("account_code");

      if (error) {
        console.error("Error fetching accounts:", error);
        return;
      }

      setAccounts(data || []);
    };

    fetchAccounts();
  }, []);

  const onSubmit = async (values: DirectLedgerFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Ensure description is not empty
      if (!values.description.trim()) {
        throw new Error("Deskripsi tidak boleh kosong");
      }

      // Get the account type to calculate the balance correctly
      const account = accounts.find((acc) => acc.id === values.account_id);
      if (!account) {
        throw new Error("Akun tidak ditemukan");
      }

      // Get the current balance for this account
      const { data: ledgerData, error: ledgerError } = await supabase
        .from("general_ledger")
        .select("balance")
        .eq("account_id", values.account_id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (ledgerError) throw ledgerError;

      const currentBalance =
        ledgerData && ledgerData.length > 0 ? ledgerData[0].balance : 0;

      // Calculate the new balance based on account type
      let newBalance;
      if (account.account_type === "Aset" || account.account_type === "Beban") {
        // For asset and expense accounts: debit increases, credit decreases
        newBalance = currentBalance + values.debit - values.credit;
      } else {
        // For liability, equity, and revenue accounts: credit increases, debit decreases
        newBalance = currentBalance - values.debit + values.credit;
      }

      // Insert the general ledger entry
      const { error: insertError } = await supabase
        .from("general_ledger")
        .insert({
          account_id: values.account_id,
          date: format(values.date, "yyyy-MM-dd"),
          description: values.description.trim(),
          debit: values.debit,
          credit: values.credit,
          balance: newBalance,
          manual_entry: true, // Flag to indicate this is a manual entry
        });

      if (insertError) throw insertError;

      // Update the account balance in chart_of_accounts
      const { error: updateError } = await supabase
        .from("chart_of_accounts")
        .update({
          total_debit: account.total_debit
            ? account.total_debit + values.debit
            : values.debit,
          total_credit: account.total_credit
            ? account.total_credit + values.credit
            : values.credit,
          balance_total: newBalance,
        })
        .eq("id", values.account_id);

      if (updateError) throw updateError;

      // Reset form
      form.reset({
        account_id: "",
        date: new Date(),
        description: "",
        debit: 0,
        credit: 0,
      });

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Error submitting direct ledger entry:", err);
      setError(
        err.message || "Terjadi kesalahan saat menyimpan entri buku besar",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 bg-background p-6 rounded-lg border">
      <div>
        <h3 className="text-lg font-medium">Entri Langsung ke Buku Besar</h3>
        <p className="text-sm text-muted-foreground">
          Gunakan form ini untuk membuat entri langsung ke buku besar tanpa
          melalui jurnal.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Akun</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih akun" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <TransactionDescriptionInput
              form={form}
              name="description"
              label="Deskripsi"
              placeholder="Masukkan Deskripsi Transaksi"
              required={true}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="debit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Debit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // If debit has value, clear credit
                        if (e.target.value && e.target.value !== "0") {
                          form.setValue("credit", 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="credit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kredit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // If credit has value, clear debit
                        if (e.target.value && e.target.value !== "0") {
                          form.setValue("debit", 0);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full md:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Entri"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
