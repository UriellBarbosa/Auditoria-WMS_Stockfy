document.addEventListener("DOMContentLoaded", () => {
  // Variável para armazenar todas as ocorrências carregadas
  let allOccurrences = [];

  // Função para resolver uma ocorrência
  async function resolveOccurrence(id) {
    const { error } = await window.supabaseClient
      .from("occurrences")
      .update({ status: "resolved" })
      .eq("id", id);

      // Verificar se houve erro na atualização
    if (error) {
      console.error("Erro ao resolver ocorrência:", error.message);
      alert("Erro ao resolver ocorrência. Tente novamente.");
      return;
    }

    // Recarregar as ocorrências após resolver
    loadOccurrences();
  }

  function getSelectedOccurrenceIds() {
    const selectedCheckboxes = document.querySelectorAll(".occurrence-checkbox:checked");

    return Array.from(selectedCheckboxes).map((checkbox) => checkbox.dataset.id);
  }

  async function resolveSelectedOccurrences() {
    console.log("resolveSelectedOccurrences foi chamada");

    const selectedIds = getSelectedOccurrenceIds();

    console.log("IDs selecionados:", selectedIds);

    if (!selectedIds.length) {
      alert("Selecione pelo menos uma ocorrência.");
      return;
    }

    const {error} = await window.supabaseClient
    .from("occurrences")
    .update({ status: "resolved" })
    .in("id", selectedIds);

    if (error) {
      console.error("Erro ao resolver ocorrências selecionadas:", error.message);
      alert("Erro ao resolver ocorrências selecionadas.");
      return;
    }

    loadOccurrences();
    
  }

  // Função para carregar as ocorrências do banco de dados
  async function loadOccurrences() {
    const profile = window.currentProfile;
    const occurrencesList = document.getElementById("occurrencesList");

    console.log("loadOccurrences iniciou");
    console.log("currentProfile:", profile);
    console.log("occurrencesList encontrado:", !!occurrencesList);

    // Verificar se o perfil e a lista de ocorrências estão disponíveis
    if (!profile || !occurrencesList) return;

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
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Erro ao carregar ocorrências
        </div>
      `;
      return;
    }
  
    // Armazenar as ocorrências carregadas
    allOccurrences = data || [];

    applyFilters();
  }

    // função que renderiza a tabela
    function renderOccurrences(data) {
      const occurrencesList = document.getElementById("occurrencesList");

      if (!occurrencesList) return;

      if (!data || data.length === 0) {
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

      console.log("Processando ocorrência:", occurrence);

      return `
        <div class="table__row">
          <span>
            <input type="checkbox" class="occurrence-checkbox" data-id="${occurrence.id}"/>
          </span>
          <span>${sku}</span>
          <span>${address}</span>
          <span>${areaLabel}</span>
          <span>${quantity}</span>
          <span>${note}</span>
          <span>
            <span class="status-badge status-badge--${status}">
            ${status}</span>
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

    // Adicionar event listeners aos botões de resolver
    const resolveButtons = document.querySelectorAll(".btn--resolve");
    
    resolveButtons.forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", async () => {
        const occurrenceId = button.dataset.id;
          await resolveOccurrence(occurrenceId);
      });
    });
  }

  // Função para aplicar os filtros de status e SKU
  function applyFilters() {
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

    renderOccurrences(filteredOccurrences);
    }

  document.getElementById("statusFilter")?.addEventListener("change", applyFilters);
  document.getElementById("skuFilter")?.addEventListener("input", applyFilters);
  document.getElementById("resolveSelectedButton")?.addEventListener("click", resolveSelectedOccurrences);

  // seleção de todas as checkboxes
    const selectAll = document.getElementById("selectAllOccurrences");

    if (selectAll) {
      selectAll.checked = false;

      selectAll.onchange = () => {
        const rowCheckboxes = document.querySelectorAll(".occurrence-checkbox");

        rowCheckboxes.forEach((checkbox) => {
          checkbox.checked = selectAll.checked;
        });

        console.log("selectAll clicado:", selectAll.checked);
        console.log("checkboxes encontrados:", document.querySelectorAll(".occurrence-checkbox").length);
      };
    }

  if (window.currentProfile) {
    loadOccurrences();
  }

  document.addEventListener("profileLoaded", () => {
    loadOccurrences();
    });
});