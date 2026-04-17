document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) return;

    logoutButton.addEventListener("click", async () => {

        const confirmLogout = confirm("Deseja realmente sair do sistema?");

        if (!confirmLogout) return;

        const {error} = await
        window.supabaseClient.auth.signOut();

        if (error) {
            console.error("Erro ao sair:", error.message);
            alert("Erro ao sair do sistema. Por favor, tente novamente.")
            return;
        }

        window.location.href = `${window.location.origin}/src/shared/index.html`;
    });
});