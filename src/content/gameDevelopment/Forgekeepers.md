# Key Features and Implementation

Solo project focused on a readable mech controller, layered progression, and scalable enemy and upgrade systems.

---

## Mech Movement System

Movement is driven by step-based impulses rather than constant acceleration.
Each step is synced to the walk animation, keeping motion smooth, grounded, and predictable.
Animation events trigger short force bursts instead of continuous input-driven force.

:::block width=45
![Gameplay screenshot](https://cdn.diabolical.services/user-uploads/forgekeepersAnimTrack.png)

*Animation events driving step-based movement*
:::

```csharp file=forgekeepersMechController.cs
```

---

## Aiming and Rotation

The mech body is split into two parts.
Hips rotate toward movement direction.  
Torso rotates independently toward aim direction.
This allows strafing and directional combat without sacrificing readability.

:::columns
:::column width=48
![Mouse aiming mode](https://cdn.diabolical.services/user-uploads/forgekeepers%202026-01-08%20235815.png)

*Mouse aiming mode*
:::

:::column width=48
![Controller aiming mode](https://cdn.diabolical.services/user-uploads/forgekeepers%202026-01-08%20235944.png)

*Controller aiming mode*
:::
:::

---

## Upgrade System

Progression is split into passive and active upgrades.

### Passive Upgrades

Passive upgrades are chosen during gameplay.
Each level-up presents three options, applied immediately and stacked over time.
They affect movement, damage, reloads, survivability, and synergies.

:::columns
:::column width=55
![Passive upgrades](https://cdn.diabolical.services/user-uploads/passive%20upgrades%202026-01-09%20001549.png)

*In-game upgrade selection*
:::

:::column width=34
![Upgrade editor](https://cdn.diabolical.services/user-uploads/passive%20upgrades%202026-01-09%20001636.png)

*Upgrade tuning tool*
:::
:::

```csharp file=forgekeepersExampleUpgradeFunctions.cs
```

---

### Active Upgrades

Active upgrades define the mech before entering a mission.
Weapons, legs, and core components change handling and combat behavior.

:::columns
:::column width=55
![Loadout screen](https://cdn.diabolical.services/user-uploads/active%20upgrades%202026-01-09%20001118.png)

*Mech customization*
:::

:::column width=28
![Item list](https://cdn.diabolical.services/user-uploads/active%20upgrades%202026-01-09%20001153.png)

*Available parts*
:::
:::

---

## Enemy Creation System

Enemies share common base data.
Unique behaviors are layered only where needed.
This keeps logic consistent and iteration fast.

:::columns
:::column width=48
![Enemy editor](https://cdn.diabolical.services/user-uploads/enemy%20manager%202026-01-09%20000755.png)

*Enemy creation tool*
:::

:::column width=48
![Enemy data](https://cdn.diabolical.services/user-uploads/enemy%20manager%202026-01-09%20000816.png)
:::
:::

---

## Missions System

:::columns
:::column width=47
### Surveillance Missions

Defend a fixed objective under increasing pressure.

![Surveillance mission](https://cdn.diabolical.services/user-uploads/missions%202026-01-09%20005450.png)
:::

:::column width=47
### Escort Missions

Protect and escort an old mech through hostile territory.

![Escort mission](https://cdn.diabolical.services/user-uploads/missions%202026-01-09%20005614.png)
:::
:::

---

## Save System and Meta Progression

Player progress persists between sessions.
Currency, owned items, and mech loadouts are saved.

```csharp file=forgekeepersLoadoutManager.cs
```
