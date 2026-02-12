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

    private Camera mainCamera;
    public float maxSpeed = 10f;
    public Canvas imageToToggle;

    private void Awake()
    {
        leftHandRigidbody = leftHand.GetComponent<Rigidbody>();
        leftHandCollider = leftHand.GetComponentInChildren<Collider>();

        rightHandRigidbody = rightHand.GetComponent<Rigidbody>();
        rightHandCollider = rightHand.GetComponentInChildren<Collider>();

        playerInput = GetComponent<PlayerInput>();


        mainCamera = Camera.main;


        playerInput.actions["RightHandMove"].performed += ctx => rightHandMovement = ctx.ReadValue<Vector2>();
        playerInput.actions["RightHandMove"].canceled += ctx => rightHandMovement = Vector2.zero;
        playerInput.actions["LeftHandMove"].performed += ctx => leftHandMovement = ctx.ReadValue<Vector2>();
        playerInput.actions["LeftHandMove"].canceled += ctx => leftHandMovement = Vector2.zero;
    }
    private void FixedUpdate()
    {

        ApplyHandForce(leftHandRigidbody, rightHandMovement);
        ApplyHandForce(rightHandRigidbody, leftHandMovement);
    }
    private void ApplyHandForce(Rigidbody handRigidbody, Vector2 input)
    {

        Vector3 forwardPlane = mainCamera.transform.forward;
        forwardPlane.y = 0;
        Vector3 rightPlane = mainCamera.transform.right;
        Vector3 inputDirection = new Vector3(input.x, input.y, 0);
        if (inputDirection.magnitude > 0.1f)
        {
            Vector3 forceDirection = mainCamera.transform.right * input.x + mainCamera.transform.up * input.y;
            Vector3 velocity = handRigidbody.velocity;
            Vector3 movementDirection = (rightPlane * input.x + Vector3.up * input.y).normalized;
            movementDirection.z = 0;

            Vector3 forceToAdd = (forceDirection.normalized * moveForce + velocity) * moveForce;
            forceToAdd = Vector3.ClampMagnitude(forceToAdd, maxSpeed) - velocity;
            forceToAdd.z = 0;

            handRigidbody.AddForce(movementDirection * moveForce, ForceMode.Impulse);
            handRigidbody.AddForce(forceToAdd, ForceMode.Impulse);
        }
    }

    public void ToggleImageVisibility(InputAction.CallbackContext ctx)
    {
        imageToToggle.gameObject.SetActive(!imageToToggle.gameObject.activeInHierarchy);
    }
}
