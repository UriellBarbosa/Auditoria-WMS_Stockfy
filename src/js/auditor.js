document.addEventListener("DOMContentLoaded", () => {
  async function loadOccurrences() {
    const profile = window.currentProfile;
    const occurrencesList = document.getElementById("occurrencesList");

    if (!profile || !occurrencesList) return;

    const { data, error } = await window.supabaseClient
      .from("occurrences")
      .select("*")
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar ocorrências:", error.message);
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Erro ao carregar ocorrências
        </div>
      `;
      return;
    }

    if (!data || !data.length) {
      occurrencesList.innerHTML = `
        <div class="table__empty">
          Nenhuma ocorrência encontrada
        </div>
      `;
      return;
    }

    occurrencesList.innerHTML = "";

    data.forEach((occurrence) => {
      const row = document.createElement("div");
      row.className = "table__row";

      const createdAt = new Date(occurrence.created_at).toLocaleString("pt-BR");

      row.innerHTML = `
        <span>${occurrence.sku}</span>
        <span>${occurrence.address}</span>
        <span>${occurrence.area_label || "-"}</span>
        <span>${occurrence.quantity}</span>
        <span>${occurrence.status}</span>
        <span>${createdAt}</span>
      `;

      occurrencesList.appendChild(row);
    });
  }

  if (window.currentProfile) {
    loadOccurrences();
  }

  document.addEventListener("profileLoaded", () => {
    loadOccurrences();
  });
});