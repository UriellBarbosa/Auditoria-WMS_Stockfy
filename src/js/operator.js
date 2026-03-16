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

  // ======================== Banner ======================
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

  // ============================ Sincronização Offline ==============================
async function syncOfflineOccurrences() {
  const stored = localStorage.getItem("offline_occurrences");

  if (!stored) return;

  const occurrences = JSON.parse(stored);

  if (!occurrences.length) return;

  console.log("Sincronizando ocorrências offline...", occurrences);

  showSendBanner("send-banner--offline", "Iniciando sincronização de ocorrências offline...");

  // Remove o ID local (se existir) para evitar conflitos com o Supabase
  const sanitizedOccurrences = occurrences.map(({created_at_local, ...rest}) => rest);
  
  const {error} = await window.supabaseClient
    .from("occurrences")
    .insert(sanitizedOccurrences);

  if (error) {
    console.error("Erro ao sincronizar ocorrências offline:", error.message);
    showSendBanner("send-banner--error", `Falha na sincronização: ${error.message}`);
    return;
  }

  localStorage.removeItem("offline_occurrences");
  console.log("Ocorrências offline sincronizadas");

  showSendBanner("send-banner--sent", "Ocorrências offline sincronizadas.");
}

  // ========================= Modal =======================
  let modalOpen = false;
  let pendingSave = null;

  function openQtyModal(value) {
    document.body.classList.add("no-scroll");
    qtyModalValue.textContent = String(value);
    qtyModal.classList.remove("modal--hidden");
    modalOpen = true;
    qtyModalConfirm.focus();
  }

  function closeQtyModal(focusQty = true) {
    document.body.classList.remove("no-scroll");
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
      const active = document.activeElement;
      const focusInsideModal = qtyModal && active && qtyModal.contains(active);

        if (!focusInsideModal) return; // só confirma se o foco já estiver dentro do modal

        e.preventDefault();
      qtyModalConfirm.click();
    }
  });

  // ============================ Fluxo Enter =======================
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
    e.stopPropagation(); // evita que o form capture o Enter e envie sem validar
    
    // Valida antes de abrir modal
    const errors = validateFields();
    if (errors.length > 0) {
        showSendBanner("send-banner--error", `Falha ao enviar: ${errors[0].msg}`);
        errors[0].field.focus();
        return;
    }

    // Abre modal de confirmação apertando Enter no campo de quantidade
    pendingSave = finalizeSave; // só salva quando confirmar

    setTimeout(() => openQtyModal(qty.value.trim()), 100);
  });

  // ============================ Validação ===========================
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

  // ============================= Salvar ===========================
  async function finalizeSave() {
    const profile = window.currentProfile;

    if (!profile) {
      showSendBanner("send-banner--error", "Erro: perfil do usuário não encontrado. Recarregue a página.");
      return;
    }

    const payload = {
      company_id: profile.company_id,
      created_by: profile.id,
      area_label: document.getElementById("area")?.value || null,
      sku: sku.value.trim(),
      address: address.value.trim(),
      quantity: Number(qty.value.trim()),
      note: document.getElementById("note")?.value.trim() || null,
      status: "pending",
      created_at_local: new
      Date().toISOString(),
    };

    // Offline: salva no localmente e sincroniza depois
    if (!navigator.onLine) {
      const offlineOccurrences = JSON.parse(localStorage.getItem("offline_occurrences")
      || "[]");
      offlineOccurrences.push(payload);

      localStorage.setItem("offline_occurrences",
        JSON.stringify(offlineOccurrences));

      showSendBanner("send-banner--offline", "Ocorrência salva localmente.");
      form.reset();
      sku.focus();
      return;
    }

    // Online: salva no Supabase
    const {error} = await
    window.supabaseClient
  .from("occurrences")
  .insert([payload]);

  if (error) {
    console.error("Erro ao salvar ocorrência:", error.message);
    showSendBanner("send-banner--error", `Falha ao enviar: ${error.message}`);
    return;
  }

    showSendBanner("send-banner--sent", "Ocorrência enviada");

    form.reset();
    sku.focus();
  }

  // ============================= Submit ==============================
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

  // Sincroniza ocorrências offline pendentes ao carregar a página
  syncOfflineOccurrences();

  // Sincroniza ocorrências offline quando a conexão for restaurada
  window.addEventListener("online", () => {
  console.log("Conexão restaurada. Iniciando sincronização de ocorrências offline...");
  syncOfflineOccurrences();
  });
});