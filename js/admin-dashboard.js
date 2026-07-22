const API_BASE = "https://portfolio-backend-jkf3.onrender.com/api";
const contentConfig = {
  profile: {
    singular: "Profile",
    plural: "Profile",
    endpoint: `${API_BASE}/content/profile`,
    emptyText: "Update your profile photo here.",
    hasImage: true
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
let croppedImageDataUrl = null;
let cropper = null;
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

  document.getElementById("contentImage")?.addEventListener("change", handleImageFileSelect);
  document.getElementById("cropImageBtn")?.addEventListener("click", handleCrop);
  document.getElementById("cancelCropBtn")?.addEventListener("click", cancelCrop);
}

function handleImageFileSelect(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    openCropperModal(e.target.result);
  };
  reader.readAsDataURL(file);
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
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  if (!username || !password) {
    errorEl.textContent = "Please enter both username and password.";
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
      errorEl.textContent = data.message || "Login failed. Please check your credentials.";
      return;
    }

    localStorage.setItem("token", data.token);
    hideLoginModal();
    loadContentItems();
    alert("Login successful!");
  } catch (error) {
    console.error("Login error:", error);
    errorEl.textContent = "Login failed. Please try again.";
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
  const isWorkExperience = currentContentType === "work-experience";

  const titleLabel = document.querySelector("label[for='contentTitle']");
  const titleInput = document.getElementById("contentTitle");
  const descriptionField = document.getElementById("contentDescription")?.closest(".form-field");
  const descriptionInput = document.getElementById("contentDescription");
  const projectFields = document.getElementById("projectFields");
  const imageFieldWrapper = document.getElementById("contentOrderField"); // This div wraps the image uploader
  const workExperienceFields = document.getElementById("workExperienceFields");
  const orderField = document.getElementById("sortOrderField");

  // --- Default States (Hide everything complex) ---
  projectFields.style.display = "none";
  imageFieldWrapper.style.display = "none";
  workExperienceFields.style.display = "none";
  orderField.style.display = "none";
  descriptionField.style.display = "block";

  // --- Configure based on type ---
  titleLabel.textContent = isProfile ? "Profile Name" : "Title";
  titleInput.placeholder = isProfile ? "Your Name" : "Item title";
  titleInput.required = !isProfile; // Profile name can be optional, has a default

  if (isProfile) {
    descriptionField.style.display = "none";
    imageFieldWrapper.style.display = "block";
  } else if (isProject) {
    projectFields.style.display = "block";
    imageFieldWrapper.style.display = "block";
  } else if (isWorkExperience) {
    workExperienceFields.style.display = "block";
    orderField.style.display = "block";
  } else { // For hackathon, activity
    orderField.style.display = "block";
  }
  updateImagePreview(""); // Clear preview on mode change
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
  updateFormMode();
  croppedImageDataUrl = null;
  updateImagePreview("");
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
    const response = await fetch(config.endpoint, { cache: "no-store" });
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

    currentItems.forEach((item) => {
      container.innerHTML += createCardMarkup(item, config);
    });

    if (currentContentType === "profile" && currentItems.length > 0) {
      prepareContentForm(currentItems[0]);
    } else if (currentContentType === "profile") {
      // If no profile item exists, prepare form for creation
      prepareContentForm({
        id: null,
        title: "T Srivatsankith", // Default name
        description: ""
      });
    }

    if (currentContentType === "profile") {
      document.getElementById("contentList").style.display = "none";
    } else {
      document.getElementById("contentList").style.display = "block";
    }

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
          <h4>Current Profile</h4>
          <p>Name: ${escapeHtml(item.title || "Not set")}</p>
          <p>Image URL: ${escapeHtml(item.description || "Not set")}</p>
          ${item.description ? `<img src="${item.description}" alt="Profile Preview" style="max-width: 100px; margin-top: 10px;">` : ''}
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
    currentEditId = item.id; // Can be null for creation
    currentEditImage = item.description || ""; // Image URL is in description
  } else {
    currentEditId = item.id;
    currentEditImage = item.image || "";
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
  updateImagePreview(currentEditImage);
  document.getElementById("contentSkills").value = (item.skills || []).join(", ");
  document.getElementById("contentFormTitle").textContent = `Edit ${config.singular}`;
  document.querySelector("#contentForm button[type='submit']").textContent = `Update ${config.singular}`;

  document.getElementById("contentForm").scrollIntoView({ behavior: "smooth" });
}

async function handleContentFormSubmit(event) {
  event.preventDefault();

  const title = document.getElementById("contentTitle").value.trim();
  const description = document.getElementById("contentDescription").value.trim();
  const isProfile = currentContentType === "profile";

  if (!isProfile && (!title || !description)) {
      alert("Title and description are required.");
      return;
  }

  try {
    let payload;
    if (isProfile) {
      payload = await buildProfilePayload(title);
    } else if (currentContentType === "project") {
      payload = await buildProjectPayload(title, description);
    } else {
      payload = buildSectionPayload(title, description);
    }

    const config = contentConfig[currentContentType];
    
    // For profile, always use the POST endpoint which handles upsert (create or update).
    // For other types, use PUT for updates and POST for creation.
    const isProfileUpdate = isProfile;
    const url = !isProfileUpdate && currentEditId ? `${config.endpoint}/${currentEditId}` : config.endpoint;
    const method = !isProfileUpdate && currentEditId ? "PUT" : "POST";

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

async function buildProfilePayload(title) {
  let imageUrl = currentEditImage;

  if (croppedImageDataUrl) {
    imageUrl = croppedImageDataUrl;
  }

  return {
    title: title || "T Srivatsankith", // Default title
    description: imageUrl, // The image URL is the description
  };
}

async function buildProjectPayload(title, description) {
  let image = currentEditId ? currentEditImage : "";

  if (croppedImageDataUrl) {
    image = croppedImageDataUrl;
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

function buildSectionPayload(title, description) {
  // Profile is handled separately, so this is for other content types
  if (currentContentType === "profile") {
    return {};
  }

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

function updateImagePreview(url) {
  const preview = document.getElementById("imagePreview");
  if (!preview) return;

  preview.style.backgroundImage = url ? `url('${url}')` : "none";
}

function openCropperModal(imageSrc) {
  const modal = document.getElementById("cropperModal");
  const image = document.getElementById("imageToCrop");
  if (!modal || !image) return;

  image.src = imageSrc;
  modal.style.display = "block";

  if (cropper) {
    cropper.destroy();
  }

  cropper = new Cropper(image, {
    aspectRatio: 1,
    viewMode: 1,
    background: false,
    autoCropArea: 0.8,
  });
}

function handleCrop() {
  if (!cropper) return;

  cropper.getCroppedCanvas({ width: 512, height: 512 }).toBlob((blob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      croppedImageDataUrl = reader.result; // This is the Base64 data URL
      updateImagePreview(croppedImageDataUrl);
      closeCropperModal();
    };
    reader.readAsDataURL(blob);
  }, "image/png");
}

function cancelCrop() {
  document.getElementById("contentImage").value = ""; // Reset file input
  closeCropperModal();
}

function closeCropperModal() {
  document.getElementById("cropperModal").style.display = "none";
  if (cropper) cropper.destroy();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
