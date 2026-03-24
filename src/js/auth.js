document.addEventListener("DOMContentLoaded", () => {
    // --------------------- Banner ---------------------
  const loginBanner = document.getElementById("loginBanner");
  const loginBannerText = document.getElementById("loginBannerText");

  function hideLoginBanner() {
    if (!loginBanner || !loginBannerText) return;
    loginBanner.classList.add("send-banner--hidden");
    loginBanner.classList.remove("send-banner--sent", "send-banner--error");
    loginBannerText.textContent = "";
  }

  function showLoginBanner(typeClass, message) {
    if (!loginBanner || !loginBannerText) return;
    loginBanner.classList.remove("send-banner--hidden");
    loginBanner.classList.remove("send-banner--sent", "send-banner--error");
    loginBanner.classList.add(typeClass);
    loginBannerText.textContent = message;

    window.clearTimeout(showLoginBanner._t);
    showLoginBanner._t = window.setTimeout(hideLoginBanner, 2500);
  }

    // ------------ Tela de login com autenticação real do banco --------------
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!form || !emailInput || !passwordInput) {
        console.error("Formulário de login ou campos de email/senha não encontrados.");
        return;
    }

    // Login autenticado
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
            showLoginBanner("send-banner--error", "E-mail ou senha incorretos.");
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
                showLoginBanner("send-banner--error", "Erro ao carregar perfil. Tente novamente.");
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