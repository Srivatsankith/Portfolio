const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:5000/api"
  : "https://portfolio-backend-jkf3.onrender.com/api";
let currentEditProjectId = null;
let currentEditProjectImage = "";
let currentContentType = "project";
let currentEditContentId = null;

// Check authentication on page load
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showLoginModal();
  } else {
    // Verify token is still valid
    verifyToken();
  }

  setupEventListeners();
  updateContentFormMode();
  loadContentItems(currentContentType);
});

// Setup event listeners
function setupEventListeners() {
  // Login form
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }

  // Cancel login
  const cancelLogin = document.getElementById("cancelLogin");
  if (cancelLogin) {
    cancelLogin.addEventListener("click", () => {
      hideLoginModal();
      window.location.href = "index.html";
    });
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Project form
  const projectForm = document.getElementById("projectForm");
  if (projectForm) {
    projectForm.addEventListener("submit", handleProjectFormSubmit);
  }

  // Reset form
  const resetBtn = document.getElementById("resetProjectForm");
  if (resetBtn) {
    resetBtn.addEventListener("click", resetProjectForm);
  }

  const contentForm = document.getElementById("contentForm");
  if (contentForm) {
    contentForm.addEventListener("submit", handleContentFormSubmit);
  }

  const resetContentBtn = document.getElementById("resetContentForm");
  if (resetContentBtn) {
    resetContentBtn.addEventListener("click", resetContentForm);
  }

  const contentType = document.getElementById("contentType");
  if (contentType) {
    contentType.addEventListener("change", () => {
      currentContentType = contentType.value;
      resetContentForm();
      updateContentFormMode();
      loadContentItems(currentContentType);
    });
  }
}

// Verify JWT token
async function verifyToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    showLoginModal();
    return;
  }

  try {
    // Try to make a request to verify token
    const response = await fetch(`${API_BASE}/projects`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Token invalid");
    }
  } catch (error) {
    console.error("Token verification failed:", error);
    localStorage.removeItem("token");
    showLoginModal();
  }
}

// Modal functions
function showLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function hideLoginModal() {
  const modal = document.getElementById("loginModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Login handler
async function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem("token", data.token);
      hideLoginModal();
      loadContentItems(currentContentType);
      alert("Login successful!");
    } else {
      alert(data.message || "Login failed. Please check your credentials.");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
}

// Logout handler
function handleLogout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

// Authentication headers
function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Authenticated fetch wrapper
async function fetchAdmin(url, options = {}) {
  const safeOptions = { ...options };
  safeOptions.headers = {
    ...(options.headers || {}),
    ...getAuthHeaders()
  };
  return fetch(url, safeOptions);
}

// Image upload function
async function uploadProjectImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetchAdmin(`${API_BASE}/projects/upload`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Image upload failed");
  }

  const data = await response.json();
  return data.imageUrl || "";
}

