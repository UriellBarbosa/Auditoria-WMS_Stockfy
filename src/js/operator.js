document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    const sku = document.getElementById("sku");
    const address = document.getElementById("address");
    const qty = document.getElementById("qty");

    const banner = document.getElementById("sendBanner");
    const bannerText = document.getElementById("sendBannerText");


    // Foco inicial no campo SKU
    sku?.focus();

    function hideBanner() {
        banner.classList.add("send-banner--hidden");
        banner.classList.remove("send-banner--sent", "send-banner--offline", "send-banner--error");
        bannerText.textContent = "";
    }

    function showBanner(type, message) {
        banner.classList.remove("send-banner--hidden");
        banner.classList.remove("send-banner--sent", "send-banner--offline", "send-banner--error");

        banner.classList.add(type);
        bannerText.textContent = message;

        // Some sozinho depois de 3s
        window.clearTimeout(showBanner._t);
        showBanner._t = window.setTimeout(hideBanner, 3000);
    }

    function isEnter(e) {
        return e.key === "Enter";
    }

    // Enter no SKU / endereço vai para o próximo campo
    [sku, address].forEach((el, idx) => {
        if (!el) return;
        el.addEventListener("keydown", (e) => {
            if (!isEnter(e)) return;
            e.preventDefault();
            if (idx === 0) address?.focus();
            if (idx === 1) qty?.focus();
        });
    });

    // Enter no campo de quantidade submete o formulário
    qty?.addEventListener("keydown", (e) => {
        if (!isEnter(e)) return;
        e.preventDefault();
        form?.requestsubmit?.();
    });

    function validate() {
        const errors = [];

        if (!sku.value.trim()) errors.push("SKU não preenchido");
        if (!address.value.trim()) errors.push("Endereço não preenchido");

        // Quantidade obrigatório e inteiro >= 0
        const qtyRaw = qty.value.trim();
        if (!qtyRaw) {
            errors.push("Quantidade não preenchida");
        } else {
            const n = Number(qtyRaw);
            if (!Number.isInteger(n)) errors.push("Quantidade deve ser um número inteiro");
            if (n < 0) errors.push("Quantidade não pode ser negativa");
        }

        return errors;
    }

    form?.addEventListener("submit", (e) => {
        e.preventDefault();

        const errors = validate();
        if (errors.length > 0) {
            showBanner("send-banner--error", `Falha ao enviar: ${errors[0]}`);

            // Foca no primeiro campo com problema
            if (errors[0].includes("SKU")) sku.focus();
            else if (errors[0].includes("Endereço")) address.focus();
            else qty.focus();
            return;
        }

        // Sucesso: online vs offline (por enquanto sem backend)
        if (navigator.onLine) {
            showBanner("send-banner--sent", "Ocorrência enviada");
        } else {
            showBanner("send-banner--offline", "Ocorrência salva localmente");
        }

        // Aqui no futuro vai chamar a API. Por enquanto, só limpa os campos e foca no SKU.
        form.reset();
        sku.focus();
    });
});