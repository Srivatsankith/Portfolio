const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");
const ContentItem = require("./models/ContentItem");

const defaultContent = {
  hackathon: [
    {
      title: "AI Prototype Building",
      description:
        "Built rapid proof-of-concept solutions around machine learning, automation, and intelligent user interaction during coding challenges."
    },
    {
      title: "Problem Solving Sprints",
      description:
        "Worked on time-bound development cycles involving ideation, feature planning, implementation, debugging, and final presentation."
    },
    {
      title: "Team Collaboration",
      description:
        "Collaborated with peers to divide tasks, integrate frontend and backend work, and communicate technical decisions clearly."
    }
  ],
  activity: [
    {
      title: "AI & ML Exploration",
      description:
        "Regularly experiment with machine learning models, computer vision workflows, and Generative AI tools to strengthen practical skills."
    },
    {
      title: "Project-Based Learning",
      description:
        "Build small end-to-end applications to learn deployment, API integration, interface design, and real-world debugging."
    },
    {
      title: "Technical Community Participation",
      description:
        "Take part in college-level technical discussions, peer learning, coding practice, and collaborative development activities."
    }
  ],

  "work-experience": [
    {
      title: "AI / ML Internship Focus",
      description:
        "Looking for hands-on roles involving machine learning, model development, computer vision, Generative AI, and intelligent web applications.",
      github: "https://github.com/Sri-Coder1"
    },
    {
      title: "Practical Contribution",
      description:
        "Ready to contribute with Python, Scikit-learn, TensorFlow, Flask, OpenCV, JavaScript, Git, and strong project-based learning habits.",
      github: "https://github.com/Sri-Coder1"
    }
  ]
};

async function seedContent(type, items) {
  const count = await ContentItem.countDocuments({ type });

  if (count > 0) {
    return;
  }

  await ContentItem.insertMany(
    items.map((item, index) => ({
      type,
      title: item.title,
      description: item.description,
      sort_order: index + 1,
      github: item.github || ""
    }))
  );
}

async function configureAdmin() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const hashedPassword = bcrypt.hashSync(password, 10);

  await Admin.findOneAndUpdate(
    { username },
    { username, password: hashedPassword },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function seedDatabase() {
  await Promise.all(Object.entries(defaultContent).map(([type, items]) => seedContent(type, items)));
  await configureAdmin();
}

module.exports = seedDatabase;
