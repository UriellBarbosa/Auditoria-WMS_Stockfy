document.addEventListener("DOMContentLoaded", () => {
  // ------------------------- Banner --------------------------
  const auditBanner = document.getElementById("auditBanner");
  const auditBannerText = document.getElementById("auditBannerText");

  function hideAuditBanner() {
    if (!auditBanner || !auditBannerText) return;
    auditBanner.classList.add("send-banner--hidden");
    auditBanner.classList.remove("send-banner--sent", "send-banner--error");
    auditBannerText.textContent = "";
  }

  function showAuditBanner(typeClass, message) {
    if (!auditBanner || !auditBannerText) return;
    auditBanner.classList.remove("send-banner--hidden");
    auditBanner.classList.remove("send-banner--sent", "send-banner--error");
    auditBanner.classList.add(typeClass);
    auditBannerText.textContent = message;

    window.clearTimeout(showAuditBanner._t);
    showAuditBanner._t = window.setTimeout(hideAuditBanner, 2500);
  }
  
  // --------------------- SPINNER ------------------------
  function showSpinner () {
    const spinner = document.getElementById("loadingSpinner");
    const list = document.getElementById("occurrencesList");

    if (spinner) spinner.style.display = "flex";
    if (list) list.style.display = "none";
  }

  function hideSpinner () {
    const spinner = document.getElementById("loadingSpinner");
    const list = document.getElementById("occurrencesList");

    if (spinner) spinner.style.display = "none";
    if (list) list.style.display = "flex";
  }
  // --------------------- Audit Log ---------------------------
  async function insertAuditLog(action, entityId, details = {}) {
    const profile = window.currentProfile;

    if (!profile) return;

    const { error } = await window.supabaseClient
      .from("audit_logs")
      .insert({
        company_id: profile.company_id,
        user_id: profile.id,
        action: action,
        entity: "occurrences",
        entity_id: entityId,
        details: details,
      });

      if (error) {
        console.warn("[audit_logs] Erro ao registrar log:", error.message);
      }
  }

  // --------------------- Ocorrências -------------------------
  // Variável para armazenar todas as ocorrências carregadas
  let allOccurrences = [];
  let currentPage = 1;
  const itemsPerPage = 10;

  // Função para resolver uma ocorrência
  async function resolveOccurrence(id) {
    const { error } = await window.supabaseClient
      .from("occurrences")
      .update({ status: "resolved" })
      .eq("id", id);

      // Verificar se houve erro na atualização
    if (error) {
      console.error("Erro ao resolver ocorrência:", error.message);
      showAuditBanner("send-banner--error", "Erro ao resolver ocorrência. Tente novamente.");
      return;
    }

    await insertAuditLog("resolve", id, { source: "individual" });

    // Recarregar as ocorrências após resolver
    loadOccurrences();

  }

  // função para selecionar os Ids de cada ocorrência
  function getSelectedOccurrenceIds() {
    const selectedCheckboxes = document.querySelectorAll(".occurrence-checkbox:checked");

    return Array.from(selectedCheckboxes).map((checkbox) => checkbox.dataset.id);
  }

// ------------------- MODAL DE CONFIRMAÇÃO (TEXTO) ---------------------

  // Função para montar texto dinâmico no modal
  function updateDeleteModalContent() {
    const selectedIds = getSelectedOccurrenceIds();
    const modalText = document.getElementById("deleteModalText");

    console.log("ModalText:", modalText);
    console.log("IDs selecionados:", selectedIds);

    if (!modalText || !selectedIds.length) return;

    const selectedOccurrences = allOccurrences.filter((occurrence) => selectedIds.includes(occurrence.id));

    if (selectedOccurrences.length === 1) {
      const occurrence = selectedOccurrences[0];
      const areaLabel = occurrence.areas?.name || occurrence.area_label || "-";

      modalText.innerHTML = `Tem certeza que deseja excluir esta ocorrência?<br><br><strong>SKU:</strong>
      ${occurrence.sku ?? "-"}<br><strong>Endereço:</strong> ${occurrence.address ?? "-"}<br><strong>Área:</strong> ${areaLabel}`;
      return;
    }

    modalText.innerHTML = `Tem certeza que deseja excluir <strong>${selectedOccurrences.length}</strong> ocorrência(s) selecionada(s)?`;
  }

// -------------------- BOTÕES DE RESOLUÇÃO -----------------------

  // Função para resolver ocorrências selecionadas
  async function resolveSelectedOccurrences() {
    console.log("resolveSelectedOccurrences foi chamada");

    const selectedIds = getSelectedOccurrenceIds();

    console.log("IDs selecionados:", selectedIds);

    if (!selectedIds.length) {
      showAuditBanner("send-banner--error", "Selecione pelo menos uma ocorrência.");
      return;
    }

    const {error} = await window.supabaseClient
    .from("occurrences")
    .update({ status: "resolved" })
    .in("id", selectedIds);

    if (error) {
      console.error("Erro ao resolver ocorrências selecionadas:", error.message);
      showAuditBanner("send-banner--error", "Erro ao resolver ocorrências selecionadas.");
      return;
    }

    for (const id of selectedIds) {
      await insertAuditLog("resolve", id, { source: "bulk" });
    }

    loadOccurrences();
    
  }

  // Função para excluir ocorrências selecionadas
  async function deleteSelectedOccurrences() {
    const selectedIds = getSelectedOccurrenceIds();
    
    if (!selectedIds.length) {
      showAuditBanner("send-banner--error", "Selecione pelo menos uma ocorrência.");
      return;
    }

    const { error } = await window.supabaseClient
        .from("occurrences")
        .delete()
        .in("id", selectedIds);

    if (error) {
      console.error("Erro ao excluir ocorrências selecionadas:", error.message);
      showAuditBanner("send-banner--error", "Erro ao excluir ocorrências selecionadas.");
      return;
    }

    for (const id of selectedIds) {
      await insertAuditLog("delete", id, { source: "bulk" });
    }

    loadOccurrences();

  }

// ------------------- MODAL DE CONFIRMAÇÃO ----------------------

  // Funções para controle do modal
  function openDeleteModal() {
    const deleteModal = document.getElementById("deleteModal");

    deleteModal?.classList.remove("modal--hidden");
  }

  function closeDeleteModal() {
    const deleteModal = document.getElementById("deleteModal");
    const modalText = document.getElementById("deleteModalText");

    deleteModal?.classList.add("modal--hidden");

    if (modalText) {
      modalText.textContent = "Tem certeza que deseja excluir a(s) ocorrência(s) selecionada(s)?"
    }
  }

// ------------------- AÇÕES EM LOTE ----------------------

  // Ação em lote para seleção múltipla
  function updateBulkActionsVisibility() {
    const bulkActions = document.getElementById("bulkActions");
    const selectedCount = document.getElementById("selectedCount");
    const selectedIds = getSelectedOccurrenceIds();

    if (!bulkActions || !selectedCount) return;

    if (!selectedIds.length) {
      bulkActions.classList.add("auditor-actions--hidden");
      selectedCount.textContent = "0 selecionadas";
      return;
    }

    bulkActions.classList.remove("auditor-actions--hidden");
    selectedCount.textContent = `${selectedIds.length} selecionada(s)`;
  }

// --------------------- BANCO DE DADOS (OCORRÊNCIAS) -------------------------

  // Função para carregar as ocorrências do banco de dados
  async function loadOccurrences() {
    const profile = window.currentProfile;
    const occurrencesList = document.getElementById("occurrencesList");

    console.log("loadOccurrences iniciou");
    console.log("currentProfile:", profile);
    console.log("occurrencesList encontrado:", !!occurrencesList);

    // Verificar se o perfil e a lista de ocorrências estão disponíveis
    if (!profile || !occurrencesList) return;

    showSpinner();

    // Buscar as ocorrências do banco de dados
    const { data, error } = await window.supabaseClient
      .from("occurrences")
      .select(`*, areas (name)`)
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    console.log("occurrences data:", data);
    console.log("occurrences error:", error);

    // Limpar a lista antes de carregar os dados
    if (error) {
      console.error("Erro ao carregar ocorrências:", error.message);
      hideSpinner();
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Erro ao carregar ocorrências
        </div>
      `;
      return;
    }
  
    // Armazenar as ocorrências carregadas
    allOccurrences = data || [];

    hideSpinner();
    applyFilters();
  }

// --------------------- TABELA ------------------------

    // função que renderiza a tabela
    function renderOccurrences(data) {
      const occurrencesList = document.getElementById("occurrencesList");

      if (!occurrencesList) return;

      if (!data || data.length === 0) {
        hideSpinner();
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Nenhuma ocorrência encontrada
        </div>
      `;
      return;
    }
    
      const rowsHtml = data.map((occurrence) => {
      const createdAt = occurrence.created_at ? new Date(occurrence.created_at)
      .toLocaleString("pt-BR") : "-";
      const sku = occurrence.sku ?? "-";
      const address = occurrence.address ?? "-";
      const areaLabel = occurrence.areas?.name || occurrence.area_label || "-";
      const quantity = occurrence.quantity ?? "-";
      const note = occurrence.note?.trim() ? occurrence.note : "-";
      const status = occurrence.status ?? "pending";
      const isResolved = status === "resolved";
      const statusLabel = {
        pending: "Pendente",
        resolved: "Resolvida",
      };

      console.log("Processando ocorrência:", occurrence);

      return `
        <div class="table__row">
          <span>
            <input type="checkbox" class="occurrence-checkbox" data-id="${occurrence.id}"
            ${isResolved ? "disabled" : ""}/>
          </span>
          <span>${sku}</span>
          <span>${address}</span>
          <span>${areaLabel}</span>
          <span>${quantity}</span>
          <span>${note}</span>
          <span>
            <span class="status-badge status-badge--${status}">
            ${statusLabel[status] ?? status}</span>
          </span>
          <span>${createdAt}</span>
          <span>
          <button class="btn--resolve" data-id="${occurrence.id}" ${isResolved ? "disabled" : ""}>${isResolved ? "Resolvida" : "Resolver"}
          </button>
          </span>
          </div>
      `;
    }).join("");

    // Atualizar o conteúdo da lista de ocorrências
    occurrencesList.innerHTML = rowsHtml;
    hideSpinner();

    // Adicionar event listeners aos botões de resolver
    const resolveButtons = document.querySelectorAll(".btn--resolve");
    
    resolveButtons.forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", async () => {
        const occurrenceId = button.dataset.id;
          await resolveOccurrence(occurrenceId);
      }); 
    });

    // Atualiza ação em lote para checbok individual
    const rowCheckboxes = document.querySelectorAll(".occurrence-checkbox");

    rowCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        updateBulkActionsVisibility();

        const selectableCheckboxes = document.querySelectorAll(".occurrence-checkbox:not(:disabled)");
        const checkedCheckboxes = document.querySelectorAll(".occurrence-checkbox:not(:disabled):checked");
        const selectAll = document.getElementById("selectAllOccurrences");

        if (selectAll) {
          selectAll.checked = selectableCheckboxes.length > 0 &&
          selectableCheckboxes.length ===
          checkedCheckboxes.length;
        }
      });
    });

    // Garante que a barra de ação em lote esconda ao recarregar a tabela
    updateBulkActionsVisibility();

  }

