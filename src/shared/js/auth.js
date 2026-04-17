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

    // ----------------- Tela de login com autenticação real ------------------
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const showPassword = document.getElementById("showPassword");

    if (!form || !emailInput || !passwordInput) {
        console.error("Formulário de login ou campos de email/senha não encontrados.");
        return;
    }

    if (showPassword) {
        showPassword.addEventListener("change", () => {
            passwordInput.type = showPassword.checked ? "text" : "password";
        });
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

            // redireciona para a página correta de acordo com o login
            const redirectMap = {
                operador: "../modules/auditoria/operador.html",
                auditor: "../modules/auditoria/auditor.html",
                administrador: "../modules/auditoria/admin.html",
            };

            // Redireciona para a página correta com base no papel do usuário
            const destination = redirectMap[profile.role] ?? "../modules/auditoria/operador.html";
            window.location.href = destination;
        });
    });