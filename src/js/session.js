document.addEventListener("DOMContentLoaded", async () => {
    const {
        data: { session },
        error: sessionError,
    } = await window.supabaseClient.auth.getSession();

    if (sessionError) {
        console.error("Erro ao verificar sessão:", sessionError.message);
        window.location.href = "index.html";
        return;
    }

    if (!session) {
        console.warn("Nenhuma sessão encontrada. Redirecionando para a página de login.");
        window.location.href = "index.html";
        return;
    }

    console.log("Sessão ativa encontrada:", session);

    const userId = session.user.id;

    const {
        data: profile,
        error: profileError} = await 
        window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

    if (profileError) {
        console.error("Erro ao buscar perfil do usuário:", profileError.message);
        return;
    }

    console.log("Perfil do usuário:", profile);
    window.currentProfile = profile;
});