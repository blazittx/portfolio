# Key Features and Implementation

---

## Game Prototype

The project started with a rapid prototype built immediately after the initial team alignment. The goal was to establish a playable baseline early so design, art, and programming could iterate directly in Unity.

The prototype enabled early balancing, validated the core co-op idea, and allowed artists and animators to test assets without relying on incomplete gameplay systems.

:::youtube url=https://youtu.be/zpi0UUgCzEg width=60
:::


```csharp file=gp1PelicanController.cs
```

```csharp file=gp1SquirrelController.cs
```

---

## Leaderboard System

An online leaderboard system was implemented to introduce replayability and friendly competition. Scores persist across sessions and are shared globally.

The backend uses Oracle Cloud Autonomous Database accessed through Netlify Serverless Functions. Game events trigger secure server-side score submissions.

A randomized player name system was created using prefix and suffix JSON files stored in the Resources folder.


```csharp file=gp1LeaderboardManager.cs
```

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F4727ca67-c3ea-4a9c-a9af-9b6152042076%2Fimage.png/size/w=2000?exp=1767994708&sig=zzwLZ3zs7CRAx_XjiUMtadhzQBKl0kCxG3dl_ydORJA&id=1433a307-48f4-8071-bc8e-e02bb7a42bb6&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*Oracle database for holding leaderboard entries*

![Gameplay screenshot 2](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F40076564-1290-4f31-a35a-33c623cb4717%2Fimage.png/size/w=2000?exp=1767994845&sig=UfwOmoLNA3kMdIeoVrOsVCKe4E7zFK1xla-juAwh0pI&id=1433a307-48f4-8087-85fc-e88acf90329b&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*Netlify serverless functions*

:::

:::column width=55
:::youtube url=https://youtu.be/EwynNO2ybYk width=90
:::
*Demo of the leaderboard In-Game*
:::
:::

---

## CI/CD Pipeline

A CI/CD pipeline was set up early to support frequent testing and stable builds throughout development.

GitHub Actions handles automated builds, which are uploaded to an Oracle Cloud bucket and distributed through a custom launcher.

```yaml file=gp1BuildGame.yml
```

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F346e10a1-6cc5-49ce-bbc3-8d9e3e6afca0%2Fimage.png/size/w=2000?exp=1767995054&sig=s0QQiynHWgNJguQhzA_YW1kZQjR_3kTPCoDMtB67BeQ&id=1433a307-48f4-8051-b977-fce3b8e781a5&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*Github releases created by the CI/CD pipeline*

![Gameplay screenshot 2](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2Fc186e8c7-6ba7-4996-aa49-d1e937c3a675%2Fimage.png/size/w=2000?exp=1767995057&sig=YA3AEwTxDdt6kvPR40DLKd5yO1WEbr3FUQJPi5xWboc&id=1433a307-48f4-8051-ac11-ec664e13febe&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*Various versions of the game we kept for safe-keeping and QA*

:::

:::column width=55
:::youtube url=https://youtu.be/sANElKZE3ag width=90
:::
*My own game launcher for testing and distrubuting CI/CD built games quickly*
:::
:::


---

## Score System

The score system accumulates points over time rather than awarding instant rewards. Each second adds the points gathered during that interval to the total score.

Unity’s Vertical Layout Group was used to visually stack score increments, creating a clear and satisfying progression effect.

```csharp file=ScoreManager.cs
```

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F99ee4714-982b-41b5-a4fd-bdc65aa943ac%2Fimage.png/size/w=2000?exp=1767995366&sig=jcwXqIzXp5SwhyCBLjpEIUxRpThUgzN551hHIPxzB3c&id=1433a307-48f4-8014-8d50-d64d797b2086&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*Inspector view*
:::

:::column width=55
:::youtube url=https://youtu.be/DZJYjVM_6gU width=90
:::
*Demo of score system*
:::
:::

---

## FMOD Integration


:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F35027dd9-a1e3-4235-b5cf-903484bb4338%2Fimage.png/size/w=2000?exp=1767995562&sig=9UiB8he9fqdIGHGBWRBg0HB5bY6DUsxdOS64j3Sohrg&id=1443a307-48f4-8075-8f12-d2422b928761&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

*FMOD Setup*
:::

:::column width=55
FMOD was integrated to streamline audio playback and iteration. Sounds can be triggered with minimal code, making it easy to add and tweak audio even under tight deadlines.
:::
:::


```csharp file=FmodPlayOneShot
FMODUnity.RuntimeManager.PlayOneShot(EventName, position);
```

---

## Animation Integration

:::columns
:::column width=43
![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F65c53a83-bfb2-477b-aed8-01b43b6018b9%2Fimage.png/size/w=2000?exp=1767995761&sig=2r8ZtnUfIryRuvssgZntXCSxIYK52-RJDx6v5Y1dxvg&id=1453a307-48f4-804e-a900-dd1951954a28&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)

![Gameplay screenshot 1](https://img.notionusercontent.com/s3/prod-files-secure%2Fb1ce6ad4-df17-4518-9922-7b0ca1a8de55%2F75df9915-c98d-4fc0-9ea0-f003f6bcbd96%2Fimage.png/size/w=2000?exp=1767995764&sig=f2qlyvQpNVrBwtDi_aciX-ZY3gz8rkAtJgOST_qDkS0&id=1453a307-48f4-8030-8567-dbf0a4338787&table=block&userId=a0ecd8c0-06bc-416b-8af8-1ff6c8c0c265)
:::

:::column width=55

Animation integration focused on flexibility and ease of use. Generic avatars and avatar masks were set up for the pelican character so each wing could be animated independently.

This approach reduced animator workload and simplified animation logic without sacrificing responsiveness.

---

:::youtube url=https://youtu.be/9EAQVPdWIPc width=90
:::
:::
:::