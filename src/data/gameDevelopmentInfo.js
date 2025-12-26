// Development info content for each game
// This is manually maintained per game ID

/**
 * Content types:
 * - { type: 'text', content: '...' } - Regular text paragraph
 * - { type: 'heading', level: 2, content: '...' } - Heading (level 1-3)
 * - { type: 'image', src: '...', alt: '...' } - Image
 * - { type: 'code', language: 'javascript', content: '...' } - Code block
 */

export const gameDevelopmentInfo = {
  'pullbackracers': [
    { type: 'heading', level: 2, content: 'Development Process' },
    { type: 'text', content: 'Pullback Racers was developed as a physics-based racing game with a unique pullback mechanic. The core gameplay revolves around winding up your car and releasing it to race against opponents.' },
    { type: 'heading', level: 3, content: 'Technical Stack' },
    { type: 'text', content: 'Built using Unity with C# for the game logic. The physics system uses Unity\'s built-in physics engine with custom modifications for the pullback mechanic.' },
    { type: 'code', language: 'csharp', content: 'public class PullbackController : MonoBehaviour\n{\n    private float pullbackForce = 0f;\n    private bool isWinding = false;\n    \n    void Update()\n    {\n        if (Input.GetMouseButton(0))\n        {\n            pullbackForce += Time.deltaTime * windSpeed;\n            pullbackForce = Mathf.Clamp(pullbackForce, 0f, maxForce);\n        }\n        \n        if (Input.GetMouseButtonUp(0))\n        {\n            ReleaseCar();\n        }\n    }\n}' },
    { type: 'heading', level: 3, content: 'Key Features' },
    { type: 'text', content: 'The game features multiple tracks, various car types with different stats, and a progression system that unlocks new content as players advance.' },
  ],
  
  'gamblelite': [
    { type: 'heading', level: 2, content: 'Project Overview' },
    { type: 'text', content: 'Gamble Lite is a multiplayer card game that combines strategy with social interaction. Players can create rooms and invite friends to play various card game modes.' },
    { type: 'heading', level: 3, content: 'Architecture' },
    { type: 'text', content: 'The game uses a client-server architecture with WebSocket connections for real-time multiplayer gameplay. The backend handles game state synchronization and player management.' },
    { type: 'code', language: 'javascript', content: '// WebSocket connection handler\nclass GameServer {\n  constructor() {\n    this.clients = new Map();\n    this.gameRooms = new Map();\n  }\n  \n  handleConnection(socket) {\n    socket.on(\'join-room\', (roomId) => {\n      this.joinRoom(socket, roomId);\n    });\n    \n    socket.on(\'play-card\', (data) => {\n      this.processCardPlay(socket.id, data);\n    });\n  }\n}' },
    { type: 'heading', level: 3, content: 'Development Challenges' },
    { type: 'text', content: 'One of the main challenges was implementing a fair and secure card dealing system that prevents cheating while maintaining smooth gameplay. We used cryptographic shuffling algorithms to ensure randomness.' },
  ],
  
  'Forgekeepers': [
    { type: 'heading', level: 2, content: 'Game Design' },
    { type: 'text', content: 'Forgekeepers is a strategy game where players manage a forge and craft items. The game combines resource management with tactical decision-making.' },
    { type: 'heading', level: 3, content: 'Crafting System' },
    { type: 'text', content: 'The crafting system uses a recipe-based approach where players combine materials to create items. Each recipe has specific requirements and yields.' },
    { type: 'code', language: 'typescript', content: 'interface Recipe {\n  id: string;\n  name: string;\n  ingredients: Ingredient[];\n  result: Item;\n  craftingTime: number;\n}\n\nclass CraftingSystem {\n  canCraft(recipe: Recipe, inventory: Inventory): boolean {\n    return recipe.ingredients.every(ing => \n      inventory.hasItem(ing.itemId, ing.quantity)\n    );\n  }\n  \n  craft(recipe: Recipe): Item {\n    // Crafting logic here\n    return recipe.result;\n  }\n}' },
    { type: 'text', content: 'The system tracks player progress and unlocks new recipes as they advance through the game.' },
  ],
  
  'bubbledome': [
    { type: 'heading', level: 2, content: 'Development Timeline' },
    { type: 'text', content: 'Bubbledome was developed over 6 months with a focus on creating engaging bubble-popping mechanics and colorful visuals.' },
    { type: 'heading', level: 3, content: 'Physics Implementation' },
    { type: 'text', content: 'The bubble physics were implemented using a custom particle system that handles bubble interactions, popping animations, and chain reactions.' },
    { type: 'code', language: 'csharp', content: 'public class Bubble : MonoBehaviour\n{\n    public void Pop()\n    {\n        // Trigger pop animation\n        animator.SetTrigger("Pop");\n        \n        // Check for adjacent bubbles\n        CheckAdjacentBubbles();\n        \n        // Add score\n        GameManager.Instance.AddScore(points);\n    }\n    \n    private void CheckAdjacentBubbles()\n    {\n        // Chain reaction logic\n    }\n}' },
    { type: 'heading', level: 3, content: 'Visual Design' },
    { type: 'text', content: 'The game features vibrant colors and smooth animations to create an appealing visual experience. All assets were created in-house using custom shaders for the bubble effects.' },
  ],
  
  'gp1': [
    { type: 'heading', level: 2, content: 'Project Goals' },
    { type: 'text', content: 'GP1 was designed as a fast-paced racing game with emphasis on tight controls and competitive gameplay. The project aimed to create an accessible yet challenging racing experience.' },
    { type: 'heading', level: 3, content: 'Control System' },
    { type: 'text', content: 'The control system was carefully tuned to provide responsive handling while maintaining realistic physics. Input handling uses a custom system that processes both keyboard and gamepad inputs.' },
    { type: 'code', language: 'csharp', content: 'public class VehicleController : MonoBehaviour\n{\n    [SerializeField] private float maxSpeed = 50f;\n    [SerializeField] private float acceleration = 10f;\n    [SerializeField] private float turnSpeed = 2f;\n    \n    private void Update()\n    {\n        float input = Input.GetAxis("Horizontal");\n        float throttle = Input.GetAxis("Vertical");\n        \n        ApplySteering(input);\n        ApplyThrottle(throttle);\n    }\n    \n    private void ApplySteering(float input)\n    {\n        transform.Rotate(0, input * turnSpeed, 0);\n    }\n}' },
    { type: 'heading', level: 3, content: 'Track Design' },
    { type: 'text', content: 'Tracks were designed with multiple racing lines and strategic shortcuts. Each track went through several iterations to ensure balanced gameplay and interesting racing dynamics.' },
  ],
  
  'GFOS1992': [
    { type: 'heading', level: 2, content: 'Retro Aesthetic' },
    { type: 'text', content: 'GFOS1992 is a retro-styled game that pays homage to classic arcade games from the early 1990s. The visual style uses pixel art and a limited color palette to achieve an authentic retro look.' },
    { type: 'heading', level: 3, content: 'Audio Design' },
    { type: 'text', content: 'The audio was created using chiptune-style synthesizers to match the retro aesthetic. All sound effects were designed to evoke nostalgia while maintaining modern game design principles.' },
    { type: 'code', language: 'javascript', content: '// Audio manager for retro sounds\nclass RetroAudioManager {\n  constructor() {\n    this.soundBank = new Map();\n    this.loadSounds();\n  }\n  \n  playSound(soundName) {\n    const sound = this.soundBank.get(soundName);\n    if (sound) {\n      sound.play();\n    }\n  }\n  \n  loadSounds() {\n    // Load chiptune sounds\n    this.soundBank.set(\'jump\', loadSound(\'jump.wav\'));\n    this.soundBank.set(\'collect\', loadSound(\'collect.wav\'));\n  }\n}' },
    { type: 'heading', level: 3, content: 'Gameplay Mechanics' },
    { type: 'text', content: 'The game combines classic arcade gameplay with modern quality-of-life improvements. Players can enjoy the nostalgic feel while benefiting from features like save states and customizable controls.' },
  ],
}

/**
 * Get development info for a specific game ID
 * @param {string} gameId - The game ID
 * @returns {Array|null} - Array of content items or null if not found
 */
export const getDevelopmentInfo = (gameId) => {
  return gameDevelopmentInfo[gameId] || null
}

