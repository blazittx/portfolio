# Key Features and Implementation

---

## Weapons and Combat System

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2Fee7b2d07-8c47-4d28-9e10-444d5c69c0f7%2Fimage.png/size/w=2000?exp=1767996506&sig=0FOHFCEES7pXu1Ldt7W9eNrP6bsN6V1LUI_ufPHoQRs&id=21d3a307-48f4-8037-b3a6-c68e238bdef9&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
:::

:::column width=55

The player combat system was built entirely in Blueprints and supports two primary magic weapons:

- Lightning Spell  
  A raycast-based attack that deals instant damage. Accuracy is affected by whether the player is aiming.

- Flame Spell  
  A shotgun-style attack that fires multiple rays with spread. It can hit multiple enemies and deals high close-range damage.

Both weapons share a common accuracy and aiming logic, keeping combat readable while supporting different playstyles.
:::
:::

---

## Melee and Stealth System

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F4e941848-a358-4177-a5d2-a5a73d45180e%2Fimage.png/size/w=2000?exp=1767996395&sig=Ousghz9tOUms0nBDQycFz5x916z2ukFX-qYk2jMu0KQ&id=21d3a307-48f4-80b5-a7ce-ec1fa9e7b79e&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
:::

:::column width=55

Since the player starts with no mana, a melee combat system was implemented to support early gameplay and stealth mechanics.

- A backstab attack triggers when enemies are unaware and the player is positioned correctly.
- A sweep melee attack is used when stealth conditions are not met, damaging all enemies in front of the player.

This system helped teach stealth organically while providing a reliable fallback combat option.
:::
:::

---

## Footstep System

:::columns
:::column width=25
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2Fae79fb60-4160-4b9d-a06f-b5052e93e3e2%2Fimage.png/size/w=2000?exp=1767996663&sig=4aVzjJhQ6_A1IembsU-gWR4f_PCGSDGGb0iYpuVWM4k&id=21a3a307-48f4-8094-8935-de93786ba3ea&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
:::

:::column width=65

A dynamic footstep system was implemented entirely in Blueprints using FMOD.

Footstep sounds are triggered via animation notifies and paired with a downward raycast that detects the physical material of the ground. Parameters are passed to FMOD to select appropriate sounds based on surface type and player movement state (walking or running).

This resulted in a highly responsive and immersive footstep system.
:::
:::

---

## Animation and VFX Integration

:::columns
:::column width=45
Player animations and VFX were integrated with gameplay logic to reflect weapon state and resource availability.

- Locomotion animations switch based on whether the player has mana.
- Weapon-specific VFX clearly communicate whether lightning or flame magic is selected.

This improved gameplay readability without adding UI complexity.

---

![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F9ba013bd-ddf5-40ed-a6e5-373365e002ab%2Fimage.png/size/w=2000?exp=1767996761&sig=0Hqx7iYxte29gEOxOVEIOSpDnOV81-M3G_WCOrHHRGY&id=21d3a307-48f4-80e0-b561-f79b08f5773b&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
*Quick time event animation loop for the player*
:::
:::column width=50
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2Fee7b2d07-8c47-4d28-9e10-444d5c69c0f7%2Fimage.png/size/w=2000?exp=1767996506&sig=0FOHFCEES7pXu1Ldt7W9eNrP6bsN6V1LUI_ufPHoQRs&id=21d3a307-48f4-8037-b3a6-c68e238bdef9&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
*Armed Locomotion for the player which raises their hand*
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F9d37be8b-e83c-41b1-9a84-37dad8ba9dd7%2Fimage.png/size/w=2000?exp=1767996768&sig=pG2WT94OonLIE_sMDnxGt41rr5JbKe-D6G7FWNqEgU0&id=21d3a307-48f4-8079-a848-ef1714a3e431&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
*Unarmed Locomotion, the player has their arm on the side*
:::
:::



---

## Dynamic Belt Item System

:::columns
:::column width=55
A dynamic joint system was created for items attached to the player’s belt, such as the knife and health potion.

Items sway and react to player movement, speed, and rotation. During specific animations, the player physically grabs these items from the belt (for example, drawing the knife or drinking a potion), reinforcing physicality and realism.
:::

:::column width=40

![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F6bed0f4b-4916-4c81-8dfc-11d9a106ebc3%2Fimage.png/size/w=2000?exp=1767996961&sig=qI0YsuTlZKFGgvrT5tWkRIRpty38jGKRpwfqYtXcvYE&id=21d3a307-48f4-80dd-af63-d20659bbb189&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

:::
:::

