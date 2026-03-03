console.log("[operator.js] Script carregado");
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const sku = document.getElementById("sku");
  const address = document.getElementById("address");
  const qty = document.getElementById("qty");

  // Banner envio (pop-up)
  const sendBanner = document.getElementById("sendBanner");
  const sendBannerText = document.getElementById("sendBannerText");

  // Modal
  const qtyModal = document.getElementById("qtyModal");
  const qtyModalValue = document.getElementById("qtyModalValue");
  const qtyModalCancel = document.getElementById("qtyModalCancel");
  const qtyModalConfirm = document.getElementById("qtyModalConfirm");

  if (!form || !sku || !address || !qty) {
    console.warn("[operator.js] Form/inputs não encontrados (sku/address/qty).");
    return;
  }

  if (!qtyModal || !qtyModalValue || !qtyModalCancel || !qtyModalConfirm) {
    console.warn("[operator.js] Elementos do modal não encontrados. Verifique IDs do modal.");
    return;
  }

  // ===== Banner =====
  function hideSendBanner() {
    if (!sendBanner || !sendBannerText) return;
    sendBanner.classList.add("send-banner--hidden");
    sendBanner.classList.remove("send-banner--sent", "send-banner--offline", "send-banner--error");
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

  // ===== Modal =====
  let modalOpen = false;
  let pendingSave = null;

  function openQtyModal(value) {
    qtyModalValue.textContent = String(value);
    qtyModal.classList.remove("modal--hidden");
    modalOpen = true;
    qtyModalConfirm.focus();
  }

  function closeQtyModal(focusQty = true) {
    qtyModal.classList.add("modal--hidden");
    modalOpen = false;
    if (focusQty) qty.focus();
  }

  // Backdrop
  qtyModal.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.dataset.close === "true") {
      closeQtyModal(true);
    }
  });

  qtyModalCancel.addEventListener("click", () => closeQtyModal(true));

  qtyModalConfirm.addEventListener("click", () => {
    if (typeof pendingSave === "function") pendingSave();
    pendingSave = null;
    closeQtyModal(false);
  });

  // ESC fecha / Enter confirma
  document.addEventListener("keydown", (e) => {
    if (!modalOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeQtyModal(true);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      qtyModalConfirm.click();
    }
  });

  // ===== Fluxo Enter =====
  sku.focus();

  sku.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    address.focus();
  });

  address.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    qty.focus();
  });

  qty.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (e.key !== "Enter") return;
    e.preventDefault();
    
    // Valida antes de abrir modal
    const errors = validateFields();
    if (errors.length > 0) {
        showSendBanner("send-banner--error", `Falha ao enviar: ${errors[0].msg}`);
        errors[0].field.focus();
        return;
    }

    // Abre modal de confirmação apertando Enter no campo de quantidade
    pendingSave = finalizeSave; // só salva quando confirmar
    openQtyModal(qty.value.trim());
  });

  // ===== Validação =====
  function validateFields() {
    const errors = [];

    if (!sku.value.trim()) errors.push({ field: sku, msg: "SKU não preenchido" });
    if (!address.value.trim()) errors.push({ field: address, msg: "Endereço não preenchido" });

    const qtyRaw = qty.value.trim();
    if (!qtyRaw) {
      errors.push({ field: qty, msg: "Quantidade não preenchida" });
    } else {
      const n = Number(qtyRaw);
      if (!Number.isFinite(n)) errors.push({ field: qty, msg: "Quantidade inválida" });
      else {
        if (!Number.isInteger(n)) errors.push({ field: qty, msg: "Quantidade deve ser um número inteiro" });
        if (n < 0) errors.push({ field: qty, msg: "Quantidade não pode ser negativa" });
      }
    }

    return errors;
  }

  // ===== Salvar (simulado) =====
  function finalizeSave() {
    if (navigator.onLine) showSendBanner("send-banner--sent", "Ocorrência enviada");
    else showSendBanner("send-banner--offline", "Ocorrência salva localmente");

    form.reset();
    sku.focus();
  }

  // ===== Submit =====
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (modalOpen) return;

    const errors = validateFields();
    if (errors.length > 0) {
      showSendBanner("send-banner--error", `Falha ao enviar: ${errors[0].msg}`);
      errors[0].field.focus();
      return;
    }

    pendingSave = finalizeSave; // só salva quando confirmar
    openQtyModal(qty.value.trim());
  });
});