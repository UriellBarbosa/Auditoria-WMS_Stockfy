document.addEventListener("profileLoaded", () => {
    const profile = window.currentProfile;
    const sidebarUser = document.getElementById("sidebarUser");
    const sidebarNav = document.getElementById("sidebarNav");

    if (!profile || !sidebarUser) return;

    // Exibe nome do usuário
    if (sidebarUser) {
    sidebarUser.textContent = profile.full_name || profile.username || "Usuário";
    }

    // Define links por role
    const navLinks = {
        operador: [
           { href: "../modules/auditoria/operador.html", label: "Registrar Ocorrência" },
           { href: "../modules/auditoria/dashboard.html", label: "Minhas Ocorrências" },
        ],
        auditor: [
            { href: "../modules/auditoria/operador.html", label: "Registrar Ocorrência" },
            { href: "../modules/auditoria/auditor.html", label: "Ocorrências" },
            { href: "../modules/auditoria/dashboard.html" , label: "Minhas Ocorrências" },
        ],
        administrador: [
            { href: "../modules/auditoria/operador.html", label: "Registrar Ocorrência" },
            { href: "../modules/auditoria/auditor.html", label: "Ocorrências" },
            { href: "../modules/auditoria/dashboard.html", label: "Minhas Ocorrências"},
            { href: "../modules/auditoria/admin.html", label: "Configurações" },
        ],
    };

    const links = navLinks[profile.role] ?? navLinks.operador;
    const currentPage = window.location.pathname.split("/").pop();

    if (!sidebarNav) return;

    sidebarNav.innerHTML = links.map(({ href, label }) => `
    <a href="${href}" class="sidebar__link ${currentPage === href ? "sidebar__link--active" : ""}"> ${label}
    </a>
    `).join("");
});