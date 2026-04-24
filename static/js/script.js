document.addEventListener("DOMContentLoaded", () => {
  initRevealAnimations();
  initCantieriFilters();
  initDashboardTabs();
  initLoginForm();
  initLogout();
  initQuoteForm();
  initUploadForm();
  initProjectForm();
  loadRichiesteDashboard();
  loadProjectsDashboard();
  initDemoButtons();
});

function initRevealAnimations() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  reveals.forEach((element) => observer.observe(element));
}

function initDemoButtons() {
  const demoButtons = document.querySelectorAll(".demo-detail-btn");
  demoButtons.forEach((button) => {
    button.addEventListener("click", () => {
      alert("Questa funzione sarà collegata ai dettagli reali del cantiere nei prossimi step.");
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

        if (filter === "all" || category === filter) {
          card.classList.remove("hidden");
        } else {
          card.classList.add("hidden");
        }
      });
    });
  });
}

function initDashboardTabs() {
  const dashButtons = document.querySelectorAll(".dash-btn");
  const tabs = document.querySelectorAll(".tab");

  if (!dashButtons.length || !tabs.length) return;

  dashButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      dashButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      tabs.forEach((tab) => {
        tab.classList.remove("active");
        if (tab.id === target) {
          tab.classList.add("active");
        }
      });
    });
  });
}

function initLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const usernameInput = document.getElementById("login-user");
  const passwordInput = document.getElementById("login-pass");
  const messageBox = document.getElementById("login-message");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = usernameInput ? usernameInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value.trim() : "";

    if (!username || !password) {
      setMessage(messageBox, "Inserisci nome utente e password.", false);
      return;
    }

    setMessage(messageBox, "Accesso in corso...", true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(messageBox, "Accesso effettuato. Reindirizzamento...", true);
        window.location.href = data.redirect || "/dashboard";
      } else {
        setMessage(messageBox, data.messaggio || "Login non valido.", false);
      }
    } catch (error) {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });
}

function initLogout() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    try {
      await fetch("/api/logout", {
        method: "POST"
      });
    } catch (error) {
      // niente
    }

    window.location.href = "/login";
  });
}

function initQuoteForm() {
  const quoteForm = document.getElementById("quoteForm");
  if (!quoteForm) return;

  const messageBox = document.getElementById("quote-message");

  quoteForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("nome")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const descrizione = document.getElementById("descrizione")?.value.trim() || "";
    const privacyChecked = document.getElementById("privacy-check")?.checked || false;

    if (!nome || !email || !descrizione) {
      setMessage(messageBox, "Compila almeno nome, email e descrizione del lavoro.", false);
      return;
    }

    if (!privacyChecked) {
      setMessage(messageBox, "Devi autorizzare il trattamento dei dati per inviare la richiesta.", false);
      return;
    }

    const formData = new FormData(quoteForm);
    setMessage(messageBox, "Invio richiesta in corso...", true);

    try {
      const response = await fetch("/api/preventivo", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(messageBox, data.messaggio || "Richiesta inviata correttamente.", true);
        quoteForm.reset();
      } else {
        setMessage(messageBox, data.messaggio || "Errore durante l'invio della richiesta.", false);
      }
    } catch (error) {
      setMessage(messageBox, "Errore di connessione al server.", false);
    }
  });
}

function initProjectForm() {
  const projectForm = document.getElementById("projectForm");
  if (!projectForm) return;

  const messageBox = document.getElementById("project-message");
  const hiddenId = document.getElementById("project-id");
  const submitBtn = document.getElementById("project-submit-btn");
  const cancelBtn = document.getElementById("project-cancel-btn");

  projectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const titolo = document.getElementById("project-titolo")?.value.trim() || "";
    const projectId = hiddenId?.value || "";

    if (!titolo) {
      setMessage(messageBox, "Inserisci il titolo del cantiere.", false);
      return;
    }

    const formData = new FormData(projectForm);
    const url = projectId ? `/api/projects/${projectId}` : "/api/projects";

    setMessage(
      messageBox,
      projectId ? "Aggiornamento cantiere in corso..." : "Creazione cantiere in corso...",
      true
    );

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        setMessage(
          messageBox,
          data.messaggio || (projectId ? "Cantiere aggiornato correttamente." : "Cantiere creato correttamente."),
          true
        );
        resetProjectForm();
        await loadProjectsDashboard();
      } else {
        setMessage(messageBox, data.messaggio || "Errore durante il salvataggio del cantiere.", false);
      }
    } catch (error) {
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
    projectForm.reset();
    if (hiddenId) hiddenId.value = "";
    if (submitBtn) submitBtn.textContent = "Crea cantiere";
    if (cancelBtn) cancelBtn.style.display = "none";
  }
}

