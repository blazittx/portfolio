using UnityEngine;

public class PlugSnap : MonoBehaviour
{
    public float snapDistance = 1f; // Distance threshold for snapping
    public float snapSpeed = 5f; // Speed of snapping

    public string plugColor; // Color identifier of the plug

    private Vector3 initialPosition;
    private bool isSnapped = false;
    private bool isWrongSocket = false;

    void Start()
    {
        initialPosition = transform.position; // Store the initial position of the plug
    }

    void Update()
    {
        if (!isSnapped)
        {
            FindAndSnapToSocket();
        }
    }

    void FindAndSnapToSocket()
    {
        // Find all objects tagged as "Socket"
        GameObject[] sockets = GameObject.FindGameObjectsWithTag("Socket");

        Transform nearestSocket = null;
        float nearestDistance = Mathf.Infinity;

        foreach (GameObject socket in sockets)
        {
            // Get color identifier of the socket
            string socketColor = socket.GetComponent<SocketColor>().color;
            float distance = Vector3.Distance(transform.position, socket.transform.position);
            if (distance < snapDistance && distance < nearestDistance)
            {
                nearestSocket = socket.transform;
                nearestDistance = distance;
            }
        }

        if (nearestSocket != null)
        {
            // Check if the plug is close enough to the nearest socket
            if (Vector3.Distance(transform.position, nearestSocket.position) < 0.05f)
            {
                // Get color identifier of the snapped socket
                string socketColor = nearestSocket.GetComponent<SocketColor>().color;

                // Once close enough, snap directly to the socket position
                transform.position = nearestSocket.position;

                if (socketColor != plugColor)
                {
                    isWrongSocket = true; // Mark that the plug snapped to a wrong color socket
                    Debug.LogWarning("Plug snapped to a socket with the wrong color.");

                    //Kill players if plugged into the wrong socket
                    GameObject.Find("KillManager").GetComponent<KillManager>().KillPlayers();
                }
                else
                {
                    // Optionally, you can disable physics for the plug once it's snapped
                    GetComponent<Rigidbody>().isKinematic = true;
                    GetComponent<Collider>().isTrigger = true;
                    isSnapped = true;
                    Debug.Log("Plug snapped to socket."); // Debug message indicating successful snapping
                    GameObject.Find("CableMission").GetComponent<CableMissionManager>().CablePlugged();
                }
            }
            else
            {
                // Smoothly move the plug towards the nearest socket using Lerp
                transform.position = Vector3.Lerp(transform.position, nearestSocket.position, snapSpeed * Time.deltaTime);
            }
        }
    }

    void LateUpdate()
    {
        if (isWrongSocket)
        {
            // Snap back to the initial position if plugged into the wrong socket
            transform.position = initialPosition;
            isWrongSocket = false; // Reset the wrong socket flag
            Debug.LogWarning("Plug snapped back to its original position due to wrong socket.");
        }
    }
}
