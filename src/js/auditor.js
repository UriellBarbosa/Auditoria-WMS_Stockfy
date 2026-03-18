document.addEventListener("DOMContentLoaded", () => {
  async function resolveOccurrence(Id) {
    const { error } = await window.supabaseClient
      .from("occurrences")
      .update({ status: "resolved" })
      .eq("id", Id);

    if (error) {
      console.error("Erro ao resolver ocorrência:", error.message);
      alert("Erro ao resolver ocorrência. Tente novamente.");
      return;
    }

    loadOccurrences();
  }

  async function loadOccurrences() {
    const profile = window.currentProfile;
    const occurrencesList = document.getElementById("occurrencesList");

    console.log("loadOccurrences iniciou");
    console.log("currentProfile:", profile);
    console.log("occurrencesList encontrado:", !!occurrencesList);

    if (!profile || !occurrencesList) return;

    const { data, error } = await window.supabaseClient
      .from("occurrences")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    console.log("occurrences data:", data);
    console.log("occurrences error:", error);

    if (error) {
      console.error("Erro ao carregar ocorrências:", error.message);
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Erro ao carregar ocorrências
        </div>
      `;
      return;
    }

    if (!data || !data.length === 0) {
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
      const area_label = occurrence.area?.label ?? "-";
      const quantity = occurrence.quantity ?? "-";
      const status = occurrence.status ?? "pending";
      const isResolved = status === "resolved";

      console.log("Processando ocorrência:", occurrence);
      
      return `
        <div class="table__row">
          <span>${sku}</span>
          <span>${address}</span>
          <span>${area_label}</span>
          <span>${quantity}</span>
          <span>
            <span class="status-badge status-badge--${status}">
            ${status}</span>
          </span>
          <span>${createdAt}</span>
          <span>
          <button class="btn--resolve" data-id="${occurrence.id}" ${isResolved ? "disabled" : ""}>${isResolved ? "Resolvida" : "Resolver"}</button>
          </span>
          </div>
      `;
    }).join("");

    occurrencesList.innerHTML = rowsHtml;

    const resolveButtons = document.querySelectorAll(".btn--resolve");

    resolveButtons.forEach((button) => {
      if (button.disabled) return;

      button.addEventListener("click", async () => {
        const occurrenceId = button.dataset.id;
          await
          resolveOccurrence(occurrenceId);
      });
    });
  }

  if (window.currentProfile) {
    loadOccurrences();
  }

  document.addEventListener("profileLoaded", () => {
    loadOccurrences();
  });
});