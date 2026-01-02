// Development info content for each game
// This is manually maintained per game ID

/**
 * Content types:
 * - { type: 'text', content: '...' } - Regular text paragraph
 * - { type: 'heading', level: 2, content: '...' } - Heading (level 1-3)
 * - { type: 'image', src: '...', alt: '...' } - Image
 * - { type: 'code', language: 'javascript', content: '...' } - Code block
 */

const codeSamples = import.meta.glob("../codeSamples/**/*", {
  as: "raw",
  eager: true,
});

export const getCodeSample = (filename) => {
  return codeSamples[`../codeSamples/${filename}`];
};

// Team members for each game
// Each team member should have: name, role, and linkedin (optional)
export const gameTeamMembers = {
  pullbackracers: [
    {
      name: "Doruk Sasmaz",
      role: "Game & UI Programmer",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Yigit Doruk",
      role: "Game & Level Designer",
      linkedin: "https://www.linkedin.com/in/yigitdoruk/",
    },
    {
      name: "Fatih Gorguc",
      role: "Game Programmer",
      linkedin:
        "https://www.linkedin.com/in/fatih-g%C3%B6rg%C3%BC%C3%A7-45105b192/",
    },
    {
      name: "Karl Flodin",
      role: "Sound Designer & Music Composer",
      linkedin: "https://www.linkedin.com/in/karl-flodin-584259153/",
    },
    {
      name: "Erik Lyding",
      role: "Sound Designer & Music Composer",
    },
    {
      name: "Olof Högberg",
      role: "Sound Designer & Music Composer",
    },
  ],
  gamblelite: [
    {
      name: "Doruk Sasmaz",
      role: "Game Programmer",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Yigit Doruk",
      role: "Game & Level Designer",
      linkedin: "https://www.linkedin.com/in/yigitdoruk/",
    },
    {
      name: "Fatih Gorguc",
      role: "Game Programmer",
      linkedin:
        "https://www.linkedin.com/in/fatih-g%C3%B6rg%C3%BC%C3%A7-45105b192/",
    },
    {
      name: "Erik Lyding",
      role: "Sound Designer & Music Composer",
    },
    {
      name: "Olof Högberg",
      role: "Sound Designer & Music Composer",
    },
    {
      name: "Karl Flodin",
      role: "Sound Designer & Music Composer",
      linkedin: "https://www.linkedin.com/in/karl-flodin-584259153/",
    },
    {
      name: "Robin Ekström",
      role: "3D & 2D Artist",
      linkedin: "https://www.linkedin.com/in/robin-ekstr%C3%B6m/",
    },
    {
      name: "James Lee",
      role: "Social Media & Community Manager",
      linkedin: "https://www.linkedin.com/in/james-lee-08bba8157/",
    },
    {
      name: "Kiwick Studios",
      role: "3D & 2D Art & Animation",
      linkedin: "https://www.linkedin.com/company/kiwick-studios/",
    },
  ],
  Forgekeepers: [
    {
      name: "Doruk Sasmaz",
      role: "Solo Project",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
  ],
  bubbledome: [
    {
      name: "Doruk Sasmaz",
      role: "Game Programmer",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Robin Zeitlin",
      role: "Game Programmer",
      linkedin: "https://www.linkedin.com/in/robin-zeitlin-778a9127a/",
    },
    {
      name: "Dash Corning",
      role: "Game Programmer",
      linkedin: "https://www.linkedin.com/in/dashcorning/",
    },
    {
      name: "Yigit Doruk",
      role: "Game & Level Designer",
      linkedin: "https://www.linkedin.com/in/yigitdoruk/",
    },
  ],
  gp1: [
    {
      name: "Doruk Sasmaz",
      role: "Game Programmer & PO",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Alexander Granskog",
      role: "Narrative Designer / Generalist",
    },
    {
      name: "Brian Barikhan",
      role: "UI Design/Generalist/Quality Assurance",
    },
    {
      name: "David Hult",
      role: "Animation / VFX",
    },
    {
      name: "Emilia Molander",
      role: "Game Artist",
    },
    {
      name: "Federico Garcia",
      role: "Lead Designer / Gameplay Designer",
    },
    {
      name: "Galina Syrodoeva",
      role: "Character Programmer",
    },
    {
      name: "Halldór Kristmundsson",
      role: "Character Programmer",
    },
    {
      name: "Ilyas Kaya",
      role: "Game Programmer",
    },
    {
      name: "Kristin Walkhed",
      role: "Game Artist",
    },
    {
      name: "Marcus Swensån",
      role: "Game Artist",
    },
    {
      name: "Robin",
      role: "Animation/VFX",
    },
    {
      name: "Tiger Martin",
      role: "Lead Programmer, World Generation",
    },
    {
      name: "Vamsi Krishna Kasina",
      role: "Level Design / Game Design",
    },
  ],
  GFOS1992: [
    {
      name: "Doruk Sasmaz",
      role: "Game Programmer",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Berkin Paker",
      role: "Game Designer",
      linkedin: "https://www.linkedin.com/in/berkincemalpaker/",
    },
    {
      name: "Emre Celikler",
      role: "Game Programmer",
      linkedin: "https://www.linkedin.com/in/emre-%C3%A7elikler/",
    },
    {
      name: "Yigit Kayhan",
      role: "Game Artist & Designer",
      linkedin: "https://www.linkedin.com/in/yigitkayhan/",
    },
    {
      name: "Lal Koyuncu",
      role: "3D Artist",
      linkedin: "https://www.linkedin.com/in/lal-kync/",
    },
  ],
  gp3: [
    {
      name: "Doruk Sasmaz",
      role: "Game & Sound Programmer",
      linkedin: "https://linkedin.com/in/doruk-sasmaz",
    },
    {
      name: "Leon Cederberg",
      role: "Product Owner and Designer",
    },
    {
      name: "Alejandro Hernandez Cortina",
      role: "Narrative and Level Designer",
    },
    {
      name: "Simon Finér",
      role: "Designer",
    },
    {
      name: "Ghazaleh Shahabirad",
      role: "Designer",
    },
    {
      name: "Ilya Antoshkin",
      role: "Environment Artist / Technical Artist",
    },
    {
      name: "Evangelia Bakasi",
      role: "Artist",
    },
    {
      name: "Barry Chen",
      role: "Art Director and Animator",
    },
    {
      name: "Shengan Peng",
      role: "Animation and Visual Effects",
    },
    {
      name: "Eric Ivar Persson",
      role: "VFX Artist",
    },
    {
      name: "Brian-Lucas Morar",
      role: "Programmer",
    },
    {
      name: "Galina Syrodoeva",
      role: "Programmer",
    },
    {
      name: "Jamie Kofler",
      role: "Programmer",
    },
  ],
};

export const gameDevelopmentInfo = {
  pullbackracers: [
    { type: "heading", level: 2, content: "Development Process" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Technical Stack" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content: getCodeSample("carControllerPullbackRacers.cs"),
    },
    { type: "heading", level: 3, content: "Key Features" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],

  gamblelite: [
    { type: "heading", level: 2, content: "Project Overview" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Architecture" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content: `
        public class GameController : MonoBehaviour
        {
            void Start()
            {
            }
        
            void Update()
            {
            }
        }
        `,
    },
    {
      type: "image",
      src: "previewPortfolio.png",
      alt: "Technical Stack",
    },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Development Challenges" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],

  Forgekeepers: [
    { type: "heading", level: 2, content: "Game Design" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Crafting System" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content:
        "public class GameController : MonoBehaviour\n{\n    void Start()\n    {\n        // Placeholder code\n    }\n    \n    void Update()\n    {\n        // Placeholder code\n    }\n}",
    },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],

  bubbledome: [
    { type: "heading", level: 2, content: "Development Timeline" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Physics Implementation" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content: `
    public class GameController : MonoBehaviour
    {
        void Start()
        {
        }
    
        void Update()
        {
        }
    }
    `,
    },
    { type: "heading", level: 3, content: "Visual Design" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],

  gp1: [
    { type: "heading", level: 2, content: "Project Goals" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Control System" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content: `
    public class GameController : MonoBehaviour
    {
        void Start()
        {
        }
    
        void Update()
        {
        }
    }
    `,
    },
    { type: "heading", level: 3, content: "Track Design" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],

  GFOS1992: [
    { type: "heading", level: 2, content: "Retro Aesthetic" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    { type: "heading", level: 3, content: "Audio Design" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
    {
      type: "code",
      language: "csharp",
      content: `
    public class GameController : MonoBehaviour
    {
        void Start()
        {
        }
    
        void Update()
        {
        }
    }
    `,
    },
    { type: "heading", level: 3, content: "Gameplay Mechanics" },
    {
      type: "text",
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    },
  ],
};

/**
 * Get development info for a specific game ID
 * @param {string} gameId - The game ID
 * @returns {Array|null} - Array of content items or null if not found
 */
export const getDevelopmentInfo = (gameId) => {
  return gameDevelopmentInfo[gameId] || null;
};

/**
 * Get team members for a specific game ID
 * @param {string} gameId - The game ID
 * @returns {Array|null} - Array of team member names or null if not found
 */
export const getTeamMembers = (gameId) => {
  return gameTeamMembers[gameId] || null;
};
