document.addEventListener("DOMContentLoaded", () => {
    // -------------- Tela de login com autenticação real do banco --------------
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!form || !emailInput || !passwordInput) {
        console.error("Formulário de login ou campos de email/senha não encontrados.");
        return;
    }

    // Redirecionamento para login autenticado
    form.addEventListener("submit", async (e) => {
        
        e.preventDefault()
    
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        const {data, error} = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error("Erro no login:", error.message);
            alert("Falha no login: " + error.message);
            return;
        }

            console.log("Usuário logado:", data);

            const { data: profile, error: profileError } = await window.supabaseClient
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .single();

            if (profileError || !profile) {
                console.error("Erro ao buscar perfil:", profileError?.message);
                alert("Erro ao carregar perfil. Tente novamente.");
                return;
            }

            const redirectMap = {
                operador: "operador.html",
                auditor: "auditor.html",
                administrador: "auditor.html",
            };

            const destination = redirectMap[profile.role] ?? "operador.html";
            window.location.href = destination;
        });
    });