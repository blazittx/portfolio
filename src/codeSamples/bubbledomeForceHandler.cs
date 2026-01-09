using UnityEngine;
using UnityEngine.Events;
using System.Collections;
using DG.Tweening;

public class ForceHandling : MonoBehaviour
{
    [Header("Force Settings")]
    public float knockBackForce = 50f;
    public float impactObjectSizeForceFactor = 0.5f;
    public float meleeOwnerForceFactor = 0.3f;

    [Header("Slow Motion Settings")]
    public AnimationCurve slowMotionCurve; // Curve for mapping impact size to slow motion effect
    public float maxSlowMotionDuration = 1f; // Cap for max duration of slow motion
    public float minSlowMotionFactor = 0.15f; // Minimum time scale during slow motion
    public float minSlowMotionThreshold = 5f; // Minimum force required for slow motion to trigger
    
    [Header("Cooldown Settings")]
    public float minImpactSizeForRagdoll = 1.5f;
    public float baseCooldownDuration = 1f;
    public float sizeCooldownFactor = 0.5f;
    public float minCooldown = 0.1f;
    public float maxCooldown = 2f;

    [Header("Events")]
    public UnityEvent eventOnKnockBack;
    public UnityEvent eventOnRecover;

    [Header("Invincibility")]
    public bool bIsInvincible = false;
    public bool bIsSpawnInvincible = false;

    private Rigidbody body;
    private bool bCanRecover = false;

    private void Start()
    {
        body = GetComponent<Rigidbody>();
    }
    
    public void ApplyKnockback(Transform impactObject, bool isMelee = false)
    {
        if (bIsSpawnInvincible || bIsInvincible) return;

        // Calculate knockback direction and force
        Vector3 direction = transform.position - impactObject.position;
        direction = direction.normalized;

        float totalForce = knockBackForce * (impactObject.localScale.x * impactObjectSizeForceFactor);
        if (isMelee)
        {
            totalForce *= meleeOwnerForceFactor;
        }

        // Apply the force
        Debug.Log("Applying knockback force: " + totalForce);
        body.AddForce((direction + Vector3.up) * totalForce, ForceMode.Impulse);

        // Apply slow motion based on impact size if force is above threshold
        if (totalForce >= minSlowMotionThreshold)
        {
            Debug.Log("Slow motion force applied: " + totalForce);
            ApplySmoothSlowMotion(impactObject.localScale.x);
        }

        if (impactObject.localScale.x >= minImpactSizeForRagdoll)
        {
            eventOnKnockBack?.Invoke();

            if (isMelee)
            {
                StartCoroutine(ManualCoolDown(0.5f));
            }
            else
            {
                StartCoroutine(CoolDown(impactObject.localScale.x));
            }
        }
    }

    private void ApplySmoothSlowMotion(float impactSize)
    {
        float slowMotionFactor = Mathf.Clamp(slowMotionCurve.Evaluate(impactSize), minSlowMotionFactor, 1f);
        float slowMotionDuration = Mathf.Clamp(slowMotionCurve.Evaluate(impactSize) * maxSlowMotionDuration, 0.1f, maxSlowMotionDuration);
        float restoreTime = slowMotionDuration * 2f; // Gradual return to normal

        // Smoothly slow down Time.timeScale
        DOTween.To(() => Time.timeScale, x => Time.timeScale = x, slowMotionFactor, 0.1f)
            .SetEase(Ease.OutQuint)
            .OnUpdate(() => Time.fixedDeltaTime = Mathf.Lerp(0.02f, 0.0005f, 1 - Time.timeScale))
            .OnComplete(() =>
            {
                // Restore Time.timeScale smoothly
                DOTween.To(() => Time.timeScale, x => Time.timeScale = x, 1f, restoreTime)
                    .SetEase(Ease.InOutCubic)
                    .OnUpdate(() => Time.fixedDeltaTime = Mathf.Lerp(0.0005f, 0.02f, Time.timeScale));
            });
    }

    IEnumerator CoolDown(float impactSize)
    {
        bCanRecover = false;

        float cooldownDuration = baseCooldownDuration + (impactSize * sizeCooldownFactor);
        cooldownDuration = Mathf.Clamp(cooldownDuration, minCooldown, maxCooldown);

        yield return new WaitForSeconds(cooldownDuration);
        bCanRecover = true;
    }

    IEnumerator ManualCoolDown(float cooldownDuration)
    {
        bCanRecover = false;
        yield return new WaitForSeconds(cooldownDuration);
        bCanRecover = true;
    }

    private void OnCollisionStay(Collision collision)
    {
        if (bCanRecover)
        {
            eventOnRecover?.Invoke();
        }
    }

    public void StartImmunity(float spawnInvincibilityTime)
    {
        StartCoroutine(TemporaryImmunity(spawnInvincibilityTime));
    }

    public IEnumerator TemporaryImmunity(float spawnInvincibilityTime)
    {
        bIsSpawnInvincible = true;
        Debug.Log("Player is immune");
        yield return new WaitForSeconds(spawnInvincibilityTime);
        bIsSpawnInvincible = false;
        
        PlayerEvents playerCoopHandler = GetComponent<PlayerEvents>();
        playerCoopHandler.eventOnInvincibilityEnd?.Invoke();

        Debug.Log("Player is not immune");

    }
}
