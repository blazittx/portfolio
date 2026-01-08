// Development info content for each game.
// Each game maps to a Markdown file in src/content/gameDevelopment.

const developmentMarkdown = import.meta.glob("../content/gameDevelopment/*.md", {
  as: "raw",
  eager: true,
});

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
    {
      name: "Doğukan Şahin",
      role: "Sound Designer",
    },
    {
      name: "Alp Tamer",
      role: "Technical Artist",
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

/**
 * Get development info for a specific game ID.
 * @param {string} gameId - The game ID
 * @returns {string|null} - Raw Markdown string or null if not found
 */
export const getDevelopmentInfo = (gameId) => {
  return developmentMarkdown[`../content/gameDevelopment/${gameId}.md`] || null;
};

/**
 * Get team members for a specific game ID
 * @param {string} gameId - The game ID
 * @returns {Array|null} - Array of team member names or null if not found
 */
export const getTeamMembers = (gameId) => {
  return gameTeamMembers[gameId] || null;
};
