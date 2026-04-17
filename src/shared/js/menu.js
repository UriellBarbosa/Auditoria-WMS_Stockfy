document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("menuToggle");
    const sidebar = document.querySelector(".sidebar");
    const sidebarLinks = document.querySelectorAll(".sidebar__link");

    if (!toggle || !sidebar) return;

    function openSidebar() {
        sidebar.classList.add("sidebar--open");
    }

    function closeSidebar() {
        sidebar.classList.remove("sidebar--open");
    }

    function toggleSidebar(event) {
        event.stopPropagation();

        sidebar.classList.toggle("sidebar--open");
    }

    toggle.addEventListener("click", toggleSidebar);

    sidebar.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    document.addEventListener("click", () => {
        closeSidebar();
    });

    sidebarLinks.forEach((link) => {
        link.addEventListener("click", () => {
            closeSidebar();
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });
});