function initUploadForm() {
  const uploadForm = document.getElementById("uploadForm");
  if (!uploadForm) return;

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const projectId = document.getElementById("upload-cantiere")?.value || "";
    const fileInput = document.getElementById("upload-file");
    const selectedFile = fileInput?.files?.[0];

    if (!projectId) {
      alert("Seleziona un cantiere.");
      return;
    }

    if (!selectedFile) {
      alert("Seleziona un'immagine da caricare.");
      return;
    }

    const formData = new FormData(uploadForm);

    try {
      const response = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.ok) {
        alert(data.messaggio || "Immagine caricata correttamente.");
        const selectedProjectId = projectId;
        uploadForm.reset();

        const select = document.getElementById("upload-cantiere");
        if (select && selectedProjectId) {
          select.value = selectedProjectId;
          loadProjectPhotos(selectedProjectId);
        }
      } else {
        alert(data.messaggio || "Errore durante il caricamento dell'immagine.");
      }
    } catch (error) {
      alert("Errore di connessione al server.");
    }
  });
}

async function loadRichiesteDashboard() {
  const container = document.getElementById("lista-richieste");
  if (!container) return;

  try {
    const response = await fetch("/api/richieste");
    const data = await response.json();

    if (!data.ok) {
      container.innerHTML = `
        <div class="dash-card">
          <h3>Errore caricamento richieste</h3>
          <p>${escapeHtml(data.messaggio || "Impossibile recuperare le richieste.")}</p>
        </div>
      `;
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

    container.innerHTML = richieste.map((item) => `
      <div class="dash-card">
        <h3>${escapeHtml(item.nome)}</h3>
        <p><strong>Email:</strong> ${escapeHtml(item.email || "-")}</p>
        <p><strong>Telefono:</strong> ${escapeHtml(item.telefono || "-")}</p>
        <p><strong>Comune:</strong> ${escapeHtml(item.comune || "-")}</p>
        <p><strong>Tipologia:</strong> ${escapeHtml(item.tipologia_lavoro || "-")}</p>
        <p><strong>Urgenza:</strong> ${escapeHtml(item.urgenza || "-")}</p>
        <p><strong>Descrizione:</strong> ${escapeHtml(item.descrizione || "-")}</p>
        <p><strong>Budget:</strong> ${escapeHtml(item.budget || "-")}</p>
        <p><strong>Stato:</strong> ${escapeHtml(item.stato || "-")}</p>
        <p><strong>Data:</strong> ${escapeHtml(item.created_at || "-")}</p>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `
      <div class="dash-card">
        <h3>Errore server</h3>
        <p>Impossibile caricare le richieste dal backend.</p>
      </div>
    `;
  }
}

async function loadProjectsDashboard() {
  const listContainer = document.getElementById("lista-cantieri-dashboard");
  const uploadSelect = document.getElementById("upload-cantiere");

  if (!listContainer && !uploadSelect) return;

  try {
    const response = await fetch("/api/projects");
    const data = await response.json();

    if (!data.ok) {
      if (listContainer) {
        listContainer.innerHTML = `
          <div class="dash-card">
            <h3>Errore caricamento</h3>
            <p>${escapeHtml(data.messaggio || "Impossibile caricare i cantieri.")}</p>
          </div>
        `;
      }
      return;
    }

    const projects = data.projects || [];

    if (uploadSelect) {
      uploadSelect.innerHTML = `<option value="">Seleziona</option>`;
      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project.id;
        option.textContent = project.titolo;
        uploadSelect.appendChild(option);
      });
    }

    if (listContainer) {
      if (!projects.length) {
        listContainer.innerHTML = `
          <div class="dash-card">
            <h3>Nessun cantiere presente</h3>
            <p>Crea il primo cantiere dal modulo qui sopra.</p>
          </div>
        `;
      } else {
        listContainer.innerHTML = projects.map((project) => `
          <div class="dash-card">
            <h3>${escapeHtml(project.titolo)}</h3>
            <p><strong>Categoria:</strong> ${escapeHtml(project.categoria || "-")}</p>
            <p><strong>Luogo:</strong> ${escapeHtml(project.luogo || "-")}</p>
            <p><strong>Descrizione:</strong> ${escapeHtml(project.descrizione_breve || "-")}</p>
            <p><strong>Stato:</strong> ${escapeHtml(project.stato || "-")}</p>
            <p><strong>Visibile sul sito:</strong> ${project.visibile_pubblico ? "Sì" : "No"}</p>

            <div class="cantiere-actions">
              <button class="btn btn-primary small-btn" type="button" onclick="editProject(${project.id})">
                Modifica
              </button>
              <button class="btn btn-secondary small-btn" type="button" onclick="toggleProjectPublic(${project.id})">
                ${project.visibile_pubblico ? "Nascondi" : "Pubblica"}
              </button>
              <button class="btn small-btn" type="button" onclick="deleteProject(${project.id})">
                Elimina
              </button>
            </div>
          </div>
        `).join("");
      }
    }
  } catch (error) {
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="dash-card">
          <h3>Errore server</h3>
          <p>Impossibile caricare i cantieri dal backend.</p>
        </div>
      `;
    }
  }
}

function setMessage(element, message, isSuccess) {
  if (!element) {
    if (!isSuccess) {
      alert(message);
    }
    return;
  }

  element.textContent = message;
  element.style.color = isSuccess ? "#86efac" : "#fda4af";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
async function editProject(projectId) {
  const messageBox = document.getElementById("project-message");
  const hiddenId = document.getElementById("project-id");
  const submitBtn = document.getElementById("project-submit-btn");
  const cancelBtn = document.getElementById("project-cancel-btn");

  try {
    const response = await fetch(`/api/projects/${projectId}`);
    const data = await response.json();

    if (!data.ok) {
      setMessage(messageBox, data.messaggio || "Errore nel caricamento del cantiere.", false);
      return;
    }

    const project = data.project;

    document.getElementById("project-titolo").value = project.titolo || "";
    document.getElementById("project-categoria").value = project.categoria || "";
    document.getElementById("project-luogo").value = project.luogo || "";
    document.getElementById("project-descrizione").value = project.descrizione_breve || "";

    if (hiddenId) hiddenId.value = project.id;
    if (submitBtn) submitBtn.textContent = "Salva modifiche";
    if (cancelBtn) cancelBtn.style.display = "inline-flex";

    setMessage(messageBox, "Modalità modifica attiva.", true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
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
  } catch (error) {
    alert("Errore di connessione al server.");
  }
}

async function deleteProject(projectId) {
  const conferma = confirm("Vuoi davvero eliminare questo cantiere?");
  if (!conferma) return;

  try {
    const response = await fetch(`/api/projects/${projectId}/delete`, {
      method: "POST"
    });

    const data = await response.json();

    if (data.ok) {
      await loadProjectsDashboard();
    } else {
      alert(data.messaggio || "Errore durante l'eliminazione del cantiere.");
    }
  } catch (error) {
    alert("Errore di connessione al server.");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const uploadSelect = document.getElementById("upload-cantiere");
  if (uploadSelect) {
    uploadSelect.addEventListener("change", () => {
      const projectId = uploadSelect.value;
      loadProjectPhotos(projectId);
    });
  }
});

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
      container.innerHTML = `
        <div class="dash-card">
          <h3>Errore caricamento immagini</h3>
          <p>${escapeHtml(data.messaggio || "Impossibile caricare le immagini.")}</p>
        </div>
      `;
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
          <div style="border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.08);">
            <img
              src="/static/${escapeHtml(photo.file_path)}"
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
  } catch (error) {
    container.innerHTML = `
      <div class="dash-card">
        <h3>Errore server</h3>
        <p>Impossibile caricare le immagini del cantiere.</p>
      </div>
    `;
  }
}

async function deletePhoto(photoId, projectId) {
  const conferma = confirm("Vuoi davvero eliminare questa immagine?");
  if (!conferma) return;

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
  } catch (error) {
    alert("Errore di connessione al server.");
  }
}