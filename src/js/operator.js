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

    // ===================== Banner helpers ===========================
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

    // =========================== Modal helpers =========================
    function openQtyModal(value) {
        if (!qtyModal || !qtyModalValue) return false;
        qtyModalValue.textContent = String(value);
        qtyModal.classList.remove("modal--hidden");
        // Deley para garantir o foco no botão confirmar
        setTimeout(() => qtyModalConfirm?.focus(), 50);

        // Adiciona um escutador temporário para o Enter no modal
        const handleModalEnter = (e) => {
            if (e.key === "Enter"){
                e.preventDefault();
                qtyModalConfirm.click(); // Simula click ao confirmar
                window.removeEventListener("keydown", handleModalEnter);
            }
        };
        window.addEventListener("keydown", handleModalEnter);
        return true;
    }

    function hideModal(){
        if (qtyModal){
            qtyModal.classList.add("modal--hiden");
            qtyModal.style.display = 'none';
            setTimeout(() => sku.focus(), 150);
        }
    }

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !qtyModal.classList.contains("modal--hidden")){
            closeQtyModal();
            qty.focus();
        }
    });

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

    // ======================== Fluxo Enter ===========================
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

    // ======================== Validação =============================
    function validateFields() {
        const errors = [];

        if (!sku.value.trim()) errors.push({field: sku, msg: "SKU não preenchido"});
        if (!address.value.trim()) errors.push({field: address, msg: "Endereço não preenchido"});

        const qtyRaw = qty.value.trim().replace(',', '.'); // Aceita vírgula e converte para ponto
        const n = Number(qtyRaw);

        if (qtyRaw === "" || isNaN(n)) {
            errors.push({field: qty, msg: "Quantidade inválida"});
        } else {
                if (!Number.isInteger(n)) errors.push({field: qty, msg: "Quantidade deve ser um número inteiro"});
                if (n < 0) errors.push({field: qty, msg: "Quantidade não pode ser negativa"});
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
        setTimeout(() => sku.focus(), 100);
    }

    // Callback para executar após confirmar
    let pendingSave = null;

    qtyModalConfirm?.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof pendingSave === "function") {
            pendingSave();}
        pendingSave = null;
        hideModal();
    });

    // =========================== Submit =================================
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
        pendingSave = () => {finalizeSave()};

        const opened = openQtyModal(qtyValue);
        if (!opened){
            // Se por algum motivo não existir modal, salva direto
            finalizeSave();
        }
    });
});