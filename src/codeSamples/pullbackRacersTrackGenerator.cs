using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using DG.Tweening;
using Input;
using UnityEngine;
using Mirror;
using UnityEngine.Splines;
using SkyBrave_Toolkit.Scripts.Scriptable_Game_Events;
using TMPro;

[RequireComponent(typeof(TrackCameraManager))]
public class TrackGenerator : NetworkBehaviour
{
    public static TrackGenerator Instance { get; private set; }

    [SerializeField] private GameObject runtimeTrackPrefab;
    [SerializeField] private LayerMask trackMask;
    [SerializeField] private InputReader ir;

    public Dictionary<int, NetworkIdentity> TileIndices = new();
    public static event Action OnTrackGenerated;
    public GameEvent OnTrackGeneratedEvent;

    private TrackSettings trackSettings;
    [SyncVar][SerializeField] private Transform trackParent;
    private Transform _endTile;
    private Camera _cam;

    private bool isInitialized = false;

    #region Initialization

    private void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;

        trackSettings = Resources.Load<TrackSettings>("ScriptableObjectManager/Settings/TrackSettings");
    }

    public override void OnStartServer()
    {
        base.OnStartServer();

        InitializeTrack();
    }

    [Server]
    private void InitializeTrack()
    {
        if (isInitialized) return;
        isInitialized = true;

        if (trackParent == null)
        {
            GameObject trackGO = Instantiate(runtimeTrackPrefab);
            NetworkServer.Spawn(trackGO);
            trackParent = trackGO.transform;
        }
    }

    #endregion

    #region Helper Functions

    private BezierKnot? SetupNextTrack(GameObject prefab, Vector3 pos, Quaternion rot)
    {
        var splineContainer = prefab.GetComponentInChildren<SplineContainer>();
        if (splineContainer == null) return null;

        var spline = splineContainer.Spline;
        if (spline.Count == 0) return null;

        prefab.transform.position = pos;
        prefab.transform.rotation = rot;

        return spline[^1];
    }

    private void SetupNextSpline(Spline source, Spline target, Vector3 pos, Quaternion rot,
        bool isFirstTrack = false, BezierKnot? previousLastKnot = null)
    {
        for (int i = 0; i < source.Count; i++)
        {
            var knot = source[i];
            knot.Position = rot * knot.Position + pos;
            knot.Rotation = rot * knot.Rotation;

            if (!isFirstTrack && i == 0)
            {
                if (previousLastKnot.HasValue)
                {
                    var prev = previousLastKnot.Value;
                    prev.TangentOut = knot.TangentOut;
                    target[^1] = prev;
                }

                continue;
            }

            target.Add(knot);
        }
    }

    #endregion

    #region Track and Spline Setup

    private void SetupTrack()
    {
        foreach (var tile in TileIndices)
        {
            tile.Value.transform.SetSiblingIndex(tile.Key);
        }

        BezierKnot? lastKnot = new BezierKnot();
        Vector3 lastKnotPos = trackParent.position;
        Quaternion lastKnotRot = Quaternion.identity;

        for (int i = 0; i < trackParent.childCount; i++)
        {
            GameObject prefab = trackParent.GetChild(i).gameObject;
            if (prefab == null) continue;

            lastKnot = SetupNextTrack(prefab, lastKnotPos, lastKnotRot);
            if (lastKnot.HasValue)
            {
                lastKnotPos += lastKnotRot * lastKnot.Value.Position * trackParent.localScale.x;
                lastKnotRot *= lastKnot.Value.Rotation;
            }
        }
    }

    [Server]
    private void SetupSpline()
    {
        var sc = trackParent.GetComponent<SplineContainer>();
        if (sc == null)
        {
            TenstackLogger.LogError("[TrackManager] No SplineContainer found on track parent!");
            return;
        }

        var spline = sc.Spline;
        spline.Clear();

        BezierKnot? lastKnot = null;

        for (int i = 0; i < trackParent.childCount; i++)
        {
            var child = trackParent.GetChild(i);
            var sourceSpline = child.GetComponentInChildren<SplineContainer>()?.Spline;

            if (sourceSpline == null) continue;

            if (i == 0)
            {
                SetupNextSpline(sourceSpline, spline, child.localPosition, child.localRotation, true);
            }
            else
            {
                SetupNextSpline(sourceSpline, spline, child.localPosition, child.localRotation, false, lastKnot);
            }

            if (spline.Count > 0)
            {
                lastKnot = spline[spline.Count - 1];
            }
        }

        var track = trackParent.GetComponent<Track>();
        if (track != null)
        {
            track.RpcSyncSpline(track.GetSplineData());
        }
    }
    private void LocalSetupSpline()
    {
        var sc = trackParent.GetComponent<SplineContainer>();
        if (sc == null)
        {
            TenstackLogger.LogError("[TrackManager] No SplineContainer found on track parent!");
            return;
        }

        var spline = sc.Spline;
        spline.Clear();

        BezierKnot? lastKnot = null;

        for (int i = 0; i < trackParent.childCount; i++)
        {
            var child = trackParent.GetChild(i);
            var sourceSpline = child.GetComponentInChildren<SplineContainer>()?.Spline;

            if (sourceSpline == null) continue;

            if (i == 0)
            {
                SetupNextSpline(sourceSpline, spline, child.localPosition, child.localRotation, true);
            }
            else
            {
                SetupNextSpline(sourceSpline, spline, child.localPosition, child.localRotation, false, lastKnot);
            }

            if (spline.Count > 0)
            {
                lastKnot = spline[spline.Count - 1];
            }
        }
    }

    #endregion

    [Server]
    public void GenerateTrack(List<int> tileIdSequence)
    {
        InitializeTrack();
        if (SpawnTile(trackSettings.startTilePrefab).TryGetComponent(out NetworkIdentity netIdent1))
        {
            RpcSetTileIndex(0, netIdent1);
        }

        for (int i = 0; i < tileIdSequence.Count; i++)
        {
            var tileData = trackSettings.availableTiles.FirstOrDefault(t => t.id == tileIdSequence[i]);
            if (SpawnTile(tileData).TryGetComponent(out NetworkIdentity netIdent))
            {
                RpcSetTileIndex(i + 1, netIdent);
                RpcSetCurrentTile(netIdent);
            }
        }

        var endTile = SpawnTile(trackSettings.endTilePrefab);
        RpcSetEndTile(endTile.transform);
        if (endTile.TryGetComponent(out NetworkIdentity netIdent2))
        {
            RpcSetTileIndex(999, netIdent2);
        }

        SetupSpline();

        OnTrackGenerated?.Invoke();
    }

    [ClientRpc]
    private void RpcSetTileIndex(int index, NetworkIdentity netIdent)
    {
        TileIndices[index] = netIdent;
        var tmp = netIdent.GetComponentInChildren<TextMeshPro>();
        if (tmp != null) tmp.text = "SECTION " + index;
    }

    [ClientRpc]
    private void RpcSetEndTile(Transform endTile)
    {
        _endTile = endTile;
    }

    [ClientRpc]
    private void RpcSetCurrentTile(NetworkIdentity netIdent)
    {
        ItemGenerator.Instance.SetCurrentTile(netIdent);
        TrackCameraManager.Instance.SetCurrentTile(netIdent);
    }

    [Server]
    public void AddTile(int id)
    {
        var tileData = trackSettings.availableTiles.FirstOrDefault(t => t.id == id);
        var tile = SpawnTile(tileData);

        var netIdent = tile.GetComponent<NetworkIdentity>();

        RpcSetTile(netIdent, trackParent.childCount - 2);
    }

    [ClientRpc]
    private void RpcSetTile(NetworkIdentity netIdent, int index)
    {
        TileIndices[index] = netIdent;
        var tmp = netIdent.GetComponentInChildren<TextMeshPro>();
        if (tmp != null) tmp.text = "SECTION " + index;

        SetupTrack();
        LocalSetupSpline();

        ItemGenerator.Instance.SetCurrentTile(netIdent);
        TrackCameraManager.Instance.SetCurrentTile(netIdent);
        TrackCameraManager.Instance.SetCameraState(TrackCameraManager.CameraState.TrackGeneration);

        StartCoroutine(AddTileRoutine(netIdent.gameObject));
    }


    IEnumerator AddTileRoutine(GameObject tile)
    {
        OnTrackGeneratedEvent?.Raise();
        List<MeshRenderer> tileMeshes = new List<MeshRenderer>();
        foreach (MeshRenderer mesh in tile.transform.GetComponentsInChildren<MeshRenderer>())
        {
            tileMeshes.Add(mesh);
            mesh.enabled = false;
        }
        _endTile.transform.localScale = Vector3.zero;

        yield return new WaitForSeconds(0.5f);

        tile.transform.localScale = Vector3.zero;

        foreach (MeshRenderer mesh in tileMeshes)
        {
            mesh.enabled = true;
        }
        tile.transform.DOScale(1f, 0.4f).SetEase(Ease.InQuad);

        yield return new WaitForSeconds(1);

        OnTrackGeneratedEvent?.Raise();
        _endTile.transform.DOScale(1f, 0.4f).SetEase(Ease.InQuad);

        yield return new WaitForSeconds(2.5f);
        OnTrackGenerated?.Invoke();
    }

    [Server]
    private GameObject SpawnTile(LevelPrefabSO tileData)
    {
        if (!isInitialized || tileData?.prefab == null || trackParent == null) return null;

        Vector3 spawnPosition;
        Quaternion spawnRotation;

        var lastPiece = trackParent.childCount > 0 ? trackParent.GetChild(trackParent.childCount - 1) : null;

        if (lastPiece == null || tileData == trackSettings.startTilePrefab)
        {
            spawnPosition = Vector3.zero;
            spawnRotation = Quaternion.identity;
        }
        else
        {
            var spline = lastPiece.GetComponentInChildren<SplineContainer>()?.Spline;
            if (spline != null && spline.Count > 0)
            {
                var lastKnot = spline[^1];
                spawnPosition = lastPiece.TransformPoint(lastKnot.Position);
                spawnRotation = lastPiece.rotation * lastKnot.Rotation;
            }
            else
            {
                spawnPosition = lastPiece.position + lastPiece.forward * 5f;
                spawnRotation = lastPiece.rotation;
            }
        }

        GameObject tileGO = Instantiate(tileData.prefab, spawnPosition, spawnRotation, trackParent);
        NetworkServer.Spawn(tileGO);
        SetParentClient(tileGO, trackParent);
        return tileGO;
    }

    [ClientRpc]
    private void SetParentClient(GameObject obj, Transform parent)
    {
        obj.transform.SetParent(parent);
    }

}
