using System.Collections;
using System.Collections.Generic;
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.UI;

public class PlayerManager : MonoBehaviour
{
    public static PlayerManager instance;

    private PlayerInputManager playerInputManager;
    private GameObject playerTagCanvas;

    [Header("Player Information")] public List<PlayerCoopHandler> playerDataList;
    public int maxStocks = 5;

    [Header("Customisation")] public GameObject playerTag;
    public List<PlayerColors> playerColor;

    private List<Transform> spawnPoints;
    private int currentSpawnIndex = 0;

    void Start()
    {
        if (instance == null)
            instance = this;

        playerInputManager = FindObjectOfType<PlayerInputManager>();

        if (playerInputManager != null)
        {
            playerInputManager.onPlayerJoined += OnPlayerJoined;
            playerInputManager.onPlayerLeft += OnPlayerLeft;
        }
        else
        {
            Debug.LogError("PlayerInputManager not found in the scene.");
        }

        playerTagCanvas = GameObject.FindGameObjectWithTag("PlayerTagCanvas");
        FindSpawnPoints();
    }

    public void FindSpawnPoints()
    {
        GameObject[] spawnerObjects = GameObject.FindGameObjectsWithTag("PlayerSpawner");
        spawnPoints = new List<Transform>();
        foreach (var spawner in spawnerObjects)
        {
            spawnPoints.Add(spawner.transform);
        }

        if (spawnPoints.Count == 0)
        {
            Debug.LogError("No spawn points with the tag 'PlayerSpawner' found in the scene.");
        }
    }

    private void OnPlayerJoined(PlayerInput playerInput)
    {
        PlayState playState = (PlayState)GameManager.Instance.stateController.currentState;
        if (playState.bStartedGame)
            return;

        GameObject player = playerInput.gameObject;

        PlayerCoopHandler coopHandler = player.AddComponent<PlayerCoopHandler>();
        playerDataList.Add(coopHandler);

        OwnerStartGame ownerStartGame = playerInput.gameObject.GetComponent<OwnerStartGame>();
        ownerStartGame.Initialize();

        SpawnPlayerRoundRobin(player.transform);

        var state = (PlayState)GameManager.Instance.stateController.currentState;
        state.players.Add(coopHandler);

        SettupTagsAndColors(player.transform, coopHandler, playerInput);

        coopHandler.SetStocks(maxStocks);
    }

    private HashSet<Transform> currentlySpawningPlayers = new HashSet<Transform>();

    public void SpawnPlayerRoundRobin(Transform player)
    {
        if (spawnPoints == null || spawnPoints.Count == 0 || currentlySpawningPlayers.Contains(player))
        {
            return;
        }

        spawnPoints.RemoveAll(x => x == null);
        if (spawnPoints.Count == 0)
        {
            return;
        }

        if (currentSpawnIndex >= spawnPoints.Count)
        {
            currentSpawnIndex = 0;
        }

        PlayerCoopHandler playerCoopHandler = player.GetComponent<PlayerCoopHandler>();
        playerCoopHandler.bIsRespawning = true;
        currentlySpawningPlayers.Add(player);
        Transform spawnPoint = spawnPoints[currentSpawnIndex];
        currentSpawnIndex = (currentSpawnIndex + 1) % spawnPoints.Count;
        Vector3 startPoint = player.position;
        Vector3 safeEndPoint = spawnPoint != null ? spawnPoint.position : startPoint;
        Vector3 controlPoint = new Vector3((startPoint.x + safeEndPoint.x) / 2,
            Mathf.Max(startPoint.y, safeEndPoint.y) + 40f, (startPoint.z + safeEndPoint.z) / 2);
        DOTween.Sequence()
            .Append(
                DOTween.To(
                    () => 0f,
                    t =>
                    {
                        Vector3 position = Mathf.Pow(1 - t, 2) * startPoint +
                                           2 * (1 - t) * t * controlPoint +
                                           Mathf.Pow(t, 2) * safeEndPoint;
                        player.position = position;
                    },
                    1f,
                    3f
                ).SetEase(Ease.OutQuad)
            )
            .Join(
                player.DORotateQuaternion(
                    Quaternion.LookRotation((safeEndPoint - player.position).normalized),
                    1f
                ).SetEase(Ease.InOutQuad)
            )
            .OnComplete(() =>
            {
                currentlySpawningPlayers.Remove(player);
                player.GetComponent<PlayerCoopHandler>().ResetBoolean();
                player.GetComponent<ForceHandling>().StartImmunity(1f);
                player.GetComponent<Rigidbody>().isKinematic = false;
            });
    }


    private void SettupTagsAndColors(Transform player, PlayerCoopHandler coopHandler, PlayerInput playerInput)
    {
        int pIndex = playerInput.playerIndex;
        int colorPicked = Random.Range(0, playerColor.Count);

        coopHandler.Initialize(pIndex, playerColor[colorPicked]);
        playerColor.Remove(playerColor[colorPicked]);

        GameObject tagOBJ = Instantiate(playerTag, playerTagCanvas.transform);
        ScreenToWorldSpace tagPositioner = tagOBJ.GetComponent<ScreenToWorldSpace>();
        tagPositioner.InitializeTag(player.transform, playerInput);

        tagOBJ.GetComponentInChildren<Image>().color = coopHandler.myColors.mainColor;

        coopHandler.SetPlayerTag(tagOBJ);

        TextMeshProUGUI textMeshProUGUI =
            tagOBJ.transform.GetChild(1).GetChild(2).transform.GetComponent<TextMeshProUGUI>();
        textMeshProUGUI.text = $"P{playerInput.playerIndex + 1}";
    }

    private void OnPlayerLeft(PlayerInput playerInput)
    {
        GameObject player = playerInput.gameObject;

        Vector3 endPosition = player.transform.position + new Vector3(0, 100, 0);

        player.transform.DOMove(endPosition, 1).SetEase(Ease.InBack).OnComplete(
            () => player.SetActive(false));

        PlayerCoopHandler coopHandler = player.GetComponent<PlayerCoopHandler>();
        playerDataList.Remove(coopHandler);
    }

    private void OnDestroy()
    {
        if (playerInputManager != null)
        {
            playerInputManager.onPlayerJoined -= OnPlayerJoined;
            playerInputManager.onPlayerLeft -= OnPlayerLeft;
        }
    }
}