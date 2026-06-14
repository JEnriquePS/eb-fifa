const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  const apiKey = Deno.env.get("FOOTBALL_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Falta el secret FOOTBALL_API_KEY en Supabase" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": apiKey },
  });

  const body = await res.text();
  return new Response(body, {
    status: res.status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
