document.addEventListener("DOMContentLoaded", () => {
    const sku = document.getElementById("sku");
    const address = document.getElementById("address");
    const qty = document.getElementById("qty");
    const form = document.querySelector("form");

    // Foco inicial no campo SKU
    if (sku) sku.focus();

    function goNext(current) {
        if (current === sku) address?.focus();
        if (curret === address) qty?.focus();
    }

    function isEnter(e) {
        return e.key === "Enter";
    }

    // Enter no SKU / endereço vai para o próximo campo
    [sku, address].forEach((el) => {
        if (!el) return;
        el.addEventListener("keydown", (e) => {
            if (isEnter(e)) {
                e.preventDefault();
                goNext(el);
            }
        });
    });

    // Enter no campo de quantidade submete o formulário
    if (qty) {
        qty.addEventListener("keydown", (e) => {
            if (isEnter(e)) {
                e.preventDefault();
                form?.requestSubmit?.();
            }
        });
    }

    // Simulação de "salvar" (por enquanto)
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // validação simples (HTML required já cuida disso, mas só para garantir)
            if (!sku.value.trim()) return sku.focus();
            if (!address.value.trim()) return address.focus();
            if (!qty.value.trim()) return qty.focus();

            // Aqui no futuro vai chamar a API. Por enquanto, só limpa os campos e foca no SKU.
            form.reset();
            sku.focus();
        });
    }
});
