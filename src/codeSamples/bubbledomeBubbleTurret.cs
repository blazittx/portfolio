using UnityEngine;
using FMODUnity;
using UnityEngine.Events;

public class StaticBubbleTurret : MonoBehaviour
{
    public GameObject bubblePrefab;
    public float spawnInterval = 2f;
    public float finalBubbleSize = 1f;
    public float growthSpeed = 1f;
    public float rotationSpeed = 45f;
    public Transform bubbleSpawnPoint;

    [Header("FMOD Events")]
    public EventReference bubbleSoundEvent;

    [Header("Unity Events")]
    public UnityEvent onBubbleShot;
    public UnityEvent onBubbleGrowing;

    private float nextSpawnTime;
    private GameObject currentBubble;

    private void Update()
    {
        transform.Rotate(Vector3.up, rotationSpeed * Time.deltaTime);

        if (Time.time >= nextSpawnTime && currentBubble == null)
        {
            SpawnBubble();
            nextSpawnTime = Time.time + spawnInterval;
        }
        GrowBubble();
    }

    private void SpawnBubble()
    {
        currentBubble = Instantiate(bubblePrefab, bubbleSpawnPoint.position, bubbleSpawnPoint.rotation);
        currentBubble.transform.SetParent(transform);

        var bubble = currentBubble.GetComponent<Bubble>();
        bubble.owner = transform;

        var rb = currentBubble.GetComponent<Rigidbody>();
        rb.isKinematic = true;
        RuntimeManager.PlayOneShot(bubbleSoundEvent, transform.position);
    }

    private void GrowBubble()
    {
        if (currentBubble != null)
        {
            var bubble = currentBubble.GetComponent<Bubble>();
            float currentSize = currentBubble.transform.localScale.x;

            if (currentSize < finalBubbleSize)
            {
                bubble.GrowIfNotLaunched(Time.deltaTime * growthSpeed);
                onBubbleGrowing?.Invoke();
            }
            else
            {
                currentBubble.transform.SetParent(null);
                currentBubble.GetComponent<Rigidbody>().isKinematic = false;
                bubble.owner = null;
                bubble.Launch();
                currentBubble = null;
                onBubbleShot?.Invoke();
            }
        }
    }
}