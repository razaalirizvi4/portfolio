export interface Project {
  id: string; name: string; tagline: string;
  tech: string[]; github: string; bullets: string[];
}

export const profile = {
  name: "Syed Raza Ali Rizvi",
  username: "raza",
  hostname: "ubuntu",
  title: "Software Engineer",
  location: "Lahore, Pakistan",
  email: "razaalirizvi4@gmail.com",
  phone: "+92 332 4805552",
  github: "https://github.com/razaalirizvi4",
  githubUser: "razaalirizvi4",
  education: {
    school: "FAST-NUCES",
    location: "Lahore, Pakistan",
    degree: "BSc Software Engineering",
    cgpa: "3.44",
    expected: "Aug 2027",
    coursework: [
      "Data Structures & Algorithms", "Object-Oriented Programming",
      "Design & Analysis of Algorithms", "Database Systems",
      "Artificial Intelligence", "Natural Language Processing",
    ],
  },
  experience: [{
    company: "Eyra Tech Corp.",
    location: "Lahore, Pakistan",
    role: "Software Engineering Intern",
    period: "Oct 2025 – Present",
    bullets: [
      "Worked within tekTracking's SITE and TIMPS systems, developing and enhancing reports and application form workflows to improve data capture, validation, and the accuracy and usability of report outputs used by enterprise rail customers.",
      "Built AI agents with Claude Code to automate report and application form generation, validating output correctness through multiple automated Playwright test suites.",
      "Implemented dynamic localization for all server-driven content, enabling data received from the server to be displayed in the user's language at runtime.",
      "Debugged production issues and delivered documented support patches for enterprise transit customers including IOC and LIRR (Long Island Rail Road).",
      "Planned and executed data/system migrations for customers including ACTA, PATH, and ETR while preserving data integrity in live production environments.",
    ],
  }],
  projects: [
    {
      id: "deep-emotion",
      name: "Deep-Emotion",
      tagline: "Paper replication & bug fix — FER2013 accuracy ~50% → ~70%",
      tech: ["Python", "PyTorch"],
      github: "https://github.com/razaalirizvi4/deep-emotion",
      bullets: [
        "Identified that the reference implementation applied dropout via PyTorch's functional API without gating it on train/eval mode, leaving dropout active during evaluation and suppressing test-time accuracy to a ~50% plateau.",
        "Fixed the train/eval mode inconsistency and, in a controlled before/after comparison, raised FER2013 evaluation accuracy from ~50% to ~70%, reproducing the paper's reported results; benchmarked against six baselines (ResNet50, VGG19, MobileNet, EfficientNet, AlexNet-tiny, cascade CNN).",
      ],
    },
    {
      id: "twin",
      name: "Twin",
      tagline: "Natural language → shell commands. 44 paid sales in 2 weeks.",
      tech: ["Python", "Shell", "Ollama"],
      github: "https://github.com/razaalirizvi4/twin",
      bullets: [
        "Developed an AI-powered command line assistant that transforms natural language prompts into executable shell commands.",
        "Integrated with the Ollama framework, leveraging the gemma3 model to interpret and generate shell instructions.",
        "Achieved 44 paid sales within the first 2 weeks, validating real-world demand for the tool.",
      ],
    },
    {
      id: "agri-pro",
      name: "Agri-Pro",
      tagline: "Full-stack farm management with geospatial mapping",
      tech: ["React.js", "Node.js", "Express.js", "MongoDB", "Mapbox"],
      github: "https://github.com/razaalirizvi4/agriclone2",
      bullets: [
        "Built a full-stack farm management platform with a React/Redux frontend and Node.js/Express/MongoDB backend, including JWT-based authentication and role/permission handling.",
        "Implemented interactive geospatial farm mapping with Mapbox GL and Turf.js, enabling users to draw, edit, and manage farm and field boundaries.",
        "Automated backend workflows with scheduled jobs (node-cron), transactional email notifications, and webhook-based event streaming.",
      ],
    },
    {
      id: "voya",
      name: "VOYA",
      tagline: "Cross-platform travel companion app for Pakistan",
      tech: ["React Native", "TypeScript", "Express.js", "Supabase"],
      github: "https://github.com/Eishal-Fatima-Qadri/VOYA",
      bullets: [
        "Co-developed a cross-platform travel companion app for Pakistan with a React Native (Expo) frontend, an Express.js API layer, and Supabase for authentication and real-time data.",
        "Built real-time features including a live motorway status tracker with community reporting, emergency SOS contacts, and flight tracking with push notifications.",
        "Implemented an AI-powered tour guide generating personalized multi-day itineraries with interactive map pins and categorized local-phrase translations.",
      ],
    },
  ] satisfies Project[],
  skills: {
    languages: ["Java", "Python", "C/C++", "SQL", "JavaScript", "TypeScript", "HTML/CSS"],
    frameworks: ["React.js", "React Native", "Node.js", "Express.js", "PyTorch", "Tailwind CSS", "Bootstrap"],
    tools: ["Git", "Claude Code", "Playwright", "Ollama", "Visual Studio Code", "IntelliJ", "PyCharm", "Firebase", "Supabase", "Linux"],
  },
} as const;
export type Profile = typeof profile;
