document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const sku = document.getElementById("sku");
  const address = document.getElementById("address");
  const qty = document.getElementById("qty");

  // Banner de envio (pop-up)
  const sendBanner = document.getElementById("sendBanner");
  const sendBannerText = document.getElementById("sendBannerText");

  // Modal confirmação de quantidade
  const qtyModal = document.getElementById("qtyModal");
  const qtyModalValue = document.getElementById("qtyModalValue");
  const qtyModalCancel = document.getElementById("qtyModalCancel");
  const qtyModalConfirm = document.getElementById("qtyModalConfirm");

  if (!form || !sku || !address || !qty) {
    console.warn("[operator.js] Form/inputs não encontrados. Verifique IDs (sku, address, qty).");
    return;
  }

  // ===== Banner helpers =====
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

  // ===== Modal helpers =====
  let modalOpen = false;

  function openQtyModal(value) {
    if (!qtyModal || !qtyModalValue || !qtyModalConfirm) return false;
    qtyModalValue.textContent = String(value);
    qtyModal.classList.remove("modal--hidden");
    modalOpen = true;
    qtyModalConfirm.focus();
    return true;
  }

  function closeQtyModal(focusQty = true) {
    if (!qtyModal) return;
    qtyModal.classList.add("modal--hidden");
    modalOpen = false;
    if (focusQty) qty.focus();
  }

  // Fecha clicando no backdrop
  qtyModal?.addEventListener("click", (e) => {
    const t = e.target;
    if (t instanceof HTMLElement && t.dataset.close === "true") {
      closeQtyModal(true);
    }
  });

  qtyModalCancel?.addEventListener("click", () => closeQtyModal(true));

  // ESC fecha modal / Enter confirma
  document.addEventListener("keydown", (e) => {
    if (!modalOpen) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeQtyModal(true);
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      qtyModalConfirm?.click();
      return;
    }
  });

  // ===== Fluxo Enter nos campos (só quando modal NÃO está aberto) =====
  function isEnter(e) {
    return e.key === "Enter";
  }

  sku.focus();

  sku.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (!isEnter(e)) return;
    e.preventDefault();
    address.focus();
  });

  address.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (!isEnter(e)) return;
    e.preventDefault();
    qty.focus();
  });

  qty.addEventListener("keydown", (e) => {
    if (modalOpen) return;
    if (!isEnter(e)) return;
    e.preventDefault();
    form.requestSubmit();
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

  // ===== “Salvar” (simulado) =====
  function finalizeSave() {
    if (navigator.onLine) {
      showSendBanner("send-banner--sent", "Ocorrência enviada");
    } else {
      showSendBanner("send-banner--offline", "Ocorrência salva localmente");
    }
    form.reset();
    sku.focus();
  }

  // Confirmação executa o save pendente
  let pendingSave = null;

  qtyModalConfirm?.addEventListener("click", () => {
    if (typeof pendingSave === "function") pendingSave();
    pendingSave = null;
    closeQtyModal(false); // não precisa focar qty, porque já limpou e vai pro SKU
  });

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

    // Abre modal com a quantidade REAL digitada
    const qtyValue = qty.value.trim();

    pendingSave = finalizeSave;

    const opened = openQtyModal(qtyValue);
    if (!opened) {
      // Se modal não existir, salva direto
      finalizeSave();
    }
  });
});