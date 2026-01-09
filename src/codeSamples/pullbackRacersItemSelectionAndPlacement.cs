using System.Collections;
using System.Collections.Generic;
using System.Linq;
using Mirror;
using UnityEngine;

public class CardSelectionManager : NetworkBehaviour
{
    public static CardSelectionManager Instance { get; private set; }

    [Header("Card Setup")]
    [SerializeField] private GameObject cardPrefab;
    [SerializeField] private Transform cardContainer;

    [Header("Settings")]
    [SerializeField] private ItemCardSettings itemCardSettings;

    private readonly Dictionary<int, CardUI> activeCards = new();

    private int selectedCardId = -1;
    private int remainingPlacements = 0;
    private int finishedPlayers = 0;

    private bool isBuildMode = false;
    private bool phaseLocked = false;

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;

        if (itemCardSettings == null)
            itemCardSettings = Resources.Load<ItemCardSettings>("ScriptableObjectManager/Settings/ItemCardSettings");
    }

    [Server]
    public void StartSelectionPhase()
    {
        finishedPlayers = 0;
        selectedCardId = -1;
        remainingPlacements = 0;
        isBuildMode = false;
        phaseLocked = false;

        RpcShowCards(GetRandomCardIds(itemCardSettings.numberOfCardsToShow));
        StartCoroutine(ServerPhaseTimer(itemCardSettings.modificationTimer));
    }

    [Server]
    private IEnumerator ServerPhaseTimer(float seconds)
    {
        float t = seconds;

        while (t > 0f && !phaseLocked)
        {
            t -= Time.deltaTime;
            RpcUpdateTimer(t / seconds);
            yield return null;
        }

        if (phaseLocked) yield break;

        phaseLocked = true;
        RpcForceExitBuildMode();
        StartCoroutine(AdvanceToNextPhase());
    }

    [ClientRpc]
    private void RpcShowCards(List<int> ids)
    {
        ClearUI();

        foreach (int id in ids)
        {
            var go = Instantiate(cardPrefab, cardContainer);
            var ui = go.GetComponent<CardUI>();

            ui.Initialize(id, OnCardClicked);
            ui.SetInteractable(true);

            activeCards[id] = ui;
        }
    }

    private void OnCardClicked(int id)
    {
        if (isBuildMode) return;

        selectedCardId = id;
        remainingPlacements = GetCard(id).itemCount;

        HideCards();
        EnterBuildMode();
    }

    private void EnterBuildMode()
    {
        isBuildMode = true;
        ItemGenerator.Instance.BeginHover(GetCard(selectedCardId).itemType);
    }

    private void ExitBuildMode()
    {
        isBuildMode = false;
        ItemGenerator.Instance.EndHover();
        selectedCardId = -1;
        remainingPlacements = 0;
    }

    public void TryPlaceAt(Vector3 worldPos, float yRotation)
    {
        if (!isBuildMode) return;
        if (selectedCardId < 0) return;
        if (remainingPlacements <= 0) return;

        if (!ItemGenerator.Instance.CanPlaceHere(worldPos)) return;

        CmdPlaceItem(selectedCardId, worldPos, yRotation);

        remainingPlacements--;

        if (remainingPlacements <= 0)
        {
            ExitBuildMode();
            CmdFinishedPlacing();
        }
    }

    [Command(requiresAuthority = false)]
    private void CmdPlaceItem(int cardId, Vector3 pos, float yRot)
    {
        var card = GetCard(cardId);
        if (card == null) return;

        ItemGenerator.Instance.SpawnItemAtPosition(card.itemType, pos, yRot);
    }

    [Command(requiresAuthority = false)]
    private void CmdFinishedPlacing()
    {
        finishedPlayers++;

        if (phaseLocked) return;

        if (finishedPlayers >= NetworkServer.connections.Count)
        {
            phaseLocked = true;
            RpcForceExitBuildMode();
            StartCoroutine(AdvanceToNextPhase());
        }
    }

    [Server]
    private IEnumerator AdvanceToNextPhase()
    {
        RpcHideTimer();
        RpcClearUI();

        yield return new WaitForSeconds(1f);

        if (NewGameManager.Instance != null)
            NewGameManager.Instance.AdvanceToNextPhase();
    }

    [ClientRpc]
    private void RpcUpdateTimer(float normalized)
    {
        var timer = FindFirstObjectByType<TimerBar>();
        if (timer == null) return;

        timer.SetNormalized(normalized);
    }

    [ClientRpc]
    private void RpcHideTimer()
    {
        var timer = FindFirstObjectByType<TimerBar>();
        if (timer == null) return;

        timer.gameObject.SetActive(false);
    }

    [ClientRpc]
    private void RpcForceExitBuildMode()
    {
        if (isBuildMode)
            ExitBuildMode();
    }

    [ClientRpc]
    private void RpcClearUI()
    {
        ClearUI();
    }

    private void ClearUI()
    {
        if (cardContainer == null) return;

        for (int i = cardContainer.childCount - 1; i >= 0; i--)
            Destroy(cardContainer.GetChild(i).gameObject);

        activeCards.Clear();
    }

    private void HideCards()
    {
        foreach (var ui in activeCards.Values)
            ui.gameObject.SetActive(false);
    }

    private List<int> GetRandomCardIds(int count)
    {
        var ids = itemCardSettings.availableCards.Select(c => c.id).ToList();
        var chosen = new List<int>();
        var rng = new System.Random();

        for (int i = 0; i < count && ids.Count > 0; i++)
        {
            int idx = rng.Next(ids.Count);
            chosen.Add(ids[idx]);
            ids.RemoveAt(idx);
        }

        return chosen;
    }

    private ItemCardSO GetCard(int id)
    {
        return itemCardSettings.availableCards.FirstOrDefault(c => c.id == id);
    }
}
