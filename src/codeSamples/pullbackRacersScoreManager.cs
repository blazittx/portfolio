using System.Collections;
using System.Collections.Generic;
using Mirror;
using UnityEngine;

public class ScoreManager : NetworkBehaviour
{
    public static ScoreManager Instance { get; private set; }

    [Header("Scoring Rules")]
    [SerializeField] private int basePoints = 10;
    [SerializeField] private int pointsDecreasedPerPlace = 2;

    [Header("Reveal Timing")]
    [SerializeField] private float delayBetweenPlayers = 1.2f;
    [SerializeField] private float delayBetweenScoreTypes = 0.6f;

    private readonly Dictionary<ulong, int> placementScore = new();
    private readonly Dictionary<ulong, int> coinScore = new();
    private readonly Dictionary<ulong, int> pendingCoinScore = new();
    private readonly Dictionary<ulong, int> roundPlacement = new();

    public struct ScoreUpdateMessage : NetworkMessage
    {
        public ulong steamId;
        public int placementScore;
        public int coinScore;
    }

    public struct PlacementMessage : NetworkMessage
    {
        public ulong[] steamIds;
        public int[] placements;
    }

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
    }

    public override void OnStartServer()
    {
        NetworkServer.RegisterHandler<ScoreUpdateMessage>((_, msg) => NetworkServer.SendToAll(msg));
        NetworkServer.RegisterHandler<PlacementMessage>((_, msg) => NetworkServer.SendToAll(msg));
    }

    public override void OnStartClient()
    {
        NetworkClient.RegisterHandler<ScoreUpdateMessage>(OnClientScoreUpdate);
        NetworkClient.RegisterHandler<PlacementMessage>(OnClientPlacements);
    }

    [Server]
    public void CachePlacementOrder(List<ulong> finishOrderSteamIds)
    {
        roundPlacement.Clear();

        for (int i = 0; i < finishOrderSteamIds.Count; i++)
            roundPlacement[finishOrderSteamIds[i]] = i + 1;

        var ids = new ulong[finishOrderSteamIds.Count];
        var places = new int[finishOrderSteamIds.Count];

        for (int i = 0; i < finishOrderSteamIds.Count; i++)
        {
            ids[i] = finishOrderSteamIds[i];
            places[i] = i + 1;
        }

        NetworkServer.SendToAll(new PlacementMessage { steamIds = ids, placements = places });
    }

    [Server]
    public void AddPendingCoins(ulong steamId, int coins)
    {
        if (coins <= 0) return;
        pendingCoinScore[steamId] = GetPendingCoins(steamId) + coins;
    }

    [Server]
    public void DistributeRoundScoresSequential(List<ulong> finishOrderSteamIds)
    {
        StartCoroutine(ScoreRevealRoutine(finishOrderSteamIds));
    }

    [Server]
    private IEnumerator ScoreRevealRoutine(List<ulong> finishOrderSteamIds)
    {
        for (int i = 0; i < finishOrderSteamIds.Count; i++)
        {
            ulong id = finishOrderSteamIds[i];

            int gainedPlacementPoints = Mathf.Max(0, basePoints - (i * pointsDecreasedPerPlace));
            placementScore[id] = GetPlacementScore(id) + gainedPlacementPoints;

            BroadcastScore(id);

            yield return new WaitForSeconds(delayBetweenScoreTypes);

            int pending = GetPendingCoins(id);
            if (pending > 0)
            {
                coinScore[id] = GetCoinScore(id) + pending;
                pendingCoinScore.Remove(id);

                BroadcastScore(id);
            }

            yield return new WaitForSeconds(delayBetweenPlayers);
        }
    }

    [Server]
    private void BroadcastScore(ulong steamId)
    {
        NetworkServer.SendToAll(new ScoreUpdateMessage
        {
            steamId = steamId,
            placementScore = GetPlacementScore(steamId),
            coinScore = GetCoinScore(steamId)
        });
    }

    private void OnClientScoreUpdate(ScoreUpdateMessage msg)
    {
        placementScore[msg.steamId] = msg.placementScore;
        coinScore[msg.steamId] = msg.coinScore;
        UpdateScoreboardUI(msg.steamId);
    }

    private void OnClientPlacements(PlacementMessage msg)
    {
        roundPlacement.Clear();
        for (int i = 0; i < msg.steamIds.Length && i < msg.placements.Length; i++)
            roundPlacement[msg.steamIds[i]] = msg.placements[i];

        UpdateAllPlacementsUI();
    }

    private int GetPlacementScore(ulong id) => placementScore.TryGetValue(id, out var v) ? v : 0;
    private int GetCoinScore(ulong id) => coinScore.TryGetValue(id, out var v) ? v : 0;
    private int GetPendingCoins(ulong id) => pendingCoinScore.TryGetValue(id, out var v) ? v : 0;

    private void UpdateScoreboardUI(ulong steamId)
    {
    }

    private void UpdateAllPlacementsUI()
    {
    }
}
