using UnityEngine;

[CreateAssetMenu(menuName = "Game Settings/Physics Settings", fileName = "PhysicsSettings")]
public class PhysicsSettings : ScriptableObject
{
    [Header("Spline Gravity")]
    public float splineGravityRemap = 5f;
    public AnimationCurve splineGravityCurve;
    public float gravityTowardsSpline = 0.5f;

    [Header("Default Gravity")]
    public float defaultGravity = 0.5f;

    [Header("Torque")]
    public float torqueRange = 5f;
    public AnimationCurve torqueCurve;
    public float torqueTowardsSpline = 0.5f;

    public static event System.Action<PhysicsSettings> SettingsChanged;

    /// <summary>Raise the change event manually.</summary>
    public void NotifyChanged() => SettingsChanged?.Invoke(this);

#if UNITY_EDITOR
    private void OnValidate() => NotifyChanged();
#endif
}