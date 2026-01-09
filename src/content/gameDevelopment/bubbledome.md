# Key Features and Implementation

Local multiplayer arena shooter/brawler made in 48 hours for Global Game Jam 2025.

---

## Level Generation (Infinite Levels)

Infinite replayability is achieved through procedural generation using the PGG asset.

The generator assembles compact arena layouts, places hazards and spawn points, and supports re-rolling the arena between rounds without restarting the session.

:::columns
:::column width=60
:::youtube url=https://youtu.be/D6d15k3rYDU
:::
*Procedural Levels Demo*
:::
:::column width=38
![Bubble projectile in flight](https://cdn.diabolical.services/user-uploads/bubbledome 2026-01-09 015439.png)
*Available prefabs to spawn*
![Bubble projectile in flight](https://cdn.diabolical.services/user-uploads/bubbledome 2026-01-09 015643.png)
*Spawn math through PGG*
:::
:::

---

## Bubble Creation and Shooting

Bubble shots are built as a charge-and-release mechanic.

Charging increases bubble size and impact strength.
Releasing spawns a bubble projectile with velocity and tuned physics so hits feel consistent and readable in a party-game setting.

Core concerns:
- charge curve and max charge
- projectile lifetime and pop conditions
- tuning knockback so it is fun without becoming random

:::columns
:::column width=58
![Bubble charge UI](https://cdn.diabolical.services/user-uploads/bubbles 2026-01-09 020749.png)

*Charge feedback*
:::

:::column width=37
![Bubble projectile in flight](https://cdn.diabolical.services/user-uploads/bubbles 2026-01-09 020927.png)

*Bubble projectiles*
:::
:::

```csharp file=bubbledomeBubbleController.cs
```

```csharp file=bubbledomeBubble.cs
```

---

## Bubble Turret

Bubble turrets act as a shared hazard that increases chaos without targeting a single player unfairly.

Turrets spawn into arenas as part of generation.
They periodically shoot bubbles that can hit any player, applying the same physics and knockback rules as player shots.

:::block width=60
![Bubble turret enemy](https://cdn.diabolical.services/user-uploads/bubbleTurret 2026-01-09 021333.png)

*Bubble turret in arena*
:::

```csharp file=bubbledomeBubbleTurret.cs
```

---

## Respawning with DOTween Arc + Spawn Protection

Respawns use a DOTween arc to make re-entry readable and satisfying.


:::columns
:::column width=45
![Bubble charge UI](https://cdn.diabolical.services/user-uploads/shield 2026-01-09 022817.png)

*Respawn Protection*
:::

:::column width=40
Players respawn with:
- a short invulnerability window
- clear visual feedback (flash/shield)
- collision rules that prevent immediate knockback loops
:::
:::

```csharp file=bubbledomePlayerManager.cs
```

---

## Slow-Mo Impact Moments (Smash-style)

:::columns
:::column width=37
Big hits trigger brief slow-motion moments to sell impact.

The trigger is based on impact strength and context (knockout hits, high-charge bubbles, turret chaos moments), then:
- slows time for a short duration
- applies a quick camera punch or shake
- restores time smoothly to avoid jarring transitions
:::

:::column width=60

:::youtube url=https://youtu.be/iE1C2TJQMF4
:::
:::
:::

```csharp file=bubbledomeForceHandler.cs
```