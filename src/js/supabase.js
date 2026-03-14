const supabaseUrl = "https://nkgenjhatrekvsgfabuk.supabase.co";
const supabaseKey = "sb_publishable_3U1iDZ6tfU9zWP4StyX-Rg_FkBvzvxc";

window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

console.log("Supabase conectado");

async function testConnection() {
    const {data, error} = await supabaseClient
    .from("modules")
    .select("*")

    console.log("modules:", data)
}

testConnection();