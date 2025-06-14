import supabase from "./supabase";

/**
 * Updates all account totals based on the specified date range
 * @param startDate - Start date in YYYY-MM-DD format or null
 * @param endDate - End date in YYYY-MM-DD format or null
 * @returns Promise with the result of the operation
 */
export const updateAllAccounts = async (
  startDate: string | null,
  endDate: string | null,
) => {
  try {
    // Add timeout to prevent long-running requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const { data, error } = await supabase.rpc(
      "update_all_account_totals",
      {
        p_start_date: startDate,
        p_end_date: endDate,
      },
      {
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (error) {
      console.error("Error updating accounts:", error.message);
      return { success: false, error: error.message };
    } else {
      console.log("Accounts updated successfully:", data);
      return { success: true, data };
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.error("Request timed out after 30 seconds");
      return {
        success: false,
        error:
          "Request timed out. The operation might be taking too long to complete.",
      };
    }
    console.error("Exception updating accounts:", err.message);
    return { success: false, error: err.message };
  }
};
