using System.Collections.Generic;
using Mirror;
using UnityEngine;
using System.Linq;

public class TrackManager : NetworkBehaviour
{
    TrackSettings trackSettings;
    public static TrackManager Instance { get; private set; }

    [SerializeField] private string trackIdSequenceStr;

    private List<int> trackIdSequence = new List<int>();

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;

        TrackGenerator.OnTrackGenerated += OnTrackGeneratedHandler;
        trackSettings = Resources.Load<TrackSettings>("ScriptableObjectManager/Settings/TrackSettings");
    }

    private void OnDestroy()
    {
        TrackGenerator.OnTrackGenerated -= OnTrackGeneratedHandler;
    }

    [Server]
    public void ResetTrack()
    {
        SetTrackIdSequence(new List<int>());
    }

    [Server]
    public void InitializeFirstTrackSequence()
    {
        var availableIds = trackSettings.availableTiles
            .Select(t => t.id)
            .ToList();

        if (availableIds.Count == 0)
        {
            TenstackLogger.LogError("[TrackManager] No available track tiles found!");
            return;
        }

        var chosen = new List<int>();
        var rand = new System.Random();
        for (int i = 0; i < 1 && availableIds.Count > 0; i++)
        {
            int idx = rand.Next(availableIds.Count);
            chosen.Add(availableIds[idx]);
            availableIds.RemoveAt(idx);
        }

        SetTrackIdSequence(chosen);
        BuildTrackFromScratch();
    }

    public List<int> GetTrackIdSequence()
    {
        return new List<int>(trackIdSequence);
    }

    [Server]
    public void SetTrackIdSequence(List<int> ids)
    {
        trackIdSequence = new List<int>(ids);
        trackIdSequenceStr = string.Join(",", ids);
    }

    [Server]
    public void BuildTrackFromScratch()
    {
        if (TrackGenerator.Instance != null)
        {
            TenstackLogger.Log("[TrackManager] (Server) Building track from current sequence");
            TrackGenerator.Instance.GenerateTrack(trackIdSequence);
        }
    }

    [Server]
    public void BuildTrackNextSequence()
    {
        if (TrackGenerator.Instance != null)
        {
            TenstackLogger.Log("[TrackManager] (Server) Building track from current sequence");
            TrackGenerator.Instance.AddTile(trackSettings.GetRandomTile().id);
        }
    }

    private void OnTrackGeneratedHandler()
    {
        TenstackLogger.Log("[TrackManager] Track generation complete, notifying NewGameManager.");
        if (isServer && NewGameManager.Instance != null)
        {
            if (NewGameManager.Instance.CurrentPhase == NewGameManager.GamePhase.GeneratingTrack)
            {
                NewGameManager.Instance.SetPhase(NewGameManager.GamePhase.SpawningPlayers);
            }
            else if (NewGameManager.Instance.CurrentPhase == NewGameManager.GamePhase.ApplyingModifications)
            {
                // Switch camera back to driving view after track generation
                NewGameManager.Instance.SetPhase(NewGameManager.GamePhase.StartingNextRace);
            }
        }
    }

}