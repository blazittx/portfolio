using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    [Header("Hand GameObjects")]
    public GameObject leftHand;
    public GameObject rightHand;

    [Header("Hand Rigidbodies")]
    private Rigidbody leftHandRigidbody;
    private Rigidbody rightHandRigidbody;

    [Header("Hand Colliders")]
    private Collider leftHandCollider;
    private Collider rightHandCollider;

    [Header("Movement Settings")]
    public float moveForce = 10f;


    [Header("Player Input")]
    private PlayerInput playerInput;

    [Header("Hand Movement")]
    private Vector2 leftHandMovement;
    private Vector2 rightHandMovement;

    private Camera mainCamera; // Reference to the main camera
    public float maxSpeed = 10f;
    public Canvas imageToToggle;

    private void Awake()
    {
        leftHandRigidbody = leftHand.GetComponent<Rigidbody>();
        leftHandCollider = leftHand.GetComponentInChildren<Collider>();

        rightHandRigidbody = rightHand.GetComponent<Rigidbody>();
        rightHandCollider = rightHand.GetComponentInChildren<Collider>();

        playerInput = GetComponent<PlayerInput>();

        // Cache the main camera reference
        mainCamera = Camera.main;

        // Bind the input actions directly from the PlayerInput component
        playerInput.actions["RightHandMove"].performed += ctx => rightHandMovement = ctx.ReadValue<Vector2>();
        playerInput.actions["RightHandMove"].canceled += ctx => rightHandMovement = Vector2.zero;
        playerInput.actions["LeftHandMove"].performed += ctx => leftHandMovement = ctx.ReadValue<Vector2>();
        playerInput.actions["LeftHandMove"].canceled += ctx => leftHandMovement = Vector2.zero;
    }
    private void FixedUpdate()
    {
        // Flip the input values so the players perspective is taken into account
        ApplyHandForce(leftHandRigidbody, rightHandMovement);
        ApplyHandForce(rightHandRigidbody, leftHandMovement);
    }
    private void ApplyHandForce(Rigidbody handRigidbody, Vector2 input)
    {
        // Convert input to a direction in the camera's plane
        Vector3 forwardPlane = mainCamera.transform.forward;
        forwardPlane.y = 0; // Flatten the forward vector to ensure movement is in the horizontal plane
        Vector3 rightPlane = mainCamera.transform.right;
        Vector3 inputDirection = new Vector3(input.x, input.y, 0);
        if (inputDirection.magnitude > 0.1f) // looking for a minimum input value
        {
            Vector3 forceDirection = mainCamera.transform.right * input.x + mainCamera.transform.up * input.y;
            Vector3 velocity = handRigidbody.velocity;
            Vector3 movementDirection = (rightPlane * input.x + Vector3.up * input.y).normalized;
            movementDirection.z = 0;
            // Calculate the force to add
            Vector3 forceToAdd = (forceDirection.normalized * moveForce + velocity) * moveForce;
            forceToAdd = Vector3.ClampMagnitude(forceToAdd, maxSpeed) - velocity; // Limit the force to add to the max speed
            forceToAdd.z = 0;
            // Apply the force in the calculated direction
            handRigidbody.AddForce(movementDirection * moveForce, ForceMode.Impulse);
            handRigidbody.AddForce(forceToAdd, ForceMode.Impulse);
        }
    }

    public void ToggleImageVisibility(InputAction.CallbackContext ctx)
    {
        // Ensure that we only toggle when the button is pressed down, not when it's released
        imageToToggle.gameObject.SetActive(!imageToToggle.gameObject.activeInHierarchy);
    }
}
