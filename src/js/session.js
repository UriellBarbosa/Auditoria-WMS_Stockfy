document.addEventListener("DOMContentLoaded", async () => {
    // --------------- VERIFICAÇÃO DE SESSÃO INICIADA NO LOGIN --------------
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

    window.currentProfile = profile;

    // Proteção de rotas por role
    const currentPage = window.location.pathname.split("/").pop();

    const allowedRoutes = {
        operador: ["operador.html", "dasboard.html"],
        auditor: ["auditor.html", "operador.html", "dashboard.html"],
        administrador: ["auditor.html", "operador.html", "dashboard.html"],
    };

    const allwed = allowedRoutes[profile.role] ?? [];

    if (!allwed.includes(currentPage)) {
        const redirectMap = {
            operador: "operador.html",
            auditor: "auditor.html",
            administrador: "auditor.html",
        };

        window.location.href = redirectMap[profile.role] ?? "operador.html";
        return;
    }

    document.dispatchEvent(new Event("profileLoaded"));
    
    console.log("Perfil do usuário:", profile);
});