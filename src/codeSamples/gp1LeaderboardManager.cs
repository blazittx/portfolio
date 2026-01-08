using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Text;
using System.Collections.Generic;
using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine.UI;

[System.Serializable]
public class ScoreEntry
{
    public string player_name;
    public float score;
    public string apiKey;
    public string game_id;
}

[System.Serializable]
public class ScoreList
{
    public List<ScoreEntry> scores;
}

public class LeaderboardManager : MonoBehaviour
{
    public static LeaderboardManager Instance { get; private set; }
    
    public GameObject leaderboardEntryPrefab;
    private GameObject currentPlayerEntryGameObject;
    public GameObject leaderboardCanvas;
    public Transform contentPanel;
    public ScrollRect scrollRect;

    [SerializeField] private string API_KEY;
    [SerializeField] private string gameID;
    
    private const string GetLeaderboardUrl = "https://diabolical.studio/.netlify/functions/getLeaderboard";
    private const string UpdateScoreUrl = "https://diabolical.studio/.netlify/functions/updateScore";
    
    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
        }
    }

    public void UploadOrUpdateScore(string playerName, float score)
    {
        StartCoroutine(UploadOrUpdateScoreCoroutine(playerName, score));
    }

    private IEnumerator UploadOrUpdateScoreCoroutine(string playerName, float score)
    {
        int maxAttempts = 20;
        int attempt = 0;
        bool success = false;

        string jsonPayload = JsonConvert.SerializeObject(new { player_name = playerName, score = score, game_id = gameID });
        byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);

        while (attempt < maxAttempts && !success)
        {
            attempt++;

            UnityWebRequest www = UnityWebRequest.PostWwwForm(UpdateScoreUrl, "POST");
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("x-api-key", API_KEY);
            www.uploadHandler = new UploadHandlerRaw(bodyRaw);

            yield return www.SendWebRequest();

            Debug.Log("Request Data: " + jsonPayload);

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error updating score (Attempt " + attempt + "): " + www.error);
            }
            else
            {
                Debug.Log("Response code: " + www.responseCode);
                Debug.Log("Response text: " + www.downloadHandler.text);
                GetLeaderboard();
                success = true;
            }

            if (!success && attempt < maxAttempts)
            {
                yield return new WaitForSeconds(0.5f); 
            }
        }

        if (!success)
        {
            Debug.LogError("Failed to update score after " + maxAttempts + " attempts.");
        }
    }

    [ContextMenu("Get Leaderboard")]
    public void GetLeaderboard()
    {
        StartCoroutine(GetLeaderboardCoroutine());
    }

    IEnumerator GetLeaderboardCoroutine()
    {
        string urlWithGameId = GetLeaderboardUrl + "?game_id=" + gameID;

        using (UnityWebRequest www = UnityWebRequest.Get(urlWithGameId))
        {
            www.SetRequestHeader("Content-Type", "application/json");
            www.SetRequestHeader("x-api-key", API_KEY);

            yield return www.SendWebRequest();

            if (www.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError("Error fetching leaderboard: " + www.error);
            }
            else
            {
                ScoreList scoreList = JsonUtility.FromJson<ScoreList>("{\"scores\":" + www.downloadHandler.text + "}");
                PopulateLeaderboard(scoreList.scores);
            }
        }
    }

    public void PopulateLeaderboard(List<ScoreEntry> leaderboardEntries)
    {
        string currentPlayerName = PlayerPrefs.GetString("PlayerNickname", string.Empty);
        int rank = 1;
        currentPlayerEntryGameObject = null;

        foreach (Transform child in contentPanel)
        {
            Destroy(child.gameObject);
        }

        foreach (var entry in leaderboardEntries)
        {
            GameObject newEntry = Instantiate(leaderboardEntryPrefab, contentPanel);
            LeaderboardEntryUI entryUI = newEntry.GetComponent<LeaderboardEntryUI>();
            entryUI.Setup(entry.player_name, entry.score, rank);

            if (entry.player_name == currentPlayerName)
            {
                Image entryImage = newEntry.GetComponent<Image>();
                if (entryImage != null)
                {
                    entryImage.color = new Color(1f, 1f, 0.5f, 0.3f);
                }
                currentPlayerEntryGameObject = newEntry;
            }

            rank++;
        }
        
        leaderboardCanvas.SetActive(true);

        if (currentPlayerEntryGameObject != null)
        {
            StartCoroutine(ScrollToPlayerEntry(currentPlayerEntryGameObject.transform));
        }
    }

    private IEnumerator ScrollToPlayerEntry(Transform targetEntry)
    {
        yield return new WaitForEndOfFrame();

        Canvas.ForceUpdateCanvases();

        float contentPanelHeight = contentPanel.GetComponent<RectTransform>().rect.height;
        float targetPosInScroll = -(targetEntry as RectTransform).anchoredPosition.y + (scrollRect.transform as RectTransform).rect.height * scrollRect.viewport.anchorMin.y;
        float targetNormalizedPosition = Mathf.Clamp01(targetPosInScroll / contentPanelHeight);

        float duration = 0.5f;
        float timeElapsed = 0f;

        float startNormalizedPosition = scrollRect.verticalNormalizedPosition;

        while (timeElapsed < duration)
        {
            float newPosition = Mathf.Lerp(startNormalizedPosition, 1 - targetNormalizedPosition, timeElapsed / duration);
            scrollRect.verticalNormalizedPosition = newPosition;

            timeElapsed += Time.deltaTime;

            yield return null;
        }

        scrollRect.verticalNormalizedPosition = 1 - targetNormalizedPosition;
    }    
}
