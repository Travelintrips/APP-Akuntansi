// This file previously contained accounting integration functions
// All accounting integrations have been removed from booking and payment processes

// Placeholder functions to maintain compatibility
export const createJournalEntryFromSubAccount = async (data: any) => {
  console.log("Accounting integration disabled - no journal entry created");
  return { success: true, data: null };
};

export const createPaymentJournalEntry = async (paymentData: any) => {
  console.log(
    "Accounting integration disabled - no payment journal entry created",
  );
  return { success: true, data: null };
};

export const createServiceJournalEntry = async (
  serviceType: string,
  transactionData: any,
) => {
  console.log(
    `Accounting integration disabled - no service journal entry created for ${serviceType}`,
  );
  return { success: true, data: null };
};
