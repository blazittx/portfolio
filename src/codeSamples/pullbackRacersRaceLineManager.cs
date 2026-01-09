using System;
using System.Collections;
using System.Collections.Generic;
using Mirror;
using Unity.VisualScripting;
using UnityEngine;

public class RaceLineManager : NetworkBehaviour
{
    public static RaceLineManager Instance { get; private set; }

    private LobbySettings _lobbySettings;

    private LocalRaceLineManager _localRaceLineManager;

    [Header("Setup")]
    [SerializeField] GameObject entryPrefab;
    [SerializeField] float refreshRate = .10f;

    public List<ProgressData> dataList = new List<ProgressData>();

    public class ProgressData
    {
        public ulong SteamId;
        public Transform Transform;
        public float Progress;
    }

    #region UnityFunctions

    void Awake()
    {
        if (Instance && Instance != this) Destroy(gameObject);
        else Instance = this;

        _lobbySettings = Resources.Load<LobbySettings>("ScriptableObjectManager/Settings/LobbySettings");
    }

    private void Update()
    {
        if (!isServer) return;

        SetData();
    }

    #endregion

    private void SetData()
    {
        foreach (var data in dataList)
        {
            data.Progress = Track.Instance.GetProgressWithOffset(data.Transform.position, 45f, 15f);
        }
    }


    [Command(requiresAuthority = false)]
    public void CmdRegisterRaceEntry(Transform playerTransform, ulong steamId)
    {
        var data = new ProgressData
        {
            SteamId = steamId,
            Transform = playerTransform,
            Progress = 0
        };
        dataList.Add(data);

        CheckHasEveryoneJoined();
    }


    [Server]
    private void CheckHasEveryoneJoined()
    {
        if (dataList.Count < _lobbySettings.currentPlayerCount) return;

        SetupLocalClient(dataList);

        StartCoroutine(SendProgressDataRoutine());
    }

    [ClientRpc]
    private void SetupLocalClient(List<ProgressData> list)
    {
        _localRaceLineManager.SetupAllEntries(list);
    }

    [Server]
    public void ResetProgressServer()
    {
        foreach (var data in dataList)
        {
            data.Progress = 0;
        }
        SendProgressDataClient(dataList);
    }

    IEnumerator SendProgressDataRoutine()
    {
        while (true)
        {
            yield return new WaitForSeconds(refreshRate);
            if (NewGameManager.Instance.CurrentPhase != NewGameManager.GamePhase.RaceRunning) continue;

            SendProgressDataClient(dataList);
        }
    }

    [ClientRpc]
    private void SendProgressDataClient(List<ProgressData> list)
    {
        _localRaceLineManager.SetData(list);
    }

    public void RegisterLocalRaceLineManager(LocalRaceLineManager localRaceLineManager)
    {
        _localRaceLineManager = localRaceLineManager;
    }
}
