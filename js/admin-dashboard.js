const API_BASE = ["localhost", "127.0.0.1"].includes(window.location.hostname)
  ? "http://localhost:5000/api"
  : "https://portfolio-backend-jkf3.onrender.com/api";
const API_ORIGIN = new URL(API_BASE).origin;
const contentConfig = {
  profile: {
    singular: "Profile",
    plural: "Profile",
    endpoint: `${API_BASE}/content/profile`,
    emptyText: "Use this section to update the home profile card."
  },
  project: {
    singular: "Project",
    plural: "Projects",
    endpoint: `${API_BASE}/projects`,
    emptyText: "Use the form to add dynamic portfolio projects.",
    hasYear: true
  },
  hackathon: {
    singular: "Hackathon",
    plural: "Hackathons",
    endpoint: `${API_BASE}/content/hackathon`,
    emptyText: "Use the form to add hackathon highlights."
  },
  activity: {
    singular: "Activity",
    plural: "Activities",
    endpoint: `${API_BASE}/content/activity`,
    emptyText: "Use the form to add technical activities."
  },
  "work-experience": {
    singular: "Work Experience",
    plural: "Work Experiences",
    endpoint: `${API_BASE}/content/work-experience`,
    emptyText: "Use the form to add work experience highlights."
  }
};

let currentContentType = "profile";
let currentEditId = null;
let currentEditImage = "";
let currentItems = [];

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  applyContentType("profile");

  if (localStorage.getItem("token")) {
    verifyToken();
  } else {
    showLoginModal();
  }
});

function setupEventListeners() {
  document.getElementById("loginForm")?.addEventListener("submit", handleLogin);
  document.getElementById("cancelLogin")?.addEventListener("click", () => {
    hideLoginModal();
    window.location.href = "index.html";
  });
  document.getElementById("logoutBtn")?.addEventListener("click", handleLogout);
  document.getElementById("contentForm")?.addEventListener("submit", handleContentFormSubmit);
  document.getElementById("resetContentForm")?.addEventListener("click", resetContentForm);

  document.getElementById("contentType")?.addEventListener("change", (event) => {
    applyContentType(event.target.value);
  });
  document.getElementById("profileImage")?.addEventListener("change", previewSelectedProfileImage);
  document.getElementById("profileImageUrl")?.addEventListener("input", (event) => {
    showProfilePreview(event.target.value.trim());
  });
}

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

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchAdmin(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...getAuthHeaders()
  };

  return fetch(url, { ...options, headers });
}

