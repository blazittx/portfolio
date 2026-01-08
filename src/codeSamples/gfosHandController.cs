using UnityEngine;
using UnityEngine.InputSystem;

[RequireComponent(typeof(Rigidbody))]
public class HandController : MonoBehaviour
{
    [Header("Grabbing Settings")]
    [SerializeField] private LayerMask grabbableLayer;
    [SerializeField] private float grabCheckRadius = 0.5f;
    [SerializeField] private float strainThreshold = 100f;

    [Header("Player Body")]
    [SerializeField] private Rigidbody playerBody;
    private Rigidbody handRigidbody;
    private Joint handJoint;
    private PlayerInput playerInput;
    private Vector2 movementInput;
    [SerializeField] private float grabForce;

    [Header("Animation")]
    [SerializeField] private Animator handAnimator;

    [Header("Sprite Settings")]
    [SerializeField] private SpriteRenderer handSpriteRenderer;

    private bool isGrabbing;
    private bool underStrain;
    private bool prepareToGrab;

    private void Awake()
    {
        InitializeComponents();
        AssignInputActions();
    }

    private void InitializeComponents()
    {
        handRigidbody = GetComponentInParent<Rigidbody>();
        playerInput = GetComponentInParent<PlayerInput>();
    }

    private void AssignInputActions()
    {
        string handMoveAction = gameObject.tag == "LeftHand" ? "RightHandMove" : "LeftHandMove";
        string handGrabAction = gameObject.tag == "LeftHand" ? "RightHandGrab" : "LeftHandGrab";

        playerInput.actions[handMoveAction].performed += ctx => movementInput = ctx.ReadValue<Vector2>();
        playerInput.actions[handMoveAction].canceled += ctx => movementInput = Vector2.zero;
        playerInput.actions[handGrabAction].performed += ctx => StartPreparationToGrab();
        playerInput.actions[handGrabAction].canceled += ctx => StopPreparationToGrab();
    }

    private void StartPreparationToGrab()
    {
        prepareToGrab = true;
        TryGrab();
    }

    private void StopPreparationToGrab()
    {
        prepareToGrab = false;
        if (isGrabbing)
            ReleaseGrab();
    }

    private void FixedUpdate()
    {
        HandleGrabbing();
        HandleMovementAndStrain();
    }

    private void HandleGrabbing()
    {
        if (prepareToGrab && !isGrabbing)
        {
            TryGrab();
        }
    }

    private void HandleMovementAndStrain()
    {
        if (isGrabbing && movementInput.magnitude > 0.1f && !underStrain && IsConnectedObjectGrabbable())
        {
            ApplyMovementForce();
            CheckForStrain();
        }
    }

    private bool IsConnectedObjectGrabbable()
    {
        return handJoint != null && handJoint.connectedBody.gameObject.layer == LayerMask.NameToLayer("Grabbable");
    }

    private void ApplyMovementForce()
    {
        Vector3 forceDirection = GetMovementForceDirection();
        playerBody.AddForce(-forceDirection, ForceMode.Impulse);
    }

    private Vector3 GetMovementForceDirection()
    {
        Vector3 direction = Camera.main.transform.right * movementInput.x + Camera.main.transform.up * movementInput.y;
        direction = direction.normalized * grabForce;
        direction.z = 0;
        return direction;
    }

    private void CheckForStrain()
    {
        Vector3 acceleration = CalculateAcceleration();
        float estimatedForce = acceleration.magnitude * playerBody.mass;
        underStrain = estimatedForce > strainThreshold;
    }

    private Vector3 CalculateAcceleration()
    {
        return (playerBody.velocity - (Vector3)playerBody.GetPointVelocity(handJoint.transform.position)) / Time.fixedDeltaTime;
    }

    private void TryGrab()
    {
        Collider[] colliders = Physics.OverlapSphere(transform.position, grabCheckRadius, grabbableLayer);
        foreach (var collider in colliders)
        {
            if (!IsValidGrabTarget(collider)) continue;

            Rigidbody targetRigidbody = collider.attachedRigidbody;
            AttachToRigidbody(collider, targetRigidbody);
            break;
        }
    }

    private bool IsValidGrabTarget(Collider collider)
    {
        return collider.attachedRigidbody != handRigidbody && collider.transform.root != transform.root;
    }

    private void AttachToRigidbody(Collider collider, Rigidbody targetRigidbody)
    {
        isGrabbing = true;
        UpdateHandAnimator(true);
        handSpriteRenderer.color = Color.green;

        handJoint = CreateJointBasedOnLayer(collider.gameObject.layer);
        handJoint.connectedBody = targetRigidbody;
        handJoint.anchor = transform.InverseTransformPoint(collider.ClosestPoint(transform.position));
    }

    private Joint CreateJointBasedOnLayer(int layer)
    {
        if (layer == LayerMask.NameToLayer("Grabbable"))
        {

            return ConfigureJoint(gameObject.AddComponent<HingeJoint>(), Vector3.forward);
        }
        else
        {
            return ConfigureJoint(gameObject.AddComponent<FixedJoint>(), Vector3.zero);
        }
    }

    private Joint ConfigureJoint(Joint joint, Vector3 axis)
    {
        if (joint is HingeJoint hinge)
        {
            hinge.axis = axis;
        }

        return joint;
    }

    private void ReleaseGrab()
    {
        isGrabbing = false;
        UpdateHandAnimator(false);
        handSpriteRenderer.color = Color.red;
        if (handJoint != null)
        {
            Destroy(handJoint);
            handJoint = null;
        }
    }

    private void UpdateHandAnimator(bool grabbingState)
    {
        if (handAnimator != null)
        {
            handAnimator.SetBool("isGrabbing", grabbingState);
        }
    }

    private void OnDrawGizmos()
    {
        Gizmos.color = Color.green;
        Gizmos.DrawWireSphere(transform.position, grabCheckRadius);
    }

    private void OnDrawGizmosSelected()
    {
        Gizmos.color = Color.yellow;
        Gizmos.DrawWireSphere(transform.position, grabCheckRadius);
    }
}
