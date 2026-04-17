document.addEventListener("DOMContentLoaded", () => {

  let allOccurrences = [];
  let currentPeriod = "day";
  let currentPage = 1;
  const itemsPerPage = 10;

// ===================== Banner =====================
const dashBanner = document.getElementById("dashBanner");
const dashBannerText = document.getElementById("dashBannerText");

function hideDashBanner() {
  if (!dashBanner || !dashBannerText) return;
    dashBanner.classList.add("send-banner--hidden");
    dashBanner.classList.remove("send-banner--sent", "send-banner--error");
    dashBannerText.textContent = "";
}

function showDashBanner(typeClass, message) {
  if (!dashBanner || !dashBannerText) return;
    dashBanner.classList.remove("send-banner--hidden");
    dashBanner.classList.remove("send-banner--sent", "send-banner--error");
    dashBanner.classList.add(typeClass);
    dashBannerText.textContent = message;

    window.clearTimeout(showDashBanner._t);
    showDashBanner._t = window.setTimeout(hideDashBanner, 2500);
}

// ===================== Spinner =====================
function showSpinner() {
  const spinner = document.getElementById("dashLoadingSpinner");
  const list = document.getElementById("dashOccurrencesList");
  if (spinner) spinner.style.display = "flex";
  if (list) list.style.display = "none";
}

function hideSpinner() {
  const spinner = document.getElementById("dashLoadingSpinner");
  const list = document.getElementById("dashOccurrencesList");
  if (spinner) spinner.style.display = "none";
  if (list) list.style.display = "flex";
}

// ===================== Período =====================
function getDateRange(period) {
  const now = new Date();
  const start = new Date();

  if (period === "day") {
      start.setHours(0, 0, 0, 0);
  } else if (period === "week") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
  } else if (period === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
  }

  return start.toISOString();
}

// ===================== Carregar dados =====================
async function loadDashboard() {
  const profile = window.currentProfile;
  const list = document.getElementById("dashOccurrencesList");

  if (!profile || !list) return;

  showSpinner();

  const startDate = getDateRange(currentPeriod);

  const { data, error } = await window.supabaseClient
    .from("occurrences")
    .select("*, areas(name)")
    .eq("created_by", profile.id)
    .gte("created_at", startDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao carregar dashboard:", error.message);
    showDashBanner("send-banner--error", "Erro ao carregar ocorrências.");

    if (document.getElementById("dashLoadingSpinner")) {
      document.getElementById("dashLoadingSpinner").style.display = "none"
    }
    list.style.display = "flex";
    list.innerHTML = `<div class="table__empty">Erro ao carregar ocorrências.</div>`
    return;
  }

  allOccurrences = data || [];
  updateCards();
  renderTable();
}

  // ===================== Cards =====================
  function updateCards() {
    const total = allOccurrences.length;
    const pending = allOccurrences.filter(o => o.status === "pending").length;
    const resolved = allOccurrences.filter(o => o.status === "resolved").length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("pendingCount").textContent = pending;
    document.getElementById("resolvedCount").textContent = resolved;
  }

  // ===================== Tabela =====================
  function renderTable() {
    const list = document.getElementById("dashOccurrencesList");
    const spinner = document.getElementById("dashLoadingSpinner")

    if (!list) return;

    // Esconde spinner e mostra lista sempre que renderizar
    if (spinner) spinner.style.display = "none";
    list.style.display = "flex";

    const statusLabel = {
      pending: "Pendente",
      resolved: "Resolvida",
    };

    const start = (currentPage - 1) * itemsPerPage;
    const paginated = allOccurrences.slice(start, start + itemsPerPage);

    if (!paginated.length) {
      list.innerHTML = `<div class="table__empty">Nenhuma ocorrência encontrada.</div>`;
      document.getElementById("dashPagination").innerHTML = "";
      return;
    }

    list.innerHTML = paginated.map(o => {
      const date = o.created_at ? new Date(o.created_at).toLocaleString("pt-BR") : "-";
      const area = o.areas?.name || o.area_label || "-";
      const status = o.status ?? "pending";

      return `
        <div class="table__row">
          <span>${o.sku ?? "-"}</span>
          <span>${o.address ?? "-"}</span>
          <span>${area}</span>
          <span>${o.quantity ?? "-"}</span>
          <span>
            <span class="status-badge status-badge--${status}">
              ${statusLabel[status] ?? status}
            </span>
          </span>
          <span>${date}</span>
        </div>
      `;
    }).join("");

    renderPagination();
  }

  // ===================== Paginação =====================
  function renderPagination() {
    const pagination = document.getElementById("dashPagination");

    if (!pagination) return;

    const totalPages = Math.ceil(allOccurrences.length / itemsPerPage);

    if (totalPages <= 1) {
      pagination.innerHTML = "";
      return;
    }

    let html = `<button class="pagination__button" ${currentPage === 1 ? "disabled" : ""} data-page="prev">←</button>`;

    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="pagination__button ${i === currentPage ? "pagination__button--active" : ""}" data-page="${i}">${i}</button>`;
    }

    html += `<button class="pagination__button" ${currentPage === totalPages ? "disabled" : ""} data-page="next">→</button>`;

    pagination.innerHTML = html;

    pagination.querySelectorAll(".pagination__button").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.page;

        if (action === "prev" && currentPage > 1) currentPage--;
        else if (action === "next" && currentPage < totalPages) currentPage++;
        else if (!isNaN(Number(action))) currentPage = Number(action);

        renderTable();
      });
    });
  }

  // ===================== Botões de período =====================
  document.querySelectorAll(".btn--period").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn--period").forEach(b => {
        b.classList.remove("btn--period--active");
      });

      btn.classList.add("btn--period--active");
      currentPeriod = btn.dataset.period;
      currentPage = 1;
      loadDashboard();
    });
  });

  // ===================== Inicialização =====================
  if (window.currentProfile) {
    loadDashboard();
  }

  document.addEventListener("profileLoaded", () => {
    loadDashboard();
  });

});