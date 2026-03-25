document.addEventListener("profileLoaded", () => {
    const profile = window.currentProfile;
    const sidebarUser = document.getElementById("sidebarUser");

    if (!profile || !sidebarUser) return;

    sidebarUser.textContent = profile.full_name || profile.username || "Usuário";
});