// Load admin projects
async function loadAdminProjects() {
  const container = document.getElementById("adminProjectCards");
  if (!container) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/projects`);
    const projects = response.ok ? await response.json() : [];

    container.innerHTML = "";

    if (!projects.length) {
      container.innerHTML = `
        <div class="project-card">
          <h4>No projects available</h4>
          <p>Use the form to add dynamic projects.</p>
        </div>
      `;
      return;
    }

    projects.forEach((project) => {
      container.innerHTML += `
        <div class="project-card">
          <div>
            <h4>${project.title}</h4>
            <div class="project-meta">
              ${project.category ? `<span>${project.category}</span>` : ""}
              ${project.github ? `<span>GitHub available</span>` : ""}
              ${project.live_demo ? `<span>Live demo available</span>` : ""}
            </div>
            <p>${project.description}</p>
          </div>
          <div class="project-actions">
            <button type="button" class="btn secondary" data-action="edit" data-id="${project.id}">Edit</button>
            <button type="button" class="btn secondary" data-action="delete" data-id="${project.id}">Delete</button>
          </div>
        </div>
      `;
    });

    // Add event listeners for edit buttons
    container.querySelectorAll("button[data-action='edit']").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-id");
        const response = await fetch(`${API_BASE}/projects`);
        const projects = response.ok ? await response.json() : [];
        const project = projects.find((item) => String(item.id) === String(id));
        if (project) {
          prepareProjectForm(project);
        }
      });
    });

    // Add event listeners for delete buttons
    container.querySelectorAll("button[data-action='delete']").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-id");
        if (!confirm("Delete this project?")) {
          return;
        }

        const response = await fetchAdmin(`${API_BASE}/projects/${id}`, {
          method: "DELETE"
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message || "Project deleted.");
          loadAdminProjects();
        } else {
          alert(result.message || "Delete failed.");
        }
      });
    });
  } catch (error) {
    console.error("Admin project load failed:", error);
    container.innerHTML = "<div class='project-card'><h4>Error loading projects</h4></div>";
  }
}

// Prepare project form for editing
function prepareProjectForm(project) {
  document.getElementById("projectTitle").value = project.title || "";
  document.getElementById("projectDescription").value = project.description || "";
  document.getElementById("projectGithub").value = project.github || "";
  document.getElementById("projectLiveDemo").value = project.live_demo || "";
  document.getElementById("projectCategory").value = project.category || "";
  document.getElementById("projectImage").value = ""; // Clear file input

  document.getElementById("projectFormTitle").textContent = "Edit Project";
  document.querySelector("button[type='submit']").textContent = "Update Project";

  currentEditProjectId = project.id;
  currentEditProjectImage = project.image || "";

  // Scroll to form
  document.getElementById("projectForm").scrollIntoView({ behavior: "smooth" });
}

// Reset project form
function resetProjectForm() {
  document.getElementById("projectForm").reset();
  document.getElementById("projectFormTitle").textContent = "Add New Project";
  document.querySelector("button[type='submit']").textContent = "Save Project";
  currentEditProjectId = null;
  currentEditProjectImage = "";
}

// Handle project form submission
async function handleProjectFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("projectTitle").value.trim();
  const description = document.getElementById("projectDescription").value.trim();
  const github = document.getElementById("projectGithub").value.trim();
  const live_demo = document.getElementById("projectLiveDemo").value.trim();
  const category = document.getElementById("projectCategory").value.trim();
  const imageFile = document.getElementById("projectImage").files[0];

  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  try {
    let image = currentEditProjectId ? currentEditProjectImage : "";
    if (imageFile) {
      image = await uploadProjectImage(imageFile);
    }

    const payload = { title, description, github, live_demo, category, image };
    const url = currentEditProjectId ? `${API_BASE}/projects/${currentEditProjectId}` : `${API_BASE}/projects`;
    const method = currentEditProjectId ? "PUT" : "POST";

    const response = await fetchAdmin(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || `Project ${currentEditProjectId ? 'updated' : 'added'} successfully!`);
      resetProjectForm();
      loadAdminProjects();
    } else {
      alert(result.message || "Operation failed.");
    }
  } catch (error) {
    console.error("Project form submission failed:", error);
    alert("Operation failed. Please try again.");
  }
}

// Load editable hackathon/activity content
async function loadContentItems(type = currentContentType) {
  const container = document.getElementById("adminContentCards");
  if (!container) {
    return;
  }

  currentContentType = type;

  try {
    const response = await fetch(`${API_BASE}/content/${type}`);
    const items = response.ok ? await response.json() : [];
    const label = type === "hackathon" ? "hackathon" : "activity";

    container.innerHTML = "";

    if (!items.length) {
      container.innerHTML = `
        <div class="project-card">
          <h4>No ${label} items available</h4>
          <p>Use the form to add editable ${label} content.</p>
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      container.innerHTML += `
        <div class="project-card">
          <div>
            <h4>${item.title}</h4>
            <div class="project-meta">
              <span>${label}</span>
              <span>Order ${item.sort_order || 0}</span>
            </div>
            <p>${item.description}</p>
          </div>
          <div class="project-actions">
            <button type="button" class="btn secondary" data-content-action="edit" data-id="${item.id}">Edit</button>
            <button type="button" class="btn secondary" data-content-action="delete" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `;
    });

    container.querySelectorAll("button[data-content-action='edit']").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-id");
        const item = items.find((entry) => String(entry.id) === String(id));
        if (item) {
          prepareContentForm(item);
        }
      });
    });

    container.querySelectorAll("button[data-content-action='delete']").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-id");
        if (!confirm("Delete this item?")) {
          return;
        }

        const response = await fetchAdmin(`${API_BASE}/content/${currentContentType}/${id}`, {
          method: "DELETE"
        });

        const result = await response.json();
        if (response.ok) {
          alert(result.message || "Item deleted.");
          loadContentItems(currentContentType);
        } else {
          alert(result.message || "Delete failed.");
        }
      });
    });
  } catch (error) {
    console.error("Content load failed:", error);
    container.innerHTML = "<div class='project-card'><h4>Error loading content</h4></div>";
  }
}

function prepareContentForm(item) {
  document.getElementById("contentTitle").value = item.title || "";
  document.getElementById("contentDescription").value = item.description || "";
  document.getElementById("contentOrder").value = item.sort_order || "";
  document.getElementById("contentFormTitle").textContent = "Edit Section Item";
  document.querySelector("#contentForm button[type='submit']").textContent = "Update Item";

  currentEditContentId = item.id;
  document.getElementById("contentForm").scrollIntoView({ behavior: "smooth" });
}

function resetContentForm() {
  document.getElementById("contentForm").reset();
  document.getElementById("contentType").value = currentContentType;
  document.getElementById("contentFormTitle").textContent = "Add Hackathon / Activity";
  document.querySelector("#contentForm button[type='submit']").textContent = "Save Item";
  currentEditContentId = null;
}

async function handleContentFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("contentTitle").value.trim();
  const description = document.getElementById("contentDescription").value.trim();
  const sort_order = document.getElementById("contentOrder").value.trim();

  if (!title || !description) {
    alert("Title and description are required.");
    return;
  }

  try {
    const url = currentEditContentId
      ? `${API_BASE}/content/${currentContentType}/${currentEditContentId}`
      : `${API_BASE}/content/${currentContentType}`;
    const method = currentEditContentId ? "PUT" : "POST";

    const response = await fetchAdmin(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ title, description, sort_order })
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || `Item ${currentEditContentId ? "updated" : "added"} successfully!`);
      resetContentForm();
      loadContentItems(currentContentType);
    } else {
      alert(result.message || "Operation failed.");
    }
  } catch (error) {
    console.error("Content form submission failed:", error);
    alert("Operation failed. Please try again.");
  }
}
