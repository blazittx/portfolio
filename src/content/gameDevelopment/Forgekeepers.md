# Key Features and Implementation

Solo project focused on an unconventional mech controller, systemic progression, and scalable enemy/upgrade content pipelines.

---

## Mech Movement System

The mech movement is built around physically grounded motion that still feels responsive. Instead of constantly applying acceleration, movement is driven by step-based impulses triggered from animation events. This keeps locomotion synced to the walk cycle and makes speed changes feel natural.

### Step-Driven Force Application

Each footstep triggers an animation event that calls `ApplyStepForce()`. When a step happens, the controller opens a short push window (`pushDuration`). During that window, continuous force is applied in `FixedUpdate()` using `ForceMode.Force`, which creates smooth acceleration without instantly snapping velocity.


:::block width=50
![Gameplay screenshot](https://cdn.diabolical.services/user-uploads/forgekeepersAnimTrack.png)
*The animation events in the walk animation.*
:::



```csharp file=forgekeepersMechController.cs
```

### Aiming and Rotation

The mech is split into hips + torso to support independent movement and aiming.

- Hips rotate toward movement direction to keep locomotion readable.
- Torso rotates toward aim direction so the player can strafe and fight.

Aiming supports both control methods:

- Mouse aiming uses a ground raycast and rotates the torso toward the hit point.
- Controller aiming uses an aiming dot that behaves like a joystick cursor, smoothed with `Slerp` to avoid jitter.

:::columns
:::column width=48
![Mouse aiming mode](https://cdn.diabolical.services/user-uploads/forgekeepers%202026-01-08%20235815.png)

*Mouse aiming mode (cursor invisible)*
:::

:::column width=48
![Controller aiming mode](https://cdn.diabolical.services/user-uploads/forgekeepers%202026-01-08%20235944.png)

*Controller aiming mode*
:::
:::


---

## Upgrade and Enemy Creation System

The progression system in Forgekeepers is designed to scale without code duplication and to support frequent iteration. Both enemies and upgrades are defined through data-driven structures, allowing new content to be added without rewriting or branching core gameplay logic.

### Upgrade Types

Upgrades are split into **passive** and **active** systems, each serving a different purpose in moment-to-moment gameplay and long-term build planning.

**Passive Upgrades**  
Passive upgrades are earned during gameplay. As the player collects orbs and levels up, they are presented with a choice of three upgrade options. These upgrades are applied immediately and stack over time, gradually shaping the mech’s performance within a single run.

Passive upgrades affect core stats and behaviors such as:
- Movement speed and acceleration
- Weapon damage and fire rate
- Reload speed and cooldowns
- Health, survivability, and regeneration
- Synergies that encourage specific playstyles

:::columns
:::column width=55
![Active Items](https://cdn.diabolical.services/user-uploads/passive upgrades 2026-01-09 001549.png)

*In-Game upgrade selection screen.*
:::

:::column width=34
![Active Items](https://cdn.diabolical.services/user-uploads/passive upgrades 2026-01-09 001636.png)
*Editor tool to quickly edit effects of upgrades and set up new upgrades.*

:::
:::

```csharp file=forgekeepersExampleUpgradeFunctions.cs
```



This system encourages adaptation and decision-making under pressure, as players must commit to a build direction based on the options presented.

**Active Upgrades (Loadout System)**  
Active upgrades are selected outside of missions and define the mech’s base configuration before deployment. These include:
- Weapons
- Legs and movement components
- Other mech parts that alter handling or combat behavior

:::columns
:::column width=55
![Active Items](https://cdn.diabolical.services/user-uploads/active upgrades 2026-01-09 001118.png)

*Customization screen.*
:::

:::column width=28
![Active Items](https://cdn.diabolical.services/user-uploads/active upgrades 2026-01-09 001153.png)
*List of available weapons etc.*

:::
:::

Active upgrades form the foundation of a build and significantly change how the mech feels to control. Combined with passive upgrades earned during a run, this creates a layered progression system where preparation and in-mission choices both matter.

### Enemy Creation

Enemies are built on shared base data defining common attributes such as health, damage output, and movement parameters. Individual enemy types extend this base with unique behaviors only where necessary.

This approach keeps enemy logic consistent, avoids duplicated code paths, and makes it easy to introduce new enemy variants or difficulty scaling without destabilizing existing systems.

Overall, this setup allows fast content expansion, clear balancing workflows, and flexible experimentation with new mechanics while keeping the codebase maintainable.

:::columns
:::column width=48
![Mouse aiming mode](https://cdn.diabolical.services/user-uploads/enemy manager 2026-01-09 000755.png)

*Editor tool to quickly create new enemies that use the same logic.*
:::

:::column width=48
![Controller aiming mode](https://cdn.diabolical.services/user-uploads/enemy manager 2026-01-09 000816.png)

:::
:::

---


## Missions System

Forgekeepers includes mission types that change player priorities and pacing.

:::columns
:::column width=47
#### Surveillance Missions

Players defend a fixed objective in a tower-defense style scenario. The challenge is maintaining control of a zone while handling escalating pressure and enemy routing.

![Active Items](https://cdn.diabolical.services/user-uploads/missions 2026-01-09 005450.png)

*Surveillance Mission Antenna*
:::
:::column width=47
#### Escort Missions

Players escort an old mech through hostile territory. This shifts gameplay toward route safety, threat removal, and protecting a moving objective while maintaining forward momentum.
![Active Items](https://cdn.diabolical.services/user-uploads/missions 2026-01-09 005614.png)
*Escort mission mech.*

:::
:::

---

## Save System and Meta Progression

A save system persists player progress between sessions, including currency, owned items, and the current mech build configuration.

A shop system uses saved currency to unlock and purchase parts, enabling long-term progression and experimentation with loadouts.

The loadout system supports swappable mech parts such as weapons and legs, creating build variety and new gameplay dynamics without extending run length.


```csharp file=forgekeepersLoadoutManager.cs
```