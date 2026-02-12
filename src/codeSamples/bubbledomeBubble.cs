using System;
using UnityEngine;
using UnityEngine.Events;

public class Bubble : MonoBehaviour
{
    [Header("Growth Settings")]
    public float growthRate = 0.1f;
    public float maxSizeSpeedCap = 2f;
    public float scaleChangeTimeout = 1.75f;
    public float growthPerStaticTick = 0.2f;
    public float maxRadiusHardCap = 75;

    [Header("Normal Movement Settings")]
    public float baseSpeed = 5f;
    public float minSpeed = 1f;

    [Header("Launch Boost Settings")]
    public AnimationCurve launchSpeedMultiplier = new AnimationCurve(
        new Keyframe(0f, 2f),
        new Keyframe(0.5f, 1f)
    );
    private float launchTime;

    [Header("Visual Effects")]
    public ParticleSystem popParticle;
    public ParticleSystem playerPopParticle;

    public LayerMask bubbleLayer;

    [SerializeField] private float propExplosionForce = 100f;
    [SerializeField] private float propUpwardsModifier = 0.5f;

    [Header("Events")]
    public UnityEvent onBubbleLaunched;
    public UnityEvent<float> onBubbleGrown;
    public UnityEvent<Bubble> onBubbleAbsorbed;
    public UnityEvent<float> onBubblePopped;
    public UnityEvent<Collision> onBubbleCollision;

    [Header("Runtime State")]
    private bool isLaunched;
    private float currentSpeed;
    private Vector3 lastScale;
    private float timeSinceLastScaleChange;

    private static BubbleCollisionManager collisionManager;
    public Transform owner;


    private void Awake()
    {
        Invoke("HandleBubblePop", 30f);
        if (collisionManager == null)
        {
            collisionManager = FindObjectOfType<BubbleCollisionManager>();
        }
        lastScale = transform.localScale;
        timeSinceLastScaleChange = 0f;
        scaleChangeTimeout += UnityEngine.Random.Range(-0.5f, 0.5f);
    }

    private void OnCollisionEnter(Collision other)
    {
        onBubbleCollision?.Invoke(other);

        Bubble otherBubble = other.gameObject.GetComponent<Bubble>();

        if (otherBubble != null && collisionManager != null)
        {
            if (!collisionManager.ShouldProcessCollision(this, otherBubble)) return;

            if (transform.localScale.x >= otherBubble.transform.localScale.x)
            {
                AbsorbBubble(otherBubble);
            }
            else
            {
                otherBubble.AbsorbBubble(this);
            }
        }
        else
        {
            HandleBubblePop();
        }
    }

    private void HandleBubblePop()
    {
        float bubbleRadius = transform.localScale.x / 2f;

        ApplyPlayerKnockback(bubbleRadius);
        ApplyPhysicsExplosion(bubbleRadius);

        onBubblePopped?.Invoke(bubbleRadius);
        if (playerPopParticle != null)
        {
            ParticleSystem instantiatedParticles = Instantiate(playerPopParticle, transform.position, Quaternion.identity);
            instantiatedParticles.transform.localScale = transform.localScale;
        }
        FMODUnity.RuntimeManager.PlayOneShot("event:/PlayerBubblePop", transform.position);
        Destroy(gameObject);
    }

    private void ApplyPlayerKnockback(float radius)
    {
        Collider[] playersInRange = Physics.OverlapSphere(
            transform.position,
            radius * 1.2f,
            LayerMask.GetMask("Player")
        );

        foreach (Collider playerCollider in playersInRange)
        {

            ForceHandling playerForceHandling = playerCollider.GetComponent<ForceHandling>();
            if (playerForceHandling != null)
            {
                if (playerCollider.transform == owner)
                {
                    playerForceHandling.ApplyKnockback(transform, true);
                    continue;
                }
                playerForceHandling.ApplyKnockback(transform);
            }
        }
    }

    private void ApplyPhysicsExplosion(float radius)
    {
        Collider[] objectsInRange = Physics.OverlapSphere(
            transform.position,
            radius * 2f,
            ~LayerMask.GetMask("Player")
        );

        foreach (Collider col in objectsInRange)
        {
            Rigidbody rb = col.GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.AddExplosionForce(
                    propExplosionForce,
                    transform.position,
                    radius * 2f,
                    propUpwardsModifier,
                    ForceMode.Impulse
                );
            }
        }
    }

    private void Start()
    {
        currentSpeed = baseSpeed;
    }

    public void GrowIfNotLaunched()
    {
        if (!isLaunched)
        {
            Grow(Time.deltaTime);
        }
    }

    public void GrowIfNotLaunched(float deltaTime)
    {
        if (!isLaunched)
        {
            Grow(deltaTime);
        }
    }

    public void Grow(float deltaTime)
    {
        Vector3 newScale = transform.localScale + Vector3.one * (growthRate * deltaTime);
        transform.localScale = Vector3.Min(newScale, Vector3.one * maxRadiusHardCap);
        currentSpeed = Mathf.Lerp(baseSpeed, minSpeed, transform.localScale.x / maxSizeSpeedCap);
        onBubbleGrown?.Invoke(transform.localScale.x);
        lastScale = transform.localScale;
        timeSinceLastScaleChange = 0f;
    }

    public void Launch()
    {
        isLaunched = true;
        launchTime = 0f;
        onBubbleLaunched?.Invoke();
    }

    private void Update()
    {
        if (Vector3.Distance(transform.position, Vector3.zero) > 200)
        {
            HandleBubblePop();
        }

        if (isLaunched)
        {
            if (launchTime < launchSpeedMultiplier[launchSpeedMultiplier.length - 1].time)
            {
                launchTime += Time.deltaTime;
                float multiplier = launchSpeedMultiplier.Evaluate(launchTime);
                transform.Translate(Vector3.forward * (currentSpeed * multiplier * Time.deltaTime));
            }
            else
            {
                transform.Translate(Vector3.forward * (currentSpeed * Time.deltaTime));
            }
        }

        if (transform.localScale != lastScale)
        {
            lastScale = transform.localScale;
            timeSinceLastScaleChange = 0f;
        }
        else
        {
            timeSinceLastScaleChange += Time.deltaTime;
            if (timeSinceLastScaleChange >= scaleChangeTimeout && isLaunched)
            {
                Grow(growthPerStaticTick);
                timeSinceLastScaleChange = 0f;
            }
        }
    }

    private void AbsorbBubble(Bubble smallerBubble)
    {
        Transform smallerRoot = smallerBubble.transform;
        Transform currentRoot = transform;

        Vector3 newScale = currentRoot.localScale + smallerRoot.localScale;
        currentRoot.localScale = Vector3.Min(newScale, Vector3.one * maxRadiusHardCap * 1.3f);
        currentSpeed = Mathf.Lerp(baseSpeed, minSpeed, transform.localScale.x / maxSizeSpeedCap);

        if (popParticle != null)
        {
            ParticleSystem instantiatedParticles = Instantiate(popParticle, smallerBubble.transform.position, Quaternion.identity);
            instantiatedParticles.transform.localScale = smallerBubble.transform.localScale;
        }

        onBubbleAbsorbed?.Invoke(smallerBubble);
        Destroy(smallerRoot.gameObject);
    }
}