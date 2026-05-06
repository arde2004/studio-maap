document.addEventListener("DOMContentLoaded", () => {
  initRevealAnimations();
  initDemoButtons();
  initCantieriFilters();
  initDashboardTabs();
  initLoginForm();
  initLogout();
  initQuoteForm();
  initProjectForm();
  initUploadForm();
  initUploadSelect();

  initSiteSettingsForm();
  loadSiteSettings();

  loadRichiesteDashboard();
  loadProjectsDashboard();
});

function initRevealAnimations() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("visible");
    });
  }, { threshold: 0.15 });

  reveals.forEach((el) => observer.observe(el));
}

function initDemoButtons() {
  document.querySelectorAll(".demo-detail-btn").forEach((button) => {
    button.addEventListener("click", () => {
      alert("Funzione dimostrativa: verrà collegata ai dati reali del cantiere.");
    });
  });
}

function initCantieriFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const cards = document.querySelectorAll(".cantiere-card");
  if (!filterButtons.length || !cards.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.filter;

      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      cards.forEach((card) => {
        const category = (card.dataset.category || "").toLowerCase();
        card.classList.toggle("hidden", filter !== "all" && category !== filter);
      });
    });
  });
}

function initDashboardTabs() {
  const buttons = document.querySelectorAll(".dash-btn");
  const tabs = document.querySelectorAll(".tab");
  if (!buttons.length || !tabs.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabs.forEach((tab) => {
        tab.classList.toggle("active", tab.id === target);
      });
    });
  });
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const messageBox = document.getElementById("login-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("login-user")?.value.trim() || "";
    const password = document.getElementById("login-pass")?.value.trim() || "";

    if (!username || !password) {
      setMessage(messageBox, "Inserisci nome utente e password.", false);
      return;
    }

    setMessage(messageBox, "Accesso in corso...", true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.ok) {
        window.location.href = data.redirect || "/dashboard";
      } else {
        setMessage(messageBox, data.messaggio || "Login non valido.", false);
      }
    } catch {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });
}

function initLogout() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  });
}

function initQuoteForm() {
  const form = document.getElementById("quoteForm");
  if (!form) return;

  const messageBox = document.getElementById("quote-message");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const descrizione = document.getElementById("descrizione")?.value.trim() || "";
    const privacy = document.getElementById("privacy-check")?.checked || false;

    if (!nome || !email || !descrizione) {
      setMessage(messageBox, "Compila almeno nome, email e descrizione.", false);
      return;
    }

    if (!privacy) {
      setMessage(messageBox, "Devi autorizzare il trattamento dei dati.", false);
      return;
    }

    setMessage(messageBox, "Invio richiesta in corso...", true);

    try {
      const response = await fetch("/api/preventivo", {
        method: "POST",
        body: new FormData(form)
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(messageBox, data.messaggio || "Richiesta inviata correttamente.", true);
        form.reset();
      } else {
        setMessage(messageBox, data.messaggio || "Errore durante l'invio.", false);
      }
    } catch {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });
}

function initProjectForm() {
  const form = document.getElementById("projectForm");
  if (!form) return;

  const messageBox = document.getElementById("project-message");
  const hiddenId = document.getElementById("project-id");
  const submitBtn = document.getElementById("project-submit-btn");
  const cancelBtn = document.getElementById("project-cancel-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titolo = document.getElementById("project-titolo")?.value.trim() || "";
    const projectId = hiddenId?.value || "";

    if (!titolo) {
      setMessage(messageBox, "Inserisci il titolo del cantiere.", false);
      return;
    }

    const url = projectId ? `/api/projects/${projectId}` : "/api/projects";

    setMessage(
      messageBox,
      projectId ? "Salvataggio modifiche in corso..." : "Creazione cantiere in corso...",
      true
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        body: new FormData(form)
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(messageBox, data.messaggio || "Operazione completata.", true);
        resetProjectForm();
        await loadProjectsDashboard();
      } else {
        setMessage(messageBox, data.messaggio || "Errore durante il salvataggio.", false);
      }
    } catch {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      resetProjectForm();
      setMessage(messageBox, "", true);
    });
  }

  function resetProjectForm() {
    form.reset();
    if (hiddenId) hiddenId.value = "";
    if (submitBtn) submitBtn.textContent = "Crea cantiere";
    if (cancelBtn) cancelBtn.style.display = "none";
  }
}

function initUploadForm() {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const projectId = document.getElementById("upload-cantiere")?.value || "";
    const file = document.getElementById("upload-file")?.files?.[0];

    if (!projectId) {
      alert("Seleziona un cantiere.");
      return;
    }

    if (!file) {
      alert("Seleziona un'immagine da caricare.");
      return;
    }

    try {
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: new FormData(form)
      });

      const data = await response.json();

      if (data.ok) {
        alert(data.messaggio || "Immagine caricata correttamente.");
        form.reset();

        const select = document.getElementById("upload-cantiere");
        if (select) select.value = projectId;

        await loadProjectPhotos(projectId);
      } else {
        alert(data.messaggio || "Errore durante il caricamento.");
      }
    } catch {
      alert("Errore di connessione al server.");
    }
  });
}

