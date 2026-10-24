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
          "inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-950/50 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800",
      },
      supabase: {
        label: "Ligado ao Supabase",
        className:
          "inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800",
      },
      erro: {
        label: "Falha ao ligar ao Supabase — a usar modo local",
        className:
          "inline-flex items-center gap-2 rounded-full bg-rose-50 dark:bg-rose-950/50 px-3 py-1 text-xs font-medium text-rose-800 dark:text-rose-400 ring-1 ring-rose-200 dark:ring-rose-800",
      },
    };

    const current = styles[mode] || styles.local;
    if (statusBadge) {
      statusBadge.className = current.className;
      statusBadge.innerHTML =
        '<span class="h-1.5 w-1.5 rounded-full bg-current"></span>' +
        current.label;
    }
  }

  function showFeedback(message, type) {
    if (!feedback) return;
    const palette = {
      success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800",
      error: "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 ring-rose-200 dark:ring-rose-800",
      info: "bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 ring-sky-200 dark:ring-sky-800",
    };

    feedback.className =
      "mt-4 rounded-xl px-4 py-3 text-sm ring-1 " +
      (palette[type] || palette.info);
    feedback.textContent = message;
    feedback.classList.remove("hidden");
  }

  function hideFeedback() {
    if (feedback) {
      feedback.classList.add("hidden");
    }
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
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!pontos || !pontos.length) {
      if (emptyState) emptyState.classList.remove("hidden");
      return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    pontos.forEach(function (ponto) {
      const tr = document.createElement("tr");
      tr.className = "border-b border-slate-100 dark:border-slate-700 last:border-0";
      tr.innerHTML =
        "<td class=\"px-4 py-3 font-medium text-slate-800 dark:text-slate-100\">" +
        escapeHtml(ponto.nome_local) +
        "</td>" +
        "<td class=\"px-4 py-3 text-slate-600 dark:text-slate-300\">" +
        escapeHtml(ponto.endereco) +
        "</td>" +
        "<td class=\"px-4 py-3\">" +
        '<span class="inline-flex rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-800">' +
        escapeHtml(ponto.tipo_material) +
        "</span></td>" +
        "<td class=\"px-4 py-3 text-sm text-slate-500 dark:text-slate-400\">" +
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
    if (usingSupabase && supabaseClient) {
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
    if (usingSupabase && supabaseClient) {
      const { data, error } = await supabaseClient
        .from(TABLE)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const ponto = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      created_at: new Date().toISOString(),
      ...payload,
    };
    const pontos = readLocal();
    pontos.push(ponto);
    writeLocal(pontos);
    return ponto;
  }

  async function refresh() {
    try {
      const pontos = await listPontos();
      renderTable(pontos);
    } catch (error) {
      console.error("Erro ao atualizar pontos:", error);
    }
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

  if (form) {
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

      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = "A guardar…";
      }

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
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = "Cadastrar ponto";
        }
      }
    });
  }

  initSupabase()
    .then(refresh)
    .catch(function (error) {
      showFeedback(
        "Erro ao carregar os pontos de recolha. " + (error.message || ""),
        "error"
      );
    });
})();
