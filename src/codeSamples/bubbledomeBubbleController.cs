using UnityEngine;
using UnityEngine.InputSystem;
using UnityEngine.Events;
using FMODUnity;

public class PlayerBubbleController : MonoBehaviour
{
    public GameObject bubblePrefab;
    public Transform spawnPoint;
    public PhysicsBasedCharacterController characterController;

    public UnityEvent onBubbleStart;
    public UnityEvent<float> onBubbleRelease;
    public UnityEvent<float> onBubbleGrow;

    public float maxChargeBubbleSize = 2f;
    public Transform bubbleSpawnPoint;

    private GameObject currentBubble;
    private bool isGrowing;
    private Vector3 originalSpawnLocalPosition;

    public Transform muzzleParticle;
    public Transform chargeParticle;

    public float BubbleSize => currentBubble != null ? currentBubble.transform.localScale.x : 0;
    public float BubbleSizeNormalized => BubbleSize / maxChargeBubbleSize;

    [Header("FMOD Events")]
    public EventReference bubbleSoundEvent;

    private FMOD.Studio.EventInstance bubbleSoundInstance;

    private void Awake()
    {
        originalSpawnLocalPosition = bubbleSpawnPoint.localPosition;
    }

    public void HandleInput(InputAction.CallbackContext context)
    {
        if (context.started)
        {
            StartBubble();
            onBubbleStart?.Invoke();
        }
        else if (context.canceled)
        {
            ReleaseBubble();
        }
    }

    private void StartBubble()
    {
        if (currentBubble == null)
        {
            bubbleSpawnPoint.localPosition = originalSpawnLocalPosition;

            currentBubble = Instantiate(bubblePrefab, spawnPoint.position, spawnPoint.rotation);
            currentBubble.transform.SetParent(spawnPoint);
            currentBubble.GetComponent<Rigidbody>().isKinematic = true;
            currentBubble.GetComponent<Bubble>().owner = transform;
            isGrowing = true;

            // Start sound effect with 3D attributes
            bubbleSoundInstance = RuntimeManager.CreateInstance(bubbleSoundEvent);
            bubbleSoundInstance.set3DAttributes(RuntimeUtils.To3DAttributes(transform.position));
            bubbleSoundInstance.start();
        }
    }

    private void ReleaseBubble()
    {
        if (currentBubble != null)
        {
            currentBubble.transform.SetParent(null);
            currentBubble.GetComponent<Rigidbody>().isKinematic = false;
            currentBubble.GetComponent<Bubble>().owner = null;

            if (characterController.IsGroundedAndWalking)
                currentBubble.transform.forward = Vector3.ProjectOnPlane(currentBubble.transform.forward, Vector3.up);

            currentBubble.GetComponent<Bubble>().Launch();
            muzzleParticle.localScale = currentBubble.transform.localScale;
            onBubbleRelease?.Invoke(currentBubble.transform.localScale.x);

            bubbleSpawnPoint.localPosition = originalSpawnLocalPosition;
            currentBubble = null;
            isGrowing = false;
            
            RuntimeManager.PlayOneShot("event:/PlayerBubbleShot", transform.position);
        }
        else
        {
            muzzleParticle.localScale = Vector3.zero;
            onBubbleRelease?.Invoke(0);
        }

        // Stop sound effect
        bubbleSoundInstance.stop(FMOD.Studio.STOP_MODE.IMMEDIATE);
        bubbleSoundInstance.release();
    }

    private void LateUpdate()
    {
        if (isGrowing && currentBubble != null)
        {
            var bubble = currentBubble.GetComponent<Bubble>();
            float previousRadius = currentBubble.transform.localScale.x / 2f;
            chargeParticle.localScale = currentBubble.transform.localScale;

            if (previousRadius < maxChargeBubbleSize)
            {
                bubble.GrowIfNotLaunched(Time.deltaTime * Mathf.Max((1 - previousRadius / maxChargeBubbleSize), 0.01f));
                float currentRadius = currentBubble.transform.localScale.x / 2f;
                bubbleSpawnPoint.localPosition = bubbleSpawnPoint.localPosition + (Vector3.forward * (currentRadius - previousRadius));

                float bubbleSizePercentage = currentRadius / maxChargeBubbleSize;
                float speedMultiplier = Mathf.Lerp(1f, characterController.SpeedPercentageWhenAtMaxBubble, bubbleSizePercentage);
                characterController.BubbleSpeedMultipler = speedMultiplier;
            }
            onBubbleGrow?.Invoke(currentBubble.transform.localScale.x);
        }
        if (currentBubble == null)
        {
            characterController.BubbleSpeedMultipler = 1f;
        }
    }
}