function initUploadSelect() {
  const select = document.getElementById("upload-cantiere");
  if (!select) return;

  select.addEventListener("change", () => {
    loadProjectPhotos(select.value);
  });
}

async function loadRichiesteDashboard() {
  const container = document.getElementById("lista-richieste");
  if (!container) return;

  try {
    const response = await fetch("/api/richieste");
    const data = await response.json();

    if (!data.ok) {
      container.innerHTML = errorCard(data.messaggio || "Impossibile recuperare le richieste.");
      return;
    }

    const richieste = data.richieste || [];

    if (!richieste.length) {
      container.innerHTML = `
        <div class="dash-card">
          <h3>Nessuna richiesta presente</h3>
          <p>Le richieste inviate dal modulo preventivi compariranno qui.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = richieste.map((r) => `
      <div class="dash-card">
        <h3>${escapeHtml(r.nome)}</h3>
        <p><strong>Email:</strong> ${escapeHtml(r.email || "-")}</p>
        <p><strong>Telefono:</strong> ${escapeHtml(r.telefono || "-")}</p>
        <p><strong>Comune:</strong> ${escapeHtml(r.comune || "-")}</p>
        <p><strong>Tipologia:</strong> ${escapeHtml(r.tipologia_lavoro || "-")}</p>
        <p><strong>Urgenza:</strong> ${escapeHtml(r.urgenza || "-")}</p>
        <p><strong>Budget:</strong> ${escapeHtml(r.budget || "-")}</p>
        <p><strong>Stato:</strong> ${escapeHtml(r.stato || "-")}</p>
        <p><strong>Data:</strong> ${escapeHtml(r.created_at || "-")}</p>
        <p><strong>Descrizione:</strong> ${escapeHtml(r.descrizione || "-")}</p>
      </div>
    `).join("");
  } catch {
    container.innerHTML = errorCard("Impossibile caricare le richieste dal backend.");
  }
}

async function loadProjectsDashboard() {
  const list = document.getElementById("lista-cantieri-dashboard");
  const select = document.getElementById("upload-cantiere");

  if (!list && !select) return;

  try {
    const response = await fetch("/api/projects");
    const data = await response.json();

    if (!data.ok) {
      if (list) list.innerHTML = errorCard(data.messaggio || "Impossibile caricare i cantieri.");
      return;
    }

    const projects = data.projects || [];

    if (select) {
      const currentValue = select.value;
      select.innerHTML = `<option value="">Seleziona</option>`;

      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.titolo;
        select.appendChild(option);
      });

      if (currentValue) select.value = currentValue;
    }

    if (!list) return;

    if (!projects.length) {
      list.innerHTML = `
        <div class="dash-card">
          <h3>Nessun cantiere presente</h3>
          <p>Crea il primo cantiere dal modulo qui sopra.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = projects.map((p) => `
      <div class="dash-card">
        <h3>${escapeHtml(p.titolo)}</h3>
        <p><strong>Categoria:</strong> ${escapeHtml(p.categoria || "-")}</p>
        <p><strong>Luogo:</strong> ${escapeHtml(p.luogo || "-")}</p>
        <p><strong>Descrizione:</strong> ${escapeHtml(p.descrizione_breve || "-")}</p>
        <p><strong>Stato:</strong> ${escapeHtml(p.stato || "-")}</p>
        <p><strong>Visibile sul sito:</strong> ${p.visibile_pubblico ? "Sì" : "No"}</p>

        <div class="cantiere-actions">
          <button class="btn btn-primary small-btn" type="button" onclick="editProject(${p.id})">
            Modifica
          </button>
          <button class="btn btn-secondary small-btn" type="button" onclick="toggleProjectPublic(${p.id})">
            ${p.visibile_pubblico ? "Nascondi" : "Pubblica"}
          </button>
          <button class="btn small-btn" type="button" onclick="deleteProject(${p.id})">
            Elimina
          </button>
        </div>
      </div>
    `).join("");
  } catch {
    if (list) list.innerHTML = errorCard("Impossibile caricare i cantieri dal backend.");
  }
}

async function editProject(projectId) {
  const messageBox = document.getElementById("project-message");

  try {
    const response = await fetch(`/api/projects/${projectId}`);
    const data = await response.json();

    if (!data.ok) {
      setMessage(messageBox, data.messaggio || "Errore nel caricamento del cantiere.", false);
      return;
    }

    const project = data.project;

    document.getElementById("project-id").value = project.id;
    document.getElementById("project-titolo").value = project.titolo || "";
    document.getElementById("project-categoria").value = project.categoria || "";
    document.getElementById("project-luogo").value = project.luogo || "";
    document.getElementById("project-descrizione").value = project.descrizione_breve || "";

    const submitBtn = document.getElementById("project-submit-btn");
    const cancelBtn = document.getElementById("project-cancel-btn");

    if (submitBtn) submitBtn.textContent = "Salva modifiche";
    if (cancelBtn) cancelBtn.style.display = "inline-flex";

    setMessage(messageBox, "Modalità modifica attiva.", true);
    document.getElementById("projectForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch {
    setMessage(messageBox, "Errore di connessione al server.", false);
  }
}

async function toggleProjectPublic(projectId) {
  try {
    const response = await fetch(`/api/projects/${projectId}/toggle-public`, {
      method: "POST"
    });

    const data = await response.json();

    if (data.ok) {
      await loadProjectsDashboard();
    } else {
      alert(data.messaggio || "Errore durante l'aggiornamento della visibilità.");
    }
  } catch {
    alert("Errore di connessione al server.");
  }
}

async function deleteProject(projectId) {
  if (!confirm("Vuoi davvero eliminare questo cantiere?")) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/delete`, {
      method: "POST"
    });

    const data = await response.json();

    if (data.ok) {
      await loadProjectsDashboard();
      const select = document.getElementById("upload-cantiere");
      if (select) select.value = "";
      await loadProjectPhotos("");
    } else {
      alert(data.messaggio || "Errore durante l'eliminazione del cantiere.");
    }
  } catch {
    alert("Errore di connessione al server.");
  }
}

async function loadProjectPhotos(projectId) {
  const container = document.getElementById("lista-foto-cantiere");
  if (!container) return;

  if (!projectId) {
    container.innerHTML = `
      <div class="dash-card">
        <h3>Nessun cantiere selezionato</h3>
        <p>Seleziona un cantiere dal menu sopra per vedere le immagini caricate.</p>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch(`/api/projects/${projectId}/photos`);
    const data = await response.json();

    if (!data.ok) {
      container.innerHTML = errorCard(data.messaggio || "Impossibile caricare le immagini.");
      return;
    }

    const photos = data.photos || [];

    if (!photos.length) {
      container.innerHTML = `
        <div class="dash-card">
          <h3>Nessuna immagine presente</h3>
          <p>Per questo cantiere non risultano ancora immagini caricate.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = photos.map((photo) => `
      <div class="dash-card">
        <div style="display:grid; gap:14px;">
          <div style="border-radius:16px; overflow:hidden; border:1px solid rgba(111,170,220,0.14);">
            <img
              src="${escapeHtml(photo.file_path)}"
              alt="Foto cantiere"
              style="width:100%; height:220px; object-fit:cover; display:block;"
            />
          </div>

          <div>
            <p><strong>Tipo:</strong> ${escapeHtml(photo.tipo || "-")}</p>
            <p><strong>Descrizione:</strong> ${escapeHtml(photo.caption || "-")}</p>
          </div>

          <div class="cantiere-actions">
            <button class="btn small-btn" type="button" onclick="deletePhoto(${photo.id}, ${projectId})">
              Elimina foto
            </button>
          </div>
        </div>
      </div>
    `).join("");
  } catch {
    container.innerHTML = errorCard("Impossibile caricare le immagini del cantiere.");
  }
}

async function deletePhoto(photoId, projectId) {
  if (!confirm("Vuoi davvero eliminare questa immagine?")) return;

  try {
    const response = await fetch(`/api/photos/${photoId}/delete`, {
      method: "POST"
    });

    const data = await response.json();

    if (data.ok) {
      await loadProjectPhotos(projectId);
    } else {
      alert(data.messaggio || "Errore durante l'eliminazione della foto.");
    }
  } catch {
    alert("Errore di connessione al server.");
  }
}

function setMessage(element, message, isSuccess) {
  if (!element) {
    if (message && !isSuccess) alert(message);
    return;
  }

  element.textContent = message || "";
  element.style.color = isSuccess ? "#22c55e" : "#ef5f7f";
}

function errorCard(message) {
  return `
    <div class="dash-card">
      <h3>Errore</h3>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initSiteSettingsForm() {
  const form = document.getElementById("siteSettingsForm");
  if (!form) return;

  const messageBox = document.getElementById("settings-message");
  const reloadBtn = document.getElementById("reload-settings-btn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    setMessage(messageBox, "Salvataggio contenuti in corso...", true);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        body: new FormData(form)
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(messageBox, data.messaggio || "Contenuti salvati correttamente.", true);
      } else {
        setMessage(messageBox, data.messaggio || "Errore durante il salvataggio.", false);
      }
    } catch {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });

  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      loadSiteSettings();
    });
  }
}

async function loadSiteSettings() {
  const form = document.getElementById("siteSettingsForm");
  if (!form) return;

  const messageBox = document.getElementById("settings-message");

  try {
    const response = await fetch("/api/settings");
    const data = await response.json();

    if (!data.ok) {
      setMessage(messageBox, data.messaggio || "Errore caricamento contenuti.", false);
      return;
    }

    const settings = data.settings || {};

    Object.keys(settings).forEach((key) => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = settings[key] || "";
    });

    setMessage(messageBox, "Contenuti caricati.", true);
  } catch {
    setMessage(messageBox, "Errore di connessione al server.", false);
  }
}
