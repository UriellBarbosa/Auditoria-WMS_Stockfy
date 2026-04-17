document.addEventListener("DOMContentLoaded", async () => {
    // --------------- VERIFICAÇÃO DE SESSÃO INICIADA NO LOGIN --------------
    const {
        data: { session },
        error: sessionError,
    } = await window.supabaseClient.auth.getSession();

    if (sessionError) {
        console.error("Erro ao verificar sessão:", sessionError.message);
        window.location.href = `${window.location.origin}/shared/index.html`;
        return;
    }

    if (!session) {
        console.warn("Nenhuma sessão encontrada. Redirecionando para a página de login.");
        window.location.href = `${window.location.origin}/shared/index.html`;
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
        operador: ["operador.html", "dashboard.html"],
        auditor: ["auditor.html", "operador.html", "dashboard.html"],
        administrador: ["auditor.html", "operador.html", "dashboard.html"],
    };

    const allowed = allowedRoutes[profile.role] ?? [];

    if (!allowed.includes(currentPage)) {
        const base = window.location.origin;
        const redirectMap = {
            operador: `${base}/modules/auditoria/operador.html`,
            auditor: `${base}/modules/auditoria/auditor.html`,
            administrador: `${base}/modules/auditoria/auditor.html`,
        };

        window.location.href = redirectMap[profile.role] ?? "../../modules/auditoria/operador.html";
        return;
    }

    document.dispatchEvent(new Event("profileLoaded"));
    
    console.log("Perfil do usuário:", profile);
});