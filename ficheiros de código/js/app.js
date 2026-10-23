(function () {
  "use strict";

  const TABLE = "pontos_recolha";
  const STORAGE_KEY = "ecodescarte_pontos";

  const form = document.getElementById("form-ponto");
  const tbody = document.getElementById("tabela-pontos");
  const emptyState = document.getElementById("estado-vazio");
  const statusBadge = document.getElementById("estado-ligacao");
  const feedback = document.getElementById("feedback");
  const btnSubmit = document.getElementById("btn-submeter");

  const config = window.ECODESCARTE_CONFIG || {};
  const hasSupabaseKeys =
    Boolean(config.supabaseUrl && config.supabaseAnonKey);

  let supabaseClient = null;
  let usingSupabase = false;

  function setConnectionBadge(mode) {
    const styles = {
      local: {
        label: "Modo local (localStorage)",
        className:
          "inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200",
      },
      supabase: {
        label: "Ligado ao Supabase",
        className:
          "inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200",
      },
      erro: {
        label: "Falha ao ligar ao Supabase — a usar modo local",
        className:
          "inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-800 ring-1 ring-rose-200",
      },
    };

    const current = styles[mode] || styles.local;
    statusBadge.className = current.className;
    statusBadge.innerHTML =
      '<span class="h-1.5 w-1.5 rounded-full bg-current"></span>' +
      current.label;
  }

  function showFeedback(message, type) {
    const palette = {
      success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      error: "bg-rose-50 text-rose-800 ring-rose-200",
      info: "bg-sky-50 text-sky-800 ring-sky-200",
    };

    feedback.className =
      "mt-4 rounded-xl px-4 py-3 text-sm ring-1 " +
      (palette[type] || palette.info);
    feedback.textContent = message;
    feedback.classList.remove("hidden");
  }

  function hideFeedback() {
    feedback.classList.add("hidden");
  }

  function readLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function writeLocal(pontos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pontos));
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("pt-PT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function renderTable(pontos) {
    tbody.innerHTML = "";

    if (!pontos.length) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    pontos.forEach(function (ponto) {
      const tr = document.createElement("tr");
      tr.className = "border-b border-stone-100 last:border-0";
      tr.innerHTML =
        "<td class=\"px-4 py-3 font-medium text-stone-800\">" +
        escapeHtml(ponto.nome_local) +
        "</td>" +
        "<td class=\"px-4 py-3 text-stone-600\">" +
        escapeHtml(ponto.endereco) +
        "</td>" +
        "<td class=\"px-4 py-3\">" +
        '<span class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">' +
        escapeHtml(ponto.tipo_material) +
        "</span></td>" +
        "<td class=\"px-4 py-3 text-sm text-stone-500\">" +
        formatDate(ponto.created_at) +
        "</td>";
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function listPontos() {
    if (usingSupabase) {
      const { data, error } = await supabaseClient
        .from(TABLE)
        .select("id, nome_local, endereco, tipo_material, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    }

    return readLocal().sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  async function createPonto(payload) {
    if (usingSupabase) {
      const { data, error } = await supabaseClient
        .from(TABLE)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const ponto = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...payload,
    };
    const pontos = readLocal();
    pontos.push(ponto);
    writeLocal(pontos);
    return ponto;
  }

  async function refresh() {
    const pontos = await listPontos();
    renderTable(pontos);
  }

  async function initSupabase() {
    if (!hasSupabaseKeys) {
      setConnectionBadge("local");
      return;
    }

    if (!window.supabase) {
      setConnectionBadge("erro");
      showFeedback(
        "A biblioteca supabase-js não carregou. A página continua a funcionar em modo local.",
        "error"
      );
      return;
    }

    try {
      supabaseClient = window.supabase.createClient(
        config.supabaseUrl,
        config.supabaseAnonKey
      );
      usingSupabase = true;
      await listPontos();
      setConnectionBadge("supabase");
    } catch (error) {
      usingSupabase = false;
      setConnectionBadge("erro");
      showFeedback(
        "Não foi possível ligar ao Supabase. A usar armazenamento local. " +
          (error.message || ""),
        "error"
      );
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    hideFeedback();

    const formData = new FormData(form);
    const payload = {
      nome_local: String(formData.get("nome_local") || "").trim(),
      endereco: String(formData.get("endereco") || "").trim(),
      tipo_material: String(formData.get("tipo_material") || "").trim(),
    };

    if (!payload.nome_local || !payload.endereco || !payload.tipo_material) {
      showFeedback("Preencha todos os campos antes de cadastrar.", "error");
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = "A guardar…";

    try {
      await createPonto(payload);
      form.reset();
      await refresh();
      showFeedback("Ponto de recolha cadastrado com sucesso.", "success");
    } catch (error) {
      showFeedback(
        "Não foi possível guardar o ponto. " + (error.message || ""),
        "error"
      );
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Cadastrar ponto";
    }
  });

  initSupabase()
    .then(refresh)
    .catch(function (error) {
      showFeedback(
        "Erro ao carregar os pontos de recolha. " + (error.message || ""),
        "error"
      );
    });
})();
