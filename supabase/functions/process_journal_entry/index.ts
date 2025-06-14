// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/manual/runtime/manual/integrations/supabase

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
      },
      status: 200,
    });
  }

  try {
    const supabaseClient = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY");

    if (!supabaseClient || !supabaseKey) {
      throw new Error("Missing environment variables");
    }

    const { journalEntryId } = await req.json();

    if (!journalEntryId) {
      throw new Error("Missing journalEntryId parameter");
    }

    // Create a Supabase client
    const supabaseUrl = supabaseClient;
    const supabaseAnonKey = supabaseKey;

    // Call the process_journal_entry RPC function
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/process_journal_entry`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ p_journal_entry_id: journalEntryId }),
      },
    );

    const result = await response.json();

    // After processing, update the journal entry to trigger realtime updates
    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/journal_entries?id=eq.${journalEntryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ updated_at: new Date().toISOString() }),
      },
    );

    if (!updateResponse.ok) {
      throw new Error("Failed to update journal entry timestamp");
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      status: 400,
    });
  }
});
