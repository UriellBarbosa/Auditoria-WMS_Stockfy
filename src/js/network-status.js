document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("netBanner") || document.getElementById("netbanner");
    const text = banner?.querySelector(".banner__message") || banner?.querySelector(".bannet__text");

    // Se a página não tiver uma banner não faz nada
    if (!banner || !text) return;

    function setOnline() {
        banner.classList.remove("banner--offline");
        banner.classList.add("banner--online");
        text.textContent = "Sistema online";
    }

    function setOffline() {
        banner.classList.remove("banner--online");
        banner.classList.add("banner--offline");
        text.textContent = "Sem conexão com a internet";
    }

    // Checagem real de internet (não depende só do navigator.online)
    async function hasInternet() {
        // Se o navegador já diz que está offline, aceita isso
        if (!navigator.onLine) return false;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2500);

            // endpoint leve (não precisa ler resposta). no-cors evita problemas de CORS.
            await fetch("https://www.google.com/favicon.ico", {
                method: "GET",
                mode: "no-cors",
                cache: "no-store",
                signal: controller.signal,
            });

            clearTimeout(timeout);
            return true;
        } catch (e) {
            return false;
        }
    }

    async function updateStatus() {
        const ok = await hasInternet();
        if (ok) setOnline();
        else setOffline();
    };

    // Atualiza ao carregar
    updateStatus();

    // Eventos do navegador (rápido)
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    // Revalida de tempos em tempos (ajuda em rede instável)
    setInterval(updateStatus, 10000);
});