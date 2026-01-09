using UnityEngine;
using UnityEngine.InputSystem;

public class MechController : MonoBehaviour
{
    public PlayerStats playerStats;
    
    [Header("Movement Settings")]
    public float pushDuration = 0.2f;
    public float maxVelocity = 5f;
    private float pushEndTime = 0f;

    [Header("Animation Settings")]
    public float maxAnimationSpeed = 1f;
    public float accelerationRate = 0.5f;
    public float decelerationRate = 0.5f;
    private float currentAnimationSpeed = 0f;

    [Header("Rotation Settings")]
    public Transform hips;
    public Transform torso;
    public float turnSpeedWhileMoving = 5f;

    [Header("Aiming Settings")]
    public Transform aimingDot;
    public float dotRadius = 2f;
    public float dotRotationSpeed = 5f;

    private Rigidbody rb;
    private Animator animator;
    private Vector3 moveDirection;
    private PlayerInput playerInput;
    private InputAction moveAction;
    private InputAction lookAction;
    private Camera mainCamera;

    private Vector3 currentDotDirection;
    private bool isUsingController;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        animator = GetComponent<Animator>();
        playerInput = GetComponent<PlayerInput>();
        playerStats = GetComponent<PlayerStats>();
        moveAction = playerInput.actions["Move"];
        lookAction = playerInput.actions["Look"];
        mainCamera = Camera.main;

        currentDotDirection = transform.forward;
    }

    void FixedUpdate()
    {
        Vector2 inputVector = moveAction.ReadValue<Vector2>();
        moveDirection = new Vector3(inputVector.x, 0, inputVector.y).normalized;

        if (isUsingController)
        {
            UpdateAimingDot();
            RotateTorsoTowardsAimingDot();
        }
        else
        {
            RotateTorsoTowardsMouse();
        }

        float targetSpeed = moveDirection.magnitude > 0 ? maxAnimationSpeed : 0;
        currentAnimationSpeed = Mathf.MoveTowards(currentAnimationSpeed, targetSpeed, Time.fixedDeltaTime / (moveDirection.magnitude > 0 ? accelerationRate : decelerationRate));

        UpdateAnimation(currentAnimationSpeed);
        RotateHipsTowardsMovement();

        if (Time.time < pushEndTime && moveDirection.magnitude > 0)
        {
            rb.AddForce(moveDirection * (playerStats.speed * Time.fixedDeltaTime / pushDuration), ForceMode.Force);
        }

        if (rb.velocity.magnitude > maxVelocity)
        {
            rb.velocity = rb.velocity.normalized * maxVelocity;
        }
    }

    private void UpdateAimingDot()
    {
        Vector2 lookInput = lookAction.ReadValue<Vector2>();

        if (lookInput.magnitude > 0.1f)
        {
            Vector3 targetDotDirection = new Vector3(lookInput.x, 0, lookInput.y).normalized;
            currentDotDirection = Vector3.Slerp(currentDotDirection, targetDotDirection, Time.fixedDeltaTime * dotRotationSpeed).normalized;
            Vector3 dotPosition = transform.position + currentDotDirection * dotRadius;
            aimingDot.position = dotPosition;
        }
    }

    private void RotateTorsoTowardsAimingDot()
    {
        Vector3 lookDirection = (aimingDot.position - torso.position).normalized;
        lookDirection.y = 0;
        Quaternion lookRotation = Quaternion.LookRotation(lookDirection, Vector3.up);
        torso.rotation = Quaternion.Slerp(torso.rotation, lookRotation, Time.fixedDeltaTime * playerStats.turnSpeed);
    }

    private void RotateTorsoTowardsMouse()
    {
        Ray ray = mainCamera.ScreenPointToRay(Mouse.current.position.ReadValue());
        if (Physics.Raycast(ray, out RaycastHit hit))
        {
            Vector3 lookDirection = (hit.point - torso.position).normalized;
            lookDirection.y = 0;
            Quaternion lookRotation = Quaternion.LookRotation(lookDirection, Vector3.up);
            torso.rotation = Quaternion.Slerp(torso.rotation, lookRotation, Time.fixedDeltaTime * playerStats.turnSpeed);
       
        }
    }

    public void ApplyStepForce()
    {
        FMODUnity.RuntimeManager.PlayOneShot("event:/Footstep", gameObject.transform.position);

        if (moveDirection != Vector3.zero)
        {
            pushEndTime = Time.time + pushDuration;
        }
    }

    private void UpdateAnimation(float speed)
    {
        animator.SetFloat("Speed", speed);
    }

    private void RotateHipsTowardsMovement()
    {
        if (moveDirection != Vector3.zero)
        {
            Quaternion previousTorsoRotation = torso.rotation;
            Quaternion targetRotation = Quaternion.LookRotation(moveDirection, Vector3.up);
            hips.rotation = Quaternion.Slerp(hips.rotation, targetRotation, Time.fixedDeltaTime * playerStats.turnSpeed);
            torso.rotation = previousTorsoRotation;
        }
    }

    public void SetInputMethod(bool isController)
    {
        isUsingController = isController;
    }
}
