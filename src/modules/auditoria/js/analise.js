document.addEventListener("DOMContentLoaded", () => {

  const API_URL = "http://127.0.0.1:8000";

  let resultadoCompleto = null;

  // ===================== Banner =====================
  const analiseBanner = document.getElementById("analiseBanner");
  const analiseBannerText = document.getElementById("analiseBannerText");

  function hideAnaliseBanner() {
    if (!analiseBanner || !analiseBannerText) return;
    analiseBanner.classList.add("send-banner--hidden");
    analiseBanner.classList.remove("send-banner--sent", "send-banner--error");
    analiseBannerText.textContent = "";
  }

  function showAnaliseBanner(typeClass, message) {
    if (!analiseBanner || !analiseBannerText) return;
    analiseBanner.classList.remove("send-banner--hidden");
    analiseBanner.classList.remove("send-banner--sent", "send-banner--error");
    analiseBanner.classList.add(typeClass);
    analiseBannerText.textContent = message;
    window.clearTimeout(showAnaliseBanner._t);
    showAnaliseBanner._t = window.setTimeout(hideAnaliseBanner, 4000);
  }

  // ===================== Upload =====================
  const fileInput = document.getElementById("relatorioFile");
  const uploadText = document.getElementById("uploadText");
  const analisarBtn = document.getElementById("analisarBtn");

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
      uploadText.textContent = file.name;
      analisarBtn.disabled = false;
    } else {
      uploadText.textContent = "Clique para selecionar o arquivo Excel";
      analisarBtn.disabled = true;
    }
  });

  // ===================== Analisar =====================
  analisarBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    const profile = window.currentProfile;

    if (!file || !profile) return;

    // Mostra spinner e esconde resultado anterior
    document.getElementById("analiseSpinner").style.display = "flex";
    document.getElementById("analiseResultado").style.display = "none";
    analisarBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const url = new URL(`${API_URL}/analyze`);
      url.searchParams.append("company_id", profile.company_id);
      url.searchParams.append("user_id", profile.id);

      const response = await fetch(url.toString(), {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.detail || "Erro ao processar o arquivo.");
      }

      resultadoCompleto = await response.json();
      renderResultado(resultadoCompleto);
      showAnaliseBanner("send-banner--sent", "Análise concluída com sucesso!");

    } catch (error) {
      console.error("Erro na análise:", error);
      showAnaliseBanner("send-banner--error", `Erro: ${error.message}`);
    } finally {
      document.getElementById("analiseSpinner").style.display = "none";
      analisarBtn.disabled = false;
    }
  });

  // ===================== Renderizar resultado =====================
  function renderResultado(data) {
    const { produto, resumo, ranking_usuarios, operacoes_suspeitas, recomendacao_ia } = data;

    // Produto
    document.getElementById("analiseProduto").innerHTML =
      `<strong>${produto.nome}</strong> — Código: ${produto.codigo}`;

    // Cards
    document.getElementById("totalMovimentacoes").textContent = resumo.total_movimentacoes.toLocaleString("pt-BR");
    document.getElementById("totalSuspeitas").textContent = `${resumo.total_suspeitas} (${resumo.percentual_suspeitas}%)`;
    document.getElementById("impactoSaldo").textContent = `${resumo.impacto_total_saldo > 0 ? "+" : ""}${resumo.impacto_total_saldo}`;

    // Stats
    document.getElementById("primeiraOcorrencia").textContent = resumo.primeira_ocorrencia || "—";
    document.getElementById("usuariosEnvolvidos").textContent = resumo.usuarios_envolvidos;
    document.getElementById("totalAdicionado").textContent = `+${resumo.total_adicionado_stock_locator}`;
    document.getElementById("totalRetirado").textContent = resumo.total_retirado_stock_locator;

    // Recomendação IA
    const recomendacaoDiv = document.getElementById("analiseRecomendacao");
    const recomendacaoTexto = document.getElementById("recomendacaoTexto");

    if (recomendacao_ia && recomendacao_ia !== "Não foi possível gerar a recomendação automática no momento.") {
      recomendacaoTexto.textContent = recomendacao_ia;
      recomendacaoDiv.style.display = "block";
    } else {
      recomendacaoDiv.style.display = "none";
    }

    // Ranking
    renderRanking(ranking_usuarios);

    // Operações suspeitas
    renderSuspeitas(operacoes_suspeitas);

    // Mostra resultado
    document.getElementById("analiseResultado").style.display = "block";
  }

  // ===================== Ranking =====================
  function renderRanking(ranking) {
    const list = document.getElementById("rankingList");
    if (!list) return;

    if (!ranking.length) {
      list.innerHTML = `<div class="table__empty">Nenhum usuário identificado.</div>`;
      return;
    }

    list.innerHTML = ranking.map(u => `
      <div class="table__row">
        <span>${u.usuario}</span>
        <span>${u.total_operacoes}</span>
        <span style="color: var(--danger)">+${u.total_adicionado}</span>
        <span style="color: var(--warning)">${u.total_retirado}</span>
      </div>
    `).join("");
  }

  // ===================== Operações suspeitas =====================
  function renderSuspeitas(suspeitas) {
    const list = document.getElementById("suspeitasList");
    if (!list) return;

    if (!suspeitas.length) {
      list.innerHTML = `<div class="table__empty">Nenhuma operação suspeita encontrada.</div>`;
      return;
    }

    list.innerHTML = suspeitas.map(op => {
      const tipo = op.quantidade > 0 ? "Adição" : "Retirada";
      const tipoClass = op.quantidade > 0 ? "status-badge--pending" : "status-badge--resolved";
      const dataFormatada = op.data
        ? new Date(op.data).toLocaleString("pt-BR")
        : "-";

      return `
        <div class="table__row" data-tipo="${op.quantidade > 0 ? 'adicao' : 'retirada'}" data-usuario="${op.usuario.toLowerCase()}">
          <span>${dataFormatada}</span>
          <span>${op.usuario}</span>
          <span><span class="status-badge ${tipoClass}">${tipo}</span></span>
          <span>${op.quantidade > 0 ? "+" : ""}${op.quantidade}</span>
          <span>${op.saldo_produto_apos}</span>
          <span>${op.endereco || "-"}</span>
        </div>
      `;
    }).join("");
  }

  // ===================== Filtros =====================
  document.getElementById("tipoFilter")?.addEventListener("change", aplicarFiltros);
  document.getElementById("usuarioFilter")?.addEventListener("input", aplicarFiltros);

  function aplicarFiltros() {
    const tipo = document.getElementById("tipoFilter").value;
    const usuario = document.getElementById("usuarioFilter").value.toLowerCase().trim();

    const rows = document.querySelectorAll("#suspeitasList .table__row");

    rows.forEach(row => {
      const rowTipo = row.dataset.tipo;
      const rowUsuario = row.dataset.usuario;

      const tipoOk = tipo === "all" || rowTipo === tipo;
      const usuarioOk = !usuario || rowUsuario.includes(usuario);

      row.style.display = tipoOk && usuarioOk ? "" : "none";
    });
  }

  // ===================== Inicialização =====================
  document.addEventListener("profileLoaded", () => {
    // Página pronta — aguarda upload do usuário
  });

});