// -------------------- FILTROS ---------------------

  // Função para aplicar os filtros de status e SKU
  function applyFilters() {
    showSpinner();

    const statusFilter = document.getElementById("statusFilter")?.value || "all";
    const skuFilter = document.getElementById("skuFilter")?.value.trim().toLowerCase() || "";

    let filteredOccurrences = [...allOccurrences];

    if (statusFilter !== "all") {
      filteredOccurrences = filteredOccurrences.filter((occurrence) => occurrence.status === statusFilter);
    }

    if (skuFilter) {
      filteredOccurrences = filteredOccurrences.filter((occurrence) => (occurrence.sku || "")
    .toLowerCase().includes(skuFilter)
      );
    }

    const totalPages = Math.ceil(filteredOccurrences.length / itemsPerPage);

    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }

    if (totalPages === 0) {
      currentPage = 1;
    }

    const paginatedOccurrences = paginateOccurrences(filteredOccurrences);

    renderOccurrences(paginatedOccurrences);
    renderPagination(filteredOccurrences);

    }

// ------------------ PÁGINAS ------------------

  // Função que divide os dados por páginas
  function paginateOccurrences(data) {
    const starIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = starIndex + itemsPerPage;

    return data.slice(starIndex, endIndex);
  }

  // Função que desenha os botões
  function renderPagination(data) {
    const pagination = document.getElementById("pagination");

    if (!pagination) return;

    const totalPages = Math.ceil(data.length / itemsPerPage);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let buttonsHtml = `<button
    class="pagination__button"
    ${currentPage === 1 ? "disabled" : ""}
    data-page="prev"> ← </button>`;

    for (let page = 1; page <= totalPages; page++) {
      buttonsHtml += `<button class="pagination__button ${page === currentPage ? "pagination__button--active" : ""}" data-page="${page}"> ${page}</button>`;
    }

  buttonsHtml += `<button
    class="pagination__button"
    ${currentPage === totalPages ? "disabled" : ""}
    data-page="next"> → </button>`;

    pagination.innerHTML = buttonsHtml;

    pagination.querySelectorAll(".pagination__button").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.page;

        if (action === "prev" && currentPage > 1) {
          currentPage--;
        } else if (action === "next" && currentPage < totalPages) {
          currentPage++;
        } else if (!isNaN(Number(action))) {
          currentPage = Number(action);
        }

        applyFilters();
      });
    });
  }

  // ---------------------- LISTENERS -------------------------

    // Botões de filtros
  document.getElementById("statusFilter")?.addEventListener("change", () => {
    currentPage = 1;
    applyFilters();
  });
  document.getElementById("skuFilter")?.addEventListener("input", () => {
    currentPage = 1;
    applyFilters();
  });
    // Botão de resolver em lote
  document.getElementById("resolveSelectedButton")?.addEventListener("click", resolveSelectedOccurrences);
    // Botão de excluir
  document.getElementById("deleteSelectedButton")?.addEventListener("click", () => {
    console.log("Clique em excluir dectado");
    const selectedIds = getSelectedOccurrenceIds();

    if (!selectedIds.length) {
      showAuditBanner("send-banner--error", "Selecione pelo menos uma ocorrência.");
      return;
    }

    updateDeleteModalContent();

    console.log("Atualizando conteúdo do modal")

    openDeleteModal();
  });
    // Botões do modal de confimação (excluir)
  document.getElementById("deleteModalCancel")?.addEventListener("click", closeDeleteModal);
  document.getElementById("deleteModalConfirm")?.addEventListener("click", async () => {
    await deleteSelectedOccurrences();

    closeDeleteModal();
  });
document.getElementById("deleteModal")?.addEventListener("click", (event) => {
  const target = event.target;

  if (target instanceof HTMLElement && target.dataset.deleteClose === "true") {
    closeDeleteModal();
  }
});

// ------------------------ CHECKBOX ------------------------

// seleção de todas as checkboxes
  const selectAll = document.getElementById("selectAllOccurrences");

  if (selectAll) {
    selectAll.checked = false;

    selectAll.onchange = () => {
      const rowCheckboxes = document.querySelectorAll(".occurrence-checkbox:not(:disabled)");

      rowCheckboxes.forEach((checkbox) => {
        checkbox.checked = selectAll.checked;
      });

      console.log("selectAll clicado:", selectAll.checked);
      console.log("checkboxes encontrados:", document.querySelectorAll(".occurrence-checkbox").length);

      updateBulkActionsVisibility();
    };
  }

  if (window.currentProfile) {
    loadOccurrences();
  }

  document.addEventListener("profileLoaded", () => {
    loadOccurrences();
    });

});