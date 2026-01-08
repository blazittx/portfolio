using System.Collections;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using akira;
using UnityEngine;
using TMPro;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class ScoreManager : PersistentSingleton<ScoreManager>
{
    [Header("Reward Settings")]

    [Tooltip("How often do we reward the player for survival time?")]
    public float rewardInterval = 1f;

    [Tooltip("What is the reward value given to the player after each reward interval is met?")]
    public float survivalReward;

    [Header("Prefabs")]
    public GameObject addScorePrefab;

    [Header("References")]
    public GameObject scoreCanvas;
    public TextMeshProUGUI scoreText;

    [SerializeField] private float _timer;
    [SerializeField] private float _currentScore;
    [SerializeField] private float _queuedScore;
    [SerializeField] private bool _canScore = false;
    private VerticalLayoutGroup _verticalLayoutGroup;

    void Start()
    {
        scoreCanvas = GameObject.Find("ScoreCanvas");

        if (scoreCanvas != null)
        {
            Transform childTransform = scoreCanvas.transform.GetChild(0).GetChild(0);
            scoreText = childTransform.GetComponent<TextMeshProUGUI>();
        }
        else
        {
            Debug.LogError("ScoreCanvas is null");
        }

        if (scoreText == null)
        {
            Debug.LogError("Score Text component not found as a child of the ScoreCanvas.");
        }

        _verticalLayoutGroup = scoreCanvas.GetComponent<VerticalLayoutGroup>();
        _canScore = false;
        _currentScore = 0;
        _queuedScore = 0;
        scoreText.text = _currentScore.ToString();
        _verticalLayoutGroup.spacing = 0;
    }


    void Update()
    {
        _timer += Time.deltaTime;

        if (_timer >= rewardInterval && _canScore)
        {
            _queuedScore += survivalReward;
            ApplyQueuedScore();
            _timer = 0;
        }
    }

    public void CanNotScore()
    {
        Debug.Log("Can't score");
        _canScore = false;
    }

    public float CurrentScore
    {
        get { return _currentScore; }
    }

    public void AddScore(float rewardScore)
    {
        _queuedScore += rewardScore;
    }

    private void ApplyQueuedScore()
    {
        if (_queuedScore >= 0)
        {
            _currentScore += _queuedScore;

            var scorePrefab = Instantiate(addScorePrefab, transform);
            scorePrefab.transform.SetParent(scoreCanvas.transform, false);
            scorePrefab.transform.localScale = Vector3.one;
            scorePrefab.GetComponentInChildren<TextMeshProUGUI>().text = "+" + _queuedScore.ToString();

            StartCoroutine(LerpGap(_verticalLayoutGroup.spacing, -130, 0.2f, scorePrefab));
            _queuedScore = 0;
        }
    }

    private IEnumerator LerpGap(float startValue, float endValue, float duration, GameObject scorePrefab)
    {
        float elapsedTime = 0f;

        while (elapsedTime < duration)
        {
            _verticalLayoutGroup.spacing = Mathf.Lerp(startValue, endValue, (elapsedTime / duration));
            elapsedTime += Time.deltaTime;
            yield return null;
        }

        _verticalLayoutGroup.spacing = endValue;
        scoreText.text = _currentScore.ToString();
        StartCoroutine(ScaleScoreText());
        Destroy(scorePrefab);
        _verticalLayoutGroup.spacing = 0;
    }

    private IEnumerator ScaleScoreText()
    {
        Vector3 originalScale = Vector3.one;
        Vector3 targetScale = originalScale * 1.5f;
        float duration = 0.1f;
        float elapsedTime = 0f;

        while (elapsedTime < duration)
        {
            scoreText.transform.localScale = Vector3.Lerp(originalScale, targetScale, elapsedTime / duration);
            elapsedTime += Time.deltaTime;
            yield return null;
        }

        scoreText.transform.localScale = targetScale;

        elapsedTime = 0f;
        while (elapsedTime < duration)
        {
            scoreText.transform.localScale = Vector3.Lerp(targetScale, originalScale, elapsedTime / duration);
            elapsedTime += Time.deltaTime;
            yield return null;
        }

        scoreText.transform.localScale = originalScale;
    }

    private void OnEnable()
    {
        SceneManager.sceneLoaded += OnSceneLoaded;
    }

    private void OnDisable()
    {
        SceneManager.sceneLoaded -= OnSceneLoaded;
    }

    private IEnumerator EnableScoringWithDelay()
    {
        yield return new WaitForSeconds(0.5f);
        _canScore = true;
    }

    private void OnSceneLoaded(Scene scene, LoadSceneMode mode)
    {
        if (scene.name == "GameScene")
        {
            Debug.LogWarning("OnSceneLoaded");
            scoreCanvas.SetActive(true);
            _currentScore = 0;
            scoreText.text = _currentScore.ToString();
            _canScore = false;
            _queuedScore = 0;
            _timer = 0;
            StartCoroutine(EnableScoringWithDelay());
        }
    }
}
