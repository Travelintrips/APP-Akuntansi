import supabase from "./supabase";
import { format } from "date-fns";

/**
 * Creates a journal entry from sub-account transaction data
 * @param data - The transaction data
 * @returns Promise with the result of the operation
 */
export const createJournalEntryFromSubAccount = async (data: {
  date: string;
  description: string;
  accountDebit: string;
  accountCredit: string;
  amount: number;
  reference?: string;
}) => {
  try {
    // Format date if needed
    const formattedDate = data.date.includes("-")
      ? data.date
      : format(new Date(data.date), "yyyy-MM-dd");

    // Create journal entry
    const { data: journalEntry, error: journalError } = await supabase
      .from("journal_entries")
      .insert({
        date: formattedDate,
        description:
          `${data.description} ${data.reference ? `(${data.reference})` : ""}`.trim(),
        account_id: data.accountDebit, // Primary account for the entry
      })
      .select()
      .single();

    if (journalError) throw journalError;

    // Create journal entry items (debit and credit)
    const journalItems = [
      {
        journal_entry_id: journalEntry.id,
        account_id: data.accountDebit,
        debit: data.amount,
        credit: 0,
      },
      {
        journal_entry_id: journalEntry.id,
        account_id: data.accountCredit,
        debit: 0,
        credit: data.amount,
      },
    ];

    const { error: itemsError } = await supabase
      .from("journal_entry_items")
      .insert(journalItems);

    if (itemsError) throw itemsError;

    // Process the journal entry
    const { error: functionError } = await supabase.rpc(
      "process_journal_entry",
      { p_journal_entry_id: journalEntry.id },
    );

    if (functionError) throw functionError;

    return { success: true, data: journalEntry };
  } catch (err: any) {
    console.error("Error creating journal entry:", err);
    return { success: false, error: err.message };
  }
};
