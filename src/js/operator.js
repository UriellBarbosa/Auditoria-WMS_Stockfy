document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    const sku = document.getElementById("sku");
    const address = document.getElementById("address");
    const qty = document.getElementById("qty");

    const banner = document.getElementById("sendBanner");
    const bannerText = document.getElementById("sendBannerText");

    // Banner de envio (pop-up)
    const sendBanner = document.getElementById("sendBanner");
    const sendBannerText = document.getElementById("sendBannerText");

    // Modal - confirmação de quantidade
    const qtyModal = document.getElementById("qtyModal");
    const qtyModalValue = document.getElementById("qtyModalValue");
    const qtyModalCancel = document.getElementById("qtyModalCancel");
    const qtyModalConfirm = document.getElementById("qtyModalConfirm");

    if (!form || !sku || !address || !qty) {
        console.warn("[operator.js] Campos obrigatórios não encontrados. Verifique IDs.");
        return;
    }

    // ============= Banner helpers ================
    function hideSendBanner() {
        if (!sendBanner || !sendBannerText) return;
        sendBanner.classList.add("send-banner--hidden");
        sendBanner.classList.remove("send-banner--sent", "send-banner--offline", "send-banner-error");
        sendBannerText.textContent = "";
    }

    function showSendBanner(typeClass, message) {
        if (!sendBanner || !sendBannerText) return;
        sendBanner.classList.remove("send-banner--hidden");
        sendBanner.classList.remove("send-banner--sent", "send-banner--offline", "send-banner--error");
        sendBanner.classList.add(typeClass);
        sendBannerText.textContent = message;

        window.clearTimeout(showSendBanner._t);
        showSendBanner._t = window.setTimeout(hideSendBanner, 2500);
    }

    // ================= Modal helpers ================
    function openQtyModal(value) {
        if (!qtyModal || !qtyModalValue) return false;
        qtyModalValue.textContent = String(value);
        qtyModal.classList.remove("modal--hidden");
        qtyModalConfirm?.focus();
        return true;
    }

    function closeQtyModal() {
        qtyModal?.classList.add("modal--hidden");
    }

    // Fecha ao clicar no backdrop
    qtyModal?.addEventListener("click", (e) => {
        const t = e.target;
        if (t && t.dataset && t.dataset.close === "true") {
            closeQtyModal();
            qty.focus();
        }
    });

    qtyModalCancel?.addEventListener("click", () => {
        closeQtyModal();
        qty.focus();
    });

    // ============== Fluxo Enter =============
    function isEnter(e) {
        return e.key === "Enter";
    }

    sku.focus();

    sku.addEventListener("keydown", (e) => {
        if (!isEnter(e)) return;
        e.preventDefault();
        address.focus();
    });

    address.addEventListener("keydown", (e) => {
        if (!isEnter(e)) return;
        e.preventDefault();
        qty.focus();
    });

    qty.addEventListener("keydown", (e) => {
        if (!isEnter(e)) return;
        e.preventDefault();
        form.requestSubmit();
    });

    // ===================== Validação ======================
    function validateFields() {
        const errors = [];

        if (!sku.value.trim()) errors.push({field: sku, msg: "SKU não preenchido"});
        if (!address.value.trim()) errors.push({field: address, msg: "Endereço não preenchido"});

        const qtyRaw = qty.value.trim();
        if (!qtyRaw) {
            errors.push({field: qty, msg: "Quantidade não preenchida"});
        } else {
            const n = Number(qtyRaw);
            if (!Number.isFfinite(n)) errors.push({field: qty, msg: "Quantidade inválida"});
            else {
                if (!Number.isInteger(n)) errors.push({field: qty, msg: "Quantidade deve ser um número inteiro"});
                if (n < 0) errors.push({field: qty, msg: "Quantidade não pode ser negativa"});
            }
        }

        return errors;
    }

    // ====================== "Salvar" (simulado) ====================
    function finalizeSave() {
        if (navigator.onLine) {
            showSendBanner("send-banner--sent", "Ocorrência enviada");
        } else {
            showSendBanner("send-banner--offline", "Ocorrência salva localmente");
        }
        form.reset();
        sku.focus();
    }

    // Callback para executar após confirmar
    let pendingSave = null;

    qtyModalConfirm?.addEventListener("click", () => {
        if (typeof pendingSave === "function") pendingSave();
        pendingSave = null;
        closeQtyModal();
    });

    // ===================== Submit ====================
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const errors = validateFields();
        if (errors.length > 0) {
            showSendBanner("send-banner--error", `Falha ao enviar: ${errors[0].msg}`);
            errors[0].field.focus();
            return;
        }

        // Abre modal para confirmar qualquer quantidade
        const qtyValue = qty.value.trim();

        pendingSave = () => finalizeSave();

        const opened = openQtyModal(qtyValue);
        if (!opened){
            // Se por algum motivo não existir modal, salva direto
            finalizeSave();
        }
    });
});