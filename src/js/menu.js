document.addEventListener("DOMContentLoaded", () => {
    const Toggle = document.getElementById("menuToggle");
    const Sidebar = document.querySelector(".sidebar");

    if (!Toggle || !Sidebar) return

    Toggle.addEventListener("click", () => {
        Sidebar.classList.toggle("sidebar--open")
    })
});

        

