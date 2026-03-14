document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    if (!form || !emailInput || !passwordInput) {
        console.error("Formulário de login ou campos de email/senha não encontrados.");
        return;
    }

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
            window.location.href = "./operator.html";
        });
    });