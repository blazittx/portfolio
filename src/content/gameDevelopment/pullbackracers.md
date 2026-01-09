# Key Features and Implementation

---

## Multiplayer Architecture

Pullback Racers is built using Mirror Networking with Steamworks and FizzySteamworks as the relay layer.

The setup supports:
- Steam lobby hosting and joining
- Peer-to-peer connections via Steam relay
- Server-authoritative gameplay logic
- Synchronized race state and player progression

This project was my first deep dive into multiplayer architecture, replication rules, and synchronization pitfalls.

---

## Game Settings Manager (Editor Tool)

I built a Game Settings Manager editor tool that exposes a large portion of the game’s tunable values through ScriptableObjects.

This system allows:
- Runtime balancing without rebuilding the game
- Centralized control over physics, speed, item behavior, and race rules
- Live tweaking through a developer console

The tool was also used during Twitch streams to dynamically mess with players by changing variables mid-race.

:::columns
:::column width=43
![Gameplay screenshot 1](https://cdn.diabolical.services/user-uploads/Ekran görüntüsü 2026-01-09 030130.png)
*Oracle database for holding leaderboard entries*

:::

:::column width=55
![Gameplay screenshot 1](https://cdn.diabolical.services/user-uploads/Ekran görüntüsü 2026-01-09 030203.png)

:::
:::

```csharp file=pullbackRacersLobbySettings.cs
```

---

## UI Programming and Race Visualization

I handled all UI programming for the project.

### Synced Race Line

A synced race line UI shows every player’s current placement along the track in real time.

- Player positions are calculated server-side
- Normalized track progress is synced to clients
- UI updates smoothly without jitter or snapping

This made race standings readable at a glance even during chaotic moments.

![Gameplay screenshot 1](https://cdn.diabolical.services/user-uploads/Ekran görüntüsü 2026-01-09 031019.png)
![Gameplay screenshot 1](https://cdn.diabolical.services/user-uploads/Ekran görüntüsü 2026-01-09 031314.png)

:::columns
:::column width=47
![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/03c9d43aab31dd69230d4692a742385e40807ea0/ss_03c9d43aab31dd69230d4692a742385e40807ea0.1920x1080.jpg?t=1751304136)
*Score board*

:::

:::column width=47

![Gameplay screenshot 1](https://cdn.diabolical.services/user-uploads/Ekran görüntüsü 2026-01-09 031428.png)
*Main Menu Design*

:::
:::

```csharp file=pullbackRacersRaceLineManager.cs
```

---

### End-of-Round Scoreboard

The end-of-round scoreboard aggregates:
- Final placement
- Points earned
- Persistent progression data

All data is synchronized correctly across clients to ensure consistent results.

:::block width=60
![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/03c9d43aab31dd69230d4692a742385e40807ea0/ss_03c9d43aab31dd69230d4692a742385e40807ea0.1920x1080.jpg?t=1751304136)
:::


```csharp file=pullbackRacersScoreManager.cs
```

---

## Procedural Track Generation

Tracks are generated dynamically using spline-based track pieces.

Each new segment:
- Snaps seamlessly to the previous spline
- Inherits direction and curvature
- Extends the track indefinitely

This allows races to scale in length and keeps replayability high without manual track design.

:::columns
:::column width=47
![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/c34b32cf6fc5d0fd7a892d2af82b6020138dae17/ss_c34b32cf6fc5d0fd7a892d2af82b6020138dae17.1920x1080.jpg?t=1751304136)

:::

:::column width=47

![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/d4c11eb76463ae9ebafbc5fdb86f2e825b7fe5d8/ss_d4c11eb76463ae9ebafbc5fdb86f2e825b7fe5d8.1920x1080.jpg?t=1751304136)

:::
:::

```csharp file=pullbackRacersTrackGenerator.cs
```

---

## Item Placement System

I implemented the item placement logic that lets players affect the race by building onto the track as it expands.

Items can be placed during track generation, including:
- Mud patches
- Walls
- Speed pads
- Gold coins
- Other hazards and bonuses

Placement rules ensure:
- Items align correctly to the spline
- Multiplayer-safe spawning
- Fair placement without soft-locking players

:::columns
:::column width=47
![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/a4f7cb875cc7efdc97515557b9a07e13ce3f2f19/ss_a4f7cb875cc7efdc97515557b9a07e13ce3f2f19.1920x1080.jpg?t=1751304136)

:::

:::column width=47

![Gameplay screenshot 1](https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/3720110/b4a193e327aa48ce41c08c8349f84ad78a5d4b0d/ss_b4a193e327aa48ce41c08c8349f84ad78a5d4b0d.1920x1080.jpg?t=1751304136)

:::
:::

```csharp file=pullbackRacersItemSelectionAndPlacement.cs
```

---

## First Multiplayer and Steam Release

Pullback Racers represents several personal milestones:
- First fully networked multiplayer game
- First experience shipping with Steamworks
- First game released publicly on Steam

The project taught me practical multiplayer problem-solving, tooling for live balancing, and how to ship a networked game end-to-end.
