const body = document.body;
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const miniBtn = document.getElementById("mini-chitti-btn");
const miniPanel = document.getElementById("mini-chitti-panel");
const miniInput = document.getElementById("mini-chatbox");
const miniMic = document.getElementById("mini-mic");
const miniSend = document.getElementById("mini-send");
const miniChat = document.getElementById("mini-chat-status");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
const synth = "speechSynthesis" in window ? window.speechSynthesis : null;
let isListening = false;
let pendingSpeech = "";
let lastTopic = "about";

const API_BASE = "https://portfolio-backend-jkf3.onrender.com";
const API_ORIGIN = new URL(API_BASE).origin;

function setMenuState(isOpen) {
  body.classList.toggle("menu-open", isOpen);
  navToggle?.setAttribute("aria-expanded", String(isOpen));
}

navToggle?.addEventListener("click", () => {
  const isOpen = !body.classList.contains("menu-open");
  setMenuState(isOpen);
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth <= 900) {
      setMenuState(false);
    }
  });
});

document.querySelectorAll(".skill-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.skillTab;

    document.querySelectorAll(".skill-tab").forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll(".skill-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.skillPanel === target);
    });
  });
});

document.querySelectorAll(".project-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.projectTab;

    document.querySelectorAll(".project-tab").forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    document.querySelectorAll(".project-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.dataset.projectPanel === target);
    });
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && body.classList.contains("menu-open")) {
    setMenuState(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

function addUser(text) {
  if (!miniChat) {
    return;
  }

  const bubble = document.createElement("div");
  bubble.className = "mini-bubble user";
  bubble.innerText = text;
  miniChat.appendChild(bubble);
  autoScroll();
}

function addBotMessage(text, options = {}) {
  if (!miniChat) {
    return;
  }

  const { speak = false, spokenText = text } = options;
  const bubble = document.createElement("div");
  bubble.className = "mini-bubble bot";
  bubble.innerText = text;
  miniChat.appendChild(bubble);
  autoScroll();

  if (speak) {
    speakBot(spokenText);
  }
}

function autoScroll() {
  if (!miniChat) {
    return;
  }

  miniChat.scrollTop = miniChat.scrollHeight;
}

function speakBot(text) {
  if (!synth || !text) {
    return;
  }

  if (isListening) {
    pendingSpeech = text;
    return;
  }

  synth.cancel();
  pendingSpeech = "";

  const spokenText = text
    .replace(/\bCHITTI\b/gi, "Chittee")
    .replace(/\bAI\/ML\b/gi, "A I and M L")
    .replace(/\bAI\b/g, "A I")
    .replace(/\bML\b/g, "M L");

  const utterance = new SpeechSynthesisUtterance(spokenText);
  utterance.rate = 0.94;
  utterance.pitch = 1;
  utterance.volume = 1;

  const preferredVoice = synth.getVoices().find((voice) =>
    /en/i.test(voice.lang) && /aria|samantha|google us english|zira|jenny/i.test(voice.name)
  ) || synth.getVoices().find((voice) => /en/i.test(voice.lang));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  try {
    synth.speak(utterance);
  } catch (error) {
    console.warn("Speech synthesis failed:", error);
  }
}

function setMiniPanelState(isOpen) {
  if (!miniPanel) {
    return;
  }

  miniPanel.style.display = isOpen ? "flex" : "none";

  if (isOpen && miniChat.children.length === 0) {
    addBotMessage(
      "Hi, I'm CHITTI. Ask me anything about Srivatsankith like his background, skills, projects, education, contact details, or internship interests.",
      { speak: false }
    );
  }

  if (isOpen) {
    miniInput.focus();
  }
}

function toggleMiniPanel() {
  const isOpen = miniPanel?.style.display === "flex";
  setMiniPanelState(!isOpen);
}

const sectionMap = {
  home: "#home",
  about: "#about",
  skills: "#skills",
  projects: "#projects",
  hackathons: "#hackathons",
  "work-experience": "#work-experience",
  activities: "#activities",
  experience: "#experience",
  journey: "#experience",
  contact: "#contact",
  admin: "#admin"
};

const externalLinks = {
  github: "https://github.com/Srivatsankith",
  linkedin: "https://www.linkedin.com/in/srivatsankith/",
  resume: "https://drive.google.com/drive/u/0/folders/1bB2v7D6aOZB1S3fjvYrxiQQJ36ME9q1s"
};

const topicAliases = {
  home: ["home", "start", "top", "main page"],
  about: ["about", "background", "who is", "introduce", "yourself", "his profile"],
  skills: ["skill", "skills", "tech stack", "technologies", "tools", "languages"],
  projects: ["project", "projects", "work", "portfolio", "built", "build"],
  hackathons: ["hackathon", "hackathons", "coding challenge", "sprint", "prototype"],
  "work-experience": ["internship", "internships", "training", "work experience", "opportunity", "experience"],
  activities: ["activity", "activities", "participation", "community", "learning"],
  experience: ["journey", "experience", "education", "study", "studies", "college", "school", "cgpa"],
  contact: ["contact", "email", "phone", "reach", "connect", "location", "resume", "linkedin", "github"]
};

const conversationEntries = [
  {
    id: "chitti-self",
    section: null,
    phrases: [
      "who are you",
      "what are you",
      "who created you",
      "who made you",
      "who built you",
      "tell me about yourself",
      "introduce yourself",
      "who is chitti",
      "what is chitti"
    ],
    keywords: ["who", "what", "yourself", "chitti", "created", "made", "built"],
    response:
      "I am CHITTI, the portfolio assistant for Srivatsankith. I was created by Srivatsankith, and I can answer questions about his background, skills, projects, education, internship interests, and contact details, and I can also guide you to the right section.",
    spokenText:
      "I am Chittee, the portfolio assistant for Srivatsankith. I was created by Srivatsankith, and I can answer questions about his background, skills, projects, education, internship interests, and contact details, and I can also guide you to the right section."
  },
  {
    id: "intro",
    section: "about",
    phrases: [
      "who is ankith",
      "who is srivatsankith",
      "tell me about ankith",
      "tell me about srivatsankith",
      "introduce ankith",
      "introduce srivatsankith",
      "about ankith",
      "about srivatsankith",
      "who is he"
    ],
    keywords: ["who", "about", "introduce", "ankith", "srivatsankith"],
    response:
      "Srivatsankith is a third-year B.Tech student in Information Science and Engineering at M S Ramaiah University of Applied Sciences, Bengaluru. He focuses on AI, Machine Learning, and building practical intelligent systems through hands-on projects.",
    spokenText:
      "Srivatsankith is a third year B Tech student in Information Science and Engineering at M S Ramaiah University of Applied Sciences, Bengaluru. He focuses on artificial intelligence, machine learning, and building practical intelligent systems through hands on projects."
  },
  {
    id: "education",
    section: "experience",
    phrases: [
      "where does he study",
      "where do you study",
      "which college",
      "what college",
      "what university",
      "educational background",
      "tell me about his education"
    ],
    keywords: ["college", "university", "study", "education", "student", "btech", "ise"],
    response:
      "He is pursuing B.Tech in Information Science and Engineering at M S Ramaiah University of Applied Sciences in Bengaluru. Before that, he completed ICSE at New Baldwin International School with 95% and PUC at Whitefield Global PU College with 80%.",
    spokenText:
      "He is pursuing B Tech in Information Science and Engineering at M S Ramaiah University of Applied Sciences in Bengaluru. Before that, he completed I C S E at New Baldwin International School with ninety five percent and P U C at Whitefield Global P U College with eighty percent."
  },
  {
    id: "cgpa",
    section: "experience",
    phrases: ["what is his cgpa", "cgpa", "gpa", "grade point"],
    keywords: ["cgpa", "gpa", "grade"],
    response: "His current CGPA is 8.2.",
    spokenText: "His current C G P A is eight point two."
  },
  {
    id: "skills",
    section: "skills",
    phrases: [
      "what are his skills",
      "what skills do you have",
      "tell me about his skills",
      "what technologies does he know",
      "what is his tech stack"
    ],
    keywords: ["skills", "skill", "tech", "stack", "tools", "languages", "know"],
    response:
      "His skills include Python, Java, C, JavaScript, Machine Learning, TensorFlow, Scikit-learn, Flask, Git, GitHub, OpenCV, and Generative AI. He also works across web development and practical AI system building.",
    spokenText:
      "His skills include Python, Java, C, JavaScript, machine learning, TensorFlow, Scikit learn, Flask, Git, GitHub, Open C V, and generative A I. He also works across web development and practical A I system building."
  },
  {
    id: "interests",
    section: "about",
    phrases: [
      "what are his interests",
      "what is he interested in",
      "what do you like working on",
      "what domains does he like",
      "areas of interest"
    ],
    keywords: ["interest", "interested", "like", "passion", "domains", "focus", "areas"],
    response:
      "He is especially interested in Machine Learning, Generative AI, computer vision, and building end-to-end intelligent applications that solve real-world problems.",
    spokenText:
      "He is especially interested in machine learning, generative A I, computer vision, and building end to end intelligent applications that solve real world problems."
  },
  {
    id: "projects-overview",
    section: "projects",
    phrases: [
      "what projects has he built",
      "tell me about his projects",
      "show projects",
      "what has he worked on",
      "what did he build"
    ],
    keywords: ["projects", "project", "built", "work", "portfolio"],
    response:
      "He has built MedGraphX, CHITTI Voice Assistant AI, a Facial Recognition System, and a Real Time Hand Gesture Recognition project. Most of his work combines AI, computer vision, or intelligent user interaction.",
    spokenText:
      "He has built MedGraph X, Chittee Voice Assistant A I, a facial recognition system, and a real time hand gesture recognition project. Most of his work combines A I, computer vision, or intelligent user interaction."
  },
  {
    id: "medgraphx",
    section: "projects",
    phrases: [
      "medgraphx",
      "medical assistant project",
      "healthcare project",
      "medical ai project",
      "tell me about medgraphx",
      "what is medgraphx",
      "what does medgraphx do"
    ],
    keywords: ["medgraphx", "medical", "healthcare", "assistant", "health"],
    response:
      "MedGraphX is an AI-powered medical assistant platform designed to help users understand health conditions, visualize medical insights, and interact with a more intelligent healthcare support experience.",
    spokenText:
      "MedGraph X is an A I powered medical assistant platform designed to help users understand health conditions, visualize medical insights, and interact with a more intelligent healthcare support experience."
  },
  {
    id: "chitti-project",
    section: "projects",
    phrases: [
      "chitti",
      "voice assistant project",
      "gemini project",
      "personal ai assistant",
      "tell me about chitti project",
      "what is chitti project",
      "what does chitti do"
    ],
    keywords: ["chitti", "voice", "assistant", "gemini", "speech"],
    response:
      "CHITTI is his personal AI voice assistant built with Python and the Google Gemini API. It includes speech recognition and text-to-speech features for a conversational assistant experience.",
    spokenText:
      "Chittee is his personal A I voice assistant built with Python and the Google Gemini A P I. It includes speech recognition and text to speech features for a conversational assistant experience."
  },
  {
    id: "facial-recognition",
    section: "projects",
    phrases: [
      "facial recognition",
      "face recognition project",
      "opencv face project",
      "tell me about facial recognition project",
      "what is facial recognition project",
      "what does facial recognition project do"
    ],
    keywords: ["facial", "face", "recognition", "opencv"],
    response:
      "His Facial Recognition System is a real-time computer vision project built using OpenCV for identifying faces in live input.",
    spokenText:
      "His facial recognition system is a real time computer vision project built using Open C V for identifying faces in live input."
  },
  {
    id: "hand-gesture",
    section: "projects",
    phrases: [
      "hand gesture",
      "gesture recognition",
      "hand tracking project",
      "tell me about hand gesture project",
      "what is hand gesture project",
      "what does hand gesture recognition do"
    ],
    keywords: ["hand", "gesture", "recognition", "tracking"],
    response:
      "He also built a Real Time Hand Gesture Recognition system using OpenCV and computer vision techniques.",
    spokenText:
      "He also built a real time hand gesture recognition system using Open C V and computer vision techniques."
  },
  {
    id: "internship",
    section: "work-experience",
    phrases: [
      "is he looking for internship",
      "is he open to internship",
      "internship status",
      "looking for opportunities",
      "is he available for internship",
      "internships",
      "show internships"
    ],
    keywords: ["internship", "opportunity", "opportunities", "available", "seeking"],
    response:
      "Yes. He is actively seeking AI and Machine Learning internship opportunities. His internship focus includes machine learning, computer vision, Generative AI, Flask, OpenCV, and practical intelligent web applications.",
    spokenText:
      "Yes. He is actively seeking artificial intelligence and machine learning internship opportunities. His internship focus includes machine learning, computer vision, generative A I, Flask, Open C V, and practical intelligent web applications."
  },
  {
    id: "hackathons",
    section: "hackathons",
    phrases: [
      "hackathon",
      "hackathons",
      "tell me about his hackathons",
      "has he done hackathons",
      "coding challenge",
      "prototype building"
    ],
    keywords: ["hackathon", "hackathons", "challenge", "prototype", "sprint", "collaboration"],
    response:
      "He enjoys hackathons and coding sprints because they help him turn ideas into working prototypes quickly. His hackathon work focuses on AI prototypes, problem-solving under time limits, and team collaboration.",
    spokenText:
      "He enjoys hackathons and coding sprints because they help him turn ideas into working prototypes quickly. His hackathon work focuses on A I prototypes, problem solving under time limits, and team collaboration."
  },
  {
    id: "activities",
    section: "activities",
    phrases: [
      "activities",
      "what activities does he do",
      "technical activities",
      "community participation",
      "project based learning"
    ],
    keywords: ["activities", "activity", "community", "learning", "participation", "practice"],
    response:
      "His activities include AI and ML exploration, project-based learning, coding practice, peer learning, and participation in technical discussions and collaborative development.",
    spokenText:
      "His activities include A I and machine learning exploration, project based learning, coding practice, peer learning, and participation in technical discussions and collaborative development."
  },
  {
    id: "contact",
    section: "contact",
    phrases: [
      "how can i contact him",
      "how to contact",
      "contact details",
      "reach out",
      "get in touch"
    ],
    keywords: ["contact", "reach", "touch", "connect"],
    response:
      "You can contact him through the contact section for email, phone, LinkedIn, GitHub, and resume links.",
    spokenText:
      "You can contact him through the contact section for email, phone, LinkedIn, GitHub, and resume links."
  },
  {
    id: "email",
    section: "contact",
    phrases: ["email", "mail id", "email address"],
    keywords: ["email", "mail"],
    response: "His email is srivatsankith.toopurani@gmail.com.",
    spokenText: "His email is srivatsankith dot toopurani at gmail dot com."
  },
  {
    id: "phone",
    section: "contact",
    phrases: ["phone number", "mobile number", "contact number", "call him"],
    keywords: ["phone", "mobile", "number", "call"],
    response: "His phone number is +91 9110883758.",
    spokenText: "His phone number is plus nine one, nine one one zero eight eight three seven five eight."
  },
  {
    id: "location",
    section: "contact",
    phrases: ["where is he from", "where is he located", "location", "based in"],
    keywords: ["location", "located", "based", "from", "bengaluru"],
    response: "He is based in Bengaluru, India.",
    spokenText: "He is based in Bengaluru, India."
  },
  {
    id: "linkedin",
    section: "contact",
    phrases: ["linkedin", "professional profile", "linked in"],
    keywords: ["linkedin", "professional", "profile"],
    response: "His LinkedIn profile is available in the contact section, and I can open it for you.",
    spokenText: "His LinkedIn profile is available in the contact section, and I can open it for you."
  },
  {
    id: "github",
    section: "contact",
    phrases: ["github", "git hub", "code profile", "repositories"],
    keywords: ["github", "git", "repository", "repositories", "code"],
    response: "His GitHub profile is available in the contact section, and I can open it for you.",
    spokenText: "His GitHub profile is available in the contact section, and I can open it for you."
  },
  {
    id: "resume",
    section: "contact",
    phrases: ["resume", "cv"],
    keywords: ["resume", "cv"],
    response: "His resume link is available in the contact section, and I can open it for you.",
    spokenText: "His resume link is available in the contact section, and I can open it for you."
  }
];

function openSectionFromChat(sectionKey) {
  const targetSection = document.querySelector(sectionMap[sectionKey]);
  if (!targetSection) {
    return;
  }

  setMenuState(false);
  window.location.hash = targetSection.id;
  requestAnimationFrame(() => {
    targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  setMiniPanelState(false);
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

function setProfileInitials(name) {
  const profileInitials = document.getElementById("profileInitials");
  if (!profileInitials) {
    return;
  }

  profileInitials.textContent = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SR";
}

async function loadProfileData() {
  const profileImage = document.querySelector(".hero-profile-image img");
  const profileImageWrapper = profileImage?.closest(".hero-profile-image");
  const profileName = document.getElementById("heroProfileName");

  profileImageWrapper?.classList.remove("has-photo");

  if (profileImage) {
    profileImage.addEventListener("error", () => {
      profileImage.removeAttribute("src");
      profileImageWrapper?.classList.remove("has-photo");
    }, { once: true });
  }

  try {
    const response = await fetch(`${API_BASE}/content/profile`, { cache: "no-store" });
    const profileItems = response.ok ? await response.json() : [];
    const profile = profileItems.find((item) => item.description) || profileItems[0];

    if (!profile) {
      setProfileInitials(profileName?.textContent || "T Srivatsankith");
      return;
    }

    setProfileInitials(profileName?.textContent || "T Srivatsankith");

    if (profile.description && profileImage) {
      profileImage.src = resolveMediaUrl(profile.description);
      profileImageWrapper?.classList.add("has-photo");
    }
  } catch (error) {
    console.error("Profile load failed:", error);
    setProfileInitials(profileName?.textContent || "T Srivatsankith");
  }
}

async function loadProjects() {
  const gridContainer = document.querySelector("#projects .project-grid");
  const filterContainer = document.querySelector("#projects .project-filters");

  if (!gridContainer || !filterContainer) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/projects`);
    const allProjects = response.ok ? await response.json() : [];

    const mainCategories = {
      "AI/ML": ["ai/ml", "ai", "ml", "computer vision", "nlp", "generative ai", "data science"],
      "Full Stack": ["full stack", "web"],
    };

    const getProjectMainCategory = (project) => {
      const projectCat = project.category?.toLowerCase() || "";
      for (const mainCat in mainCategories) {
        if (mainCategories[mainCat].includes(projectCat)) {
          return mainCat;
        }
      }
      return null;
    };

    const projects = allProjects.map(p => ({ ...p, mainCategory: getProjectMainCategory(p) }));

    const displayCategories = ["All", ...new Set(projects.map(p => p.mainCategory).filter(Boolean))];

    renderFilters(displayCategories);
    renderProjects(projects);

    filterContainer.addEventListener("click", (event) => {
      if (event.target.matches(".project-filter")) {
        const selectedCategory = event.target.dataset.category;

        filterContainer.querySelector(".active")?.classList.remove("active");
        event.target.classList.add("active");

        const filteredProjects =
          selectedCategory === "All"
            ? projects
            : projects.filter((p) => p.mainCategory === selectedCategory);
        renderProjects(filteredProjects);
      }
    });
  } catch (error) {
    console.error("Project load failed:", error);
    gridContainer.innerHTML = `<p class="error-message">Failed to load projects.</p>`;
  }

  function renderFilters(categories) {
    if (categories.length <= 2) {
      filterContainer.style.display = "none";
      return;
    }
    filterContainer.innerHTML = categories
      .map(
        (cat, i) =>
          `<button class="project-filter ${i === 0 ? "active" : ""}" data-category="${cat}">${cat}</button>`
      )
      .join("");
  }

  function renderProjects(projectsToRender) {
    gridContainer.innerHTML = "";
    if (!projectsToRender.length) {
      gridContainer.innerHTML = `<p class="info-message">No projects found for this category.</p>`;
      return;
    }

    projectsToRender.forEach((project) => {
      const card = document.createElement("div");
      card.className = "card project-card";
      card.dataset.category = project.category || "";

      const techStackHtml = project.techStack?.length
        ? `<div class="tech-stack">${project.techStack.map((tech) => `<span class="tech-chip">${tech}</span>`).join("")}</div>`
        : "";

      const highlightsHtml = project.highlights?.length
        ? `<ul class="project-highlights">${project.highlights.map((item) => `<li>✓ ${item}</li>`).join("")}</ul>`
        : "";

      const metricsHtml = project.metrics?.length
        ? `<div class="project-metrics">${project.metrics.map((item) => `<span>${item}</span>`).join("")}</div>`
        : "";

      const githubLogo = `<svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52 0-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.49 7.49 0 0 1 8 4.69c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;

      card.innerHTML = `
        <div class="project-image-wrapper">
          ${project.image ? `<img src="${resolveMediaUrl(project.image)}" alt="${project.title}" loading="lazy">` : ""}
          ${project.featured ? `<div class="featured-badge">Featured</div>` : ""}
        </div>
        <div class="card-content">
          <h3 class="project-title">${project.title}</h3>
          ${project.subtitle ? `<p class="project-subtitle">${project.subtitle}</p>` : ""}
          <p class="project-description">${project.description}</p>
          ${techStackHtml}
          ${highlightsHtml}
          ${metricsHtml}
          <div class="card-actions">
            ${project.github ? `<a href="${project.github}" target="_blank" rel="noopener noreferrer" class="btn-icon" aria-label="GitHub">${githubLogo}</a>` : ""}
            ${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Live Demo</a>` : ""}
            ${project.videoUrl ? `<a href="${project.videoUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Video</a>` : ""}
          </div>
        </div>
      `;
      gridContainer.appendChild(card);
    });
  }
}

function renderHackathonItems(items) {
  const container = document.querySelector("#hackathons .hackathon-grid");
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="info-card">
        <h3>No hackathons yet</h3>
        <p>Hackathon content will appear here when added from the admin dashboard.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = ""; // Clear existing content

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "hackathon-card";
    
    const statusClass = (item.status || "").toLowerCase().replace(/\s+/g, '-');
    if (statusClass) {
      card.classList.add(`status-${statusClass}`);
    }

    const techStackHtml = item.techStack?.length
      ? `<div class="tech-stack">${item.techStack.map((tech) => `<span class="tech-chip">${tech}</span>`).join("")}</div>`
      : "";

    const achievementsHtml = item.achievements?.length
      ? `<ul class="hackathon-achievements">${item.achievements.map((ach) => `<li>${ach}</li>`).join("")}</ul>`
      : "";

    const githubLogo = `<svg viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8a8.01 8.01 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52 0-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.49 7.49 0 0 1 8 4.69c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>`;

    card.innerHTML = `
      <div class="hackathon-card-content">
        <div class="hackathon-header">
          <div class="hackathon-title-group">
            <h3 class="hackathon-title">${item.title}</h3>
            ${item.organization ? `<p class="hackathon-org">${item.organization}${item.year ? `, ${item.year}` : ''}</p>` : ''}
          </div>
          ${item.status ? `<div class="status-badge">${item.status}</div>` : ''}
        </div>
        ${item.projectName ? `<h4 class="hackathon-project-name">${item.projectName}</h4>` : ''}
        <p class="hackathon-description">${item.description}</p>
        ${achievementsHtml}
        ${techStackHtml}
      </div>
      <div class="hackathon-actions">
        ${item.githubUrl ? `<a href="${item.githubUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon" aria-label="GitHub">${githubLogo}</a>` : ''}
        ${item.certificateUrl ? `<a href="${item.certificateUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Certificate</a>` : ''}
        ${item.presentationUrl ? `<a href="${item.presentationUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Presentation</a>` : ''}
        ${item.galleryUrl ? `<a href="${item.galleryUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Gallery</a>` : ''}
        ${item.videoUrl ? `<a href="${item.videoUrl}" target="_blank" rel="noopener noreferrer" class="btn-text">Video</a>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderActivityItems(items) {
  const container = document.querySelector("#activities .activity-list");
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="activity-item">
        <span>01</span>
        <div>
          <h3>No activities yet</h3>
          <p>Activity content will appear here when added from the admin dashboard.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map(
      (item, index) => `
        <div class="activity-item">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
          </div>
        </div>
      `
    )
    .join("");
}

function renderInternshipItems(items) {
  const container = document.querySelector("#work-experience .activity-list");
  if (!container) {
    return;
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="activity-item">
        <span>01</span>
        <div>
          <h3>No internships yet</h3>
          <p>Internship content will appear here when added from the admin dashboard.</p>
        </div>
      </div>
    `;
    return;
  }

  const skillsHtml = (skills) => {
    if (!skills || !skills.length) return "";
    return `<div class="work-skills"><strong>Skills:</strong> ${skills.join(", ")}</div>`;
  };

  container.innerHTML = items
    .map(
      (item, index) => `
        <div class="activity-item">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            ${skillsHtml(item.skills)}
          </div>
        </div>
      `
    )
    .join("");
}

async function loadEditableSections() {
  try {
    const [hackathonResponse, internshipResponse, activityResponse] = await Promise.all([
      fetch(`${API_BASE}/content/hackathon`),
      fetch(`${API_BASE}/content/work-experience`),
      fetch(`${API_BASE}/content/activity`)
    ]);

    if (hackathonResponse.ok) {
      renderHackathonItems(await hackathonResponse.json());
    }

    if (internshipResponse.ok) {
      renderInternshipItems(await internshipResponse.json());
    }

    if (activityResponse.ok) {
      renderActivityItems(await activityResponse.json());
    }
  } catch (error) {
    console.error("Editable section load failed:", error);
  }
}

async function handleContactSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    message: document.getElementById("message").value.trim()
  };

  try {
    const response = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    alert(result.message || "Message sent.");

    if (response.ok) {
      form.reset();
    }
  } catch (error) {
    console.error("Contact submission failed:", error);
    alert("Unable to send message right now. Please try again later.");
  }
}

function handleAdminLogin() {
  // Redirect to admin page - login will be handled there
  window.location.href = "admin.html";
}

function normalizeCommand(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesAny(query, items = []) {
  return items.some((item) => query.includes(item));
}

function countKeywordMatches(query, keywords = []) {
  return keywords.reduce((count, keyword) => count + (query.includes(keyword) ? 1 : 0), 0);
}

function findSectionIntent(query) {
  return Object.entries(topicAliases).find(([, aliases]) =>
    aliases.some((alias) => query.includes(alias))
  )?.[0];
}

function findExternalIntent(query) {
  if (includesAny(query, ["linkedin", "linked in", "professional profile"])) {
    return "linkedin";
  }

  if (includesAny(query, ["github", "git hub", "repository profile", "code profile"])) {
    return "github";
  }

  if (includesAny(query, ["resume", "cv"])) {
    return "resume";
  }

  return null;
}

function wantsToOpenLink(query) {
  return includesAny(query, ["open", "show", "take me to", "go to", "visit", "launch"]);
}

function wantsNavigation(query) {
  return includesAny(query, ["open", "show", "take me", "go to", "navigate", "scroll", "bring me"]);
}

function isFollowUpQuestion(query) {
  return (
    query.split(" ").length <= 6 &&
    includesAny(query, ["what about", "tell me more", "more", "and", "also", "what else", "explain"])
  );
}

function scoreEntry(query, entry) {
  const phraseScore = entry.phrases.reduce((score, phrase) => score + (query.includes(phrase) ? 4 : 0), 0);
  const keywordScore = countKeywordMatches(query, entry.keywords);
  const nameBonus =
    includesAny(query, ["ankith", "srivatsankith", "srivats ankith"]) &&
    entry.section !== "contact"
      ? 1
      : 0;

  return phraseScore + keywordScore + nameBonus;
}

function findBestEntry(query) {
  let bestEntry = null;
  let bestScore = 0;

  conversationEntries.forEach((entry) => {
    const score = scoreEntry(query, entry);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  });

  return bestScore >= 2 ? bestEntry : null;
}

function findProjectDetailEntry(query) {
  const isProjectQuestion = includesAny(query, [
    "project",
    "projects",
    "tell me about",
    "what is",
    "what does",
    "details",
    "detail",
    "about"
  ]);

  if (!isProjectQuestion) {
    return null;
  }

  const projectEntries = conversationEntries.filter((entry) =>
    ["medgraphx", "chitti-project", "facial-recognition", "hand-gesture"].includes(entry.id)
  );

  let bestProject = null;
  let bestScore = 0;

  projectEntries.forEach((entry) => {
    const score = scoreEntry(query, entry);
    if (score > bestScore) {
      bestScore = score;
      bestProject = entry;
    }
  });

  return bestScore >= 2 ? bestProject : null;
}

function getFallbackResponse(query, sectionIntent) {
  if (sectionIntent) {
    const sectionDefaults = {
      about: conversationEntries.find((entry) => entry.id === "intro"),
      skills: conversationEntries.find((entry) => entry.id === "skills"),
      projects: conversationEntries.find((entry) => entry.id === "projects-overview"),
      hackathons: conversationEntries.find((entry) => entry.id === "hackathons"),
      "work-experience": conversationEntries.find((entry) => entry.id === "internship"),
      activities: conversationEntries.find((entry) => entry.id === "activities"),
      experience: conversationEntries.find((entry) => entry.id === "education"),
      journey: conversationEntries.find((entry) => entry.id === "education"),
      contact: conversationEntries.find((entry) => entry.id === "contact"),
      home: conversationEntries.find((entry) => entry.id === "intro")
    };

    if (sectionDefaults[sectionIntent]) {
      return sectionDefaults[sectionIntent];
    }
  }

  if (isFollowUpQuestion(query) && lastTopic) {
    const followUpEntry = conversationEntries.find((entry) => entry.section === lastTopic);
    if (followUpEntry) {
      return followUpEntry;
    }
  }

  return {
    response:
      "I can answer questions about Srivatsankith's background, education, CGPA, skills, projects, interests, internship status, location, contact details, GitHub, LinkedIn, and resume.",
    spokenText:
      "I can answer questions about Srivatsankith's background, education, C G P A, skills, projects, interests, internship status, location, contact details, GitHub, LinkedIn, and resume."
  };
}

function handleMiniCommand(rawText) {
  const text = rawText.trim();
  if (!text) {
    return;
  }

  try {
    const query = normalizeCommand(text);
    const sectionIntent = Object.prototype.hasOwnProperty.call(sectionMap, query)
      ? query
      : findSectionIntent(query);
    const externalIntent = findExternalIntent(query);
    const bestEntry = findProjectDetailEntry(query) || findBestEntry(query);
    const responseData = bestEntry || getFallbackResponse(query, sectionIntent);

    addUser(text);

    if (externalIntent && wantsToOpenLink(query)) {
      addBotMessage(`Opening ${externalIntent}.`, {
        speak: true,
        spokenText: `Opening ${externalIntent}.`
      });
      window.open(externalLinks[externalIntent], "_blank", "noopener,noreferrer");

      if (responseData.section) {
        openSectionFromChat(responseData.section);
        lastTopic = responseData.section;
      }
      miniInput.value = text;
      return;
    }

    if (query.includes("admin login") || query.includes("login as admin") || query.includes("admin signin")) {
      addBotMessage("Opening admin login dialog...");
      handleAdminLogin();
      return;
    }

    addBotMessage(responseData.response, {
      speak: true,
      spokenText: responseData.spokenText || responseData.response
    });

    if (responseData.section) {
      openSectionFromChat(responseData.section);
      lastTopic = responseData.section;
    } else if (sectionIntent && wantsNavigation(query)) {
      openSectionFromChat(sectionIntent);
      lastTopic = sectionIntent;
    }

    miniInput.value = text;
  } catch (error) {
    console.error("CHITTI command handling failed:", error);
    addBotMessage("Something went wrong while processing that message. Please try again.", {
      speak: false
    });
  }
}

function handleMiniSend() {
  const text = miniInput.value.trim();
  handleMiniCommand(text);
  miniInput.value = "";
}

function setMicState(listening) {
  if (!miniMic) {
    return;
  }

  miniMic.classList.toggle("listening", listening);
  miniMic.setAttribute("aria-pressed", String(listening));
  miniMic.querySelector("span").innerText = listening ? "Stop" : "Mic";
}

if (recognition) {
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.addEventListener("start", () => {
    isListening = true;
    synth?.cancel();
    setMicState(true);
    addBotMessage("Listening... ask me anything about Srivatsankith.", { speak: false });
  });

  recognition.addEventListener("result", (event) => {
    const transcript = event.results[0][0].transcript.trim();
    miniInput.value = transcript;
    handleMiniCommand(transcript);
    miniInput.value = "";
  });

  recognition.addEventListener("end", () => {
    isListening = false;
    setMicState(false);

    if (pendingSpeech) {
      const nextSpeech = pendingSpeech;
      pendingSpeech = "";
      speakBot(nextSpeech);
    }
  });

  recognition.addEventListener("error", (event) => {
    isListening = false;
    setMicState(false);
    pendingSpeech = "";

    if (event.error === "not-allowed") {
      addBotMessage("Microphone access is blocked. Please allow mic permission and try again.", { speak: false });
      return;
    }

    addBotMessage("I couldn't catch that. Please try again by voice or text.", { speak: false });
  });
} else if (miniMic) {
  miniMic.disabled = true;
  miniMic.querySelector("span").innerText = "N/A";
  miniMic.setAttribute("aria-label", "Voice input not supported on this browser");
}

miniBtn?.addEventListener("click", toggleMiniPanel);
miniBtn?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleMiniPanel();
  }
});

miniMic?.addEventListener("click", () => {
  if (!recognition) {
    addBotMessage(
      "Voice input is not supported in this browser. Please use Chrome or Edge and type your question for now.",
      { speak: false }
    );
    return;
  }

  if (isListening) {
    recognition.stop();
    return;
  }

  if (miniPanel.style.display !== "flex") {
    toggleMiniPanel();
  }

  try {
    recognition.start();
  } catch (error) {
    console.error("Speech recognition failed to start:", error);
    addBotMessage(
      "I couldn't start voice input. Please check microphone permission and try again in Chrome or Edge.",
      { speak: false }
    );
  }
});

document.addEventListener("click", () => {
  if (!synth) {
    return;
  }

  synth.getVoices();
}, { once: true });

miniSend?.addEventListener("click", handleMiniSend);
miniInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleMiniSend();
  }
});

document.getElementById("contactForm")?.addEventListener("submit", handleContactSubmit);
loadProfileData();
loadProjects();
loadEditableSections();