async function verifyToken() {
  try {
    const response = await fetchAdmin(`${API_BASE}/projects`);
    if (!response.ok) {
      throw new Error("Token invalid");
    }
    hideLoginModal();
  } catch (error) {
    console.error("Token verification failed:", error);
    localStorage.removeItem("token");
    showLoginModal();
  }
}

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

    if (!response.ok || !data.token) {
      alert(data.message || "Login failed. Please check your credentials.");
      return;
    }

    localStorage.setItem("token", data.token);
    hideLoginModal();
    loadContentItems();
    alert("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}

function applyContentType(type) {
  if (!contentConfig[type]) {
    return;
  }

  currentContentType = type;
  document.getElementById("contentType").value = type;

  resetContentForm();
  updateFormMode();
  loadContentItems();
}

function updateFormMode() {
  const isProject = currentContentType === "project";
  const isProfile = currentContentType === "profile";
  const hasGithub = currentContentType === "project" || currentContentType === "internship";
  const titleLabel = document.querySelector("label[for='contentTitle']");
  const titleInput = document.getElementById("contentTitle");
  const descriptionField = document.getElementById("contentDescription")?.closest(".form-field");
  const descriptionInput = document.getElementById("contentDescription");
  const projectFields = document.getElementById("projectFields");
  const yearField = document.getElementById("contentYear")?.closest(".form-field");
  const profileFields = document.getElementById("profileFields");
  const workExperienceFields = document.getElementById("workExperienceFields");
  const orderField = document.getElementById("contentOrderField");

  if (titleLabel) {
    titleLabel.textContent = isProfile ? "Profile Name" : "Title";
  }
  if (titleInput) {
    titleInput.placeholder = isProfile ? "Your display name" : "Item title";
  }
  if (descriptionField) {
    descriptionField.style.display = isProfile ? "none" : "block";
  }
  if (descriptionInput) {
    descriptionInput.required = !isProfile;
  }
  projectFields?.classList.toggle("active", isProject);
  if (yearField) {
    yearField.style.display = isProject ? "block" : "none";
  }
  if (workExperienceFields) {
    workExperienceFields.style.display = currentContentType === "work-experience" ? "block" : "none";
  }
  profileFields?.classList.toggle("active", isProfile);
  if (orderField) {
    orderField.style.display = (isProject || isProfile) ? "none" : "block";
  }
}

function resetContentForm() {
  const config = contentConfig[currentContentType];
  const form = document.getElementById("contentForm");

  form?.reset();
  document.getElementById("contentType").value = currentContentType;
  document.getElementById("contentFormTitle").textContent = `Add ${config.singular}`;
  document.querySelector("#contentForm button[type='submit']").textContent = `Save ${config.singular}`;

  currentEditId = null;
  currentEditImage = "";
  const profileImagePreview = document.getElementById("profileImagePreview");
  if (profileImagePreview) {
    profileImagePreview.removeAttribute("src");
    profileImagePreview.style.display = "none";
  }
  const profileImageUrl = document.getElementById("profileImageUrl");
  if (profileImageUrl) {
    profileImageUrl.value = "";
  }
  updateFormMode();
}

async function loadContentItems() {
  const config = contentConfig[currentContentType];
  const container = document.getElementById("adminContentCards");
  const title = document.getElementById("contentListTitle");

  if (!container) {
    return;
  }

  if (title) {
    title.textContent = config.plural;
  }

  try {
    const response = await fetch(config.endpoint);
    currentItems = response.ok ? await response.json() : [];

    container.innerHTML = "";

    if (!currentItems.length) {
      container.innerHTML = `
        <div class="project-card">
          <h4>No ${config.plural.toLowerCase()} available</h4>
          <p>${config.emptyText}</p>
        </div>
      `;
      return;
    }

    if (currentContentType === "profile") {
      const profile = currentItems[0];
      currentEditId = profile.id;
      currentEditImage = profile.description || "";
      document.getElementById("contentTitle").value = profile.title || "";
      document.getElementById("profileImageUrl").value = currentEditImage || "";
      showProfilePreview(currentEditImage);
    }

    currentItems.forEach((item) => {
      container.innerHTML += createCardMarkup(item, config);
    });

    container.querySelectorAll("[data-action='edit']").forEach((button) => {
      button.addEventListener("click", () => {
        const item = currentItems.find((entry) => String(entry.id) === String(button.dataset.id));
        if (item) {
          prepareContentForm(item);
        }
      });
    });

    container.querySelectorAll("[data-action='delete']").forEach((button) => {
      button.addEventListener("click", () => deleteContentItem(button.dataset.id));
    });
  } catch (error) {
    console.error("Content load failed:", error);
    container.innerHTML = "<div class='project-card'><h4>Error loading content</h4></div>";
  }
}

function createCardMarkup(item, config) {
  if (currentContentType === "profile") {
    return `
      <div class="project-card">
        <div>
          <h4>${escapeHtml(item.title || "Profile")}</h4>
          <div class="project-meta"><span>Home card</span>${item.description ? "<span>Photo set</span>" : ""}</div>
          <p>Profile name and photo used on the right-side home card.</p>
        </div>
        <div class="project-actions">
          <button type="button" class="btn secondary" data-action="edit" data-id="${item.id}">Edit</button>
        </div>
      </div>
    `;
  }

  const projectMeta = currentContentType === "project"
    ? `
      ${item.category ? `<span>Category: ${item.category}</span>` : ""}
      ${item.year ? `<span>${item.year}</span>` : ""}
      ${item.featured ? `<span>Featured</span>` : ""}
    `
    : `
      <span>${config.singular}</span>
      <span>Order ${item.sort_order || 0}</span>
      ${item.github ? "<span>GitHub available</span>" : ""}
    `;

  return `
    <div class="project-card">
      <div>
        <h4>${escapeHtml(item.title || "")}</h4>
        <div class="project-meta">${projectMeta}</div>
        <p>${escapeHtml(item.description || "")}</p>
      </div>
      <div class="project-actions">
        <button type="button" class="btn secondary" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" class="btn secondary" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    </div>
  `;
}

function prepareContentForm(item) {
  const config = contentConfig[currentContentType];

  if (currentContentType === "profile") {
    document.getElementById("contentTitle").value = item.title || "";
    currentEditId = item.id;
    currentEditImage = item.description || "";
    document.getElementById("profileImageUrl").value = currentEditImage || "";
    showProfilePreview(currentEditImage);
    document.getElementById("contentFormTitle").textContent = `Edit ${config.singular}`;
    document.querySelector("#contentForm button[type='submit']").textContent = `Update ${config.singular}`;
    document.getElementById("contentForm").scrollIntoView({ behavior: "smooth" });
    return;
  }

  document.getElementById("contentTitle").value = item.title || "";
  document.getElementById("contentDescription").value = item.description || "";
  document.getElementById("contentSubtitle").value = item.subtitle || "";
  document.getElementById("contentCategory").value = item.category || "";
  document.getElementById("contentYear").value = item.year || "";
  document.getElementById("contentTechStack").value = (item.techStack || []).join(", ");
  document.getElementById("contentHighlights").value = (item.highlights || []).join(", ");
  document.getElementById("contentMetrics").value = (item.metrics || []).join(", ");
  document.getElementById("contentGithubUrl").value = item.githubUrl || "";
  document.getElementById("contentLiveUrl").value = item.liveUrl || "";
  document.getElementById("contentFeatured").checked = item.featured || false;
  document.getElementById("contentImage").value = "";
  document.getElementById("contentSkills").value = (item.skills || []).join(", ");
  document.getElementById("contentFormTitle").textContent = `Edit ${config.singular}`;
  document.querySelector("#contentForm button[type='submit']").textContent = `Update ${config.singular}`;

  currentEditId = item.id;
  currentEditImage = item.image || "";
  document.getElementById("contentForm").scrollIntoView({ behavior: "smooth" });
}

async function handleContentFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("contentTitle").value.trim();
  const description = document.getElementById("contentDescription").value.trim();

  if (!title || (currentContentType !== "profile" && !description)) {
    alert("Title and description are required.");
    return;
  }

  try {
    const payload = currentContentType === "project"
      ? await buildProjectPayload(title, description)
      : currentContentType === "profile"
      ? await buildProfilePayload(title) 
      : buildSectionPayload(title, description);
    const config = contentConfig[currentContentType];
    const url = currentEditId ? `${config.endpoint}/${currentEditId}` : config.endpoint;
    const method = currentEditId ? "PUT" : "POST";

    const response = await fetchAdmin(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      alert(result.message || "Operation failed.");
      return;
    }

    alert(result.message || `${config.singular} ${currentEditId ? "updated" : "added"} successfully!`);
    resetContentForm();
    loadContentItems();
  } catch (error) {
    console.error("Content form submission failed:", error);
    alert(error.message || "Operation failed. Please try again.");
  }
}

