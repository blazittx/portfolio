using UnityEngine;

public class SmoothTurn : MonoBehaviour
{
    public float turnSpeed = 100f;

    void Update()
    {
        float turnDirection = 0f;
        if (Input.GetKey(KeyCode.LeftArrow))
            turnDirection = -1f;
        else if (Input.GetKey(KeyCode.RightArrow))
            turnDirection = 1f;

        transform.Rotate(Vector3.up, turnDirection * turnSpeed * Time.deltaTime);
    }
}
