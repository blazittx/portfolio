using UnityEngine;
using TMPro;

public class BirdController : MonoBehaviour
{
    public float baseForwardSpeed = 2f;
    public float turnAngle = 10f;
    public float rotationSpeed = 100f;
    public float flapTextDuration = 0.5f;
    public float flapCooldown = 0.1f;
    public TextMeshPro leftFlapText;
    public TextMeshPro rightFlapText;

    private float _leftFlapTimer;
    private float _rightFlapTimer;
    private float _leftFlapCooldownTimer = 0f;
    private float _rightFlapCooldownTimer = 0f;
    private float _targetRotation = 0f;
    private float _currentRotation = 0f;

    void Start()
    {
        leftFlapText.gameObject.SetActive(false);
        rightFlapText.gameObject.SetActive(false);
    }

    void Update()
    {
        transform.position += transform.forward * (baseForwardSpeed * Time.deltaTime);

        if (Input.GetKeyDown(KeyCode.A) && _leftFlapCooldownTimer <= 0f)
        {
            ShowFlapText(leftFlapText);
            _targetRotation -= turnAngle;
            _leftFlapCooldownTimer = flapCooldown;
        }

        if (Input.GetKeyDown(KeyCode.D) && _rightFlapCooldownTimer <= 0f)
        {
            ShowFlapText(rightFlapText);
            _targetRotation += turnAngle;
            _rightFlapCooldownTimer = flapCooldown;
        }

        _currentRotation = Mathf.MoveTowards(_currentRotation, _targetRotation, rotationSpeed * Time.deltaTime);
        transform.rotation = Quaternion.Euler(0, _currentRotation, 0);

        if (_leftFlapCooldownTimer > 0f)
            _leftFlapCooldownTimer -= Time.deltaTime;

        if (_rightFlapCooldownTimer > 0f)
            _rightFlapCooldownTimer -= Time.deltaTime;

        UpdateFlapTextTimers();
    }

    private void ShowFlapText(TextMeshPro flapText)
    {
        flapText.gameObject.SetActive(true);
        if (flapText == leftFlapText)
            _leftFlapTimer = flapTextDuration;
        else if (flapText == rightFlapText)
            _rightFlapTimer = flapTextDuration;
    }

    private void UpdateFlapTextTimers()
    {
        if (_leftFlapTimer > 0)
        {
            _leftFlapTimer -= Time.deltaTime;
            if (_leftFlapTimer <= 0)
                leftFlapText.gameObject.SetActive(false);
        }

        if (_rightFlapTimer > 0)
        {
            _rightFlapTimer -= Time.deltaTime;
            if (_rightFlapTimer <= 0)
                rightFlapText.gameObject.SetActive(false);
        }
    }
}