async function buildProjectPayload(title, description) {
  const imageFile = document.getElementById("contentImage").files[0];
  let image = currentEditId ? currentEditImage : "";

  if (imageFile) {
    image = await uploadProjectImage(imageFile);
  }

  const toArray = (str) => str.split(',').map(s => s.trim()).filter(Boolean);

  return {
    title,
    description,
    subtitle: document.getElementById("contentSubtitle").value.trim(),
    category: document.getElementById("contentCategory").value.trim(),
    year: document.getElementById("contentYear").value.trim(),
    techStack: toArray(document.getElementById("contentTechStack").value),
    highlights: toArray(document.getElementById("contentHighlights").value),
    metrics: toArray(document.getElementById("contentMetrics").value),
    githubUrl: document.getElementById("contentGithubUrl").value.trim(),
    liveUrl: document.getElementById("contentLiveUrl").value.trim(),
    featured: document.getElementById("contentFeatured").checked,
    image
  };
}

async function buildProfilePayload(title) {
  const imageFile = document.getElementById("profileImage").files[0];
  const imageUrl = document.getElementById("profileImageUrl").value.trim();
  let image = imageUrl || (currentEditId ? currentEditImage : "");

  if (imageFile) {
    image = await uploadProjectImage(imageFile);
  }

  return {
    title,
    description: image
  };
}

function resolveMediaUrl(url) {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return url.startsWith("/") ? `${API_ORIGIN}${url}` : url;
}

function showProfilePreview(url) {
  const preview = document.getElementById("profileImagePreview");
  if (!preview) {
    return;
  }

  if (!url) {
    preview.removeAttribute("src");
    preview.style.display = "none";
    return;
  }

  preview.src = resolveMediaUrl(url);
  preview.style.display = "block";
}

function previewSelectedProfileImage(event) {
  const file = event.target.files[0];
  const preview = document.getElementById("profileImagePreview");
  if (!file || !preview) {
    return;
  }

  preview.src = URL.createObjectURL(file);
  preview.style.display = "block";
}

function buildSectionPayload(title, description) {
  const payload = {
    title,
    description,
    sort_order: document.getElementById("contentOrder").value.trim()
  };
  
  if (currentContentType === "work-experience") {
    const skills = document.getElementById("contentSkills").value.trim();
    payload.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
  }
  return payload;
}

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

async function deleteContentItem(id) {
  const config = contentConfig[currentContentType];
  if (!confirm(`Delete this ${config.singular.toLowerCase()}?`)) {
    return;
  }

  try {
    const response = await fetchAdmin(`${config.endpoint}/${id}`, {
      method: "DELETE"
    });
    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Delete failed.");
      return;
    }

    alert(result.message || `${config.singular} deleted.`);
    loadContentItems();
  } catch (error) {
    console.error("Delete failed:", error);
    alert("Delete failed. Please try again.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
