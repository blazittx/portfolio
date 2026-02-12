using UnityEngine;

public class PlugSnap : MonoBehaviour
{
    public float snapDistance = 1f;
    public float snapSpeed = 5f;

    public string plugColor;

    private Vector3 initialPosition;
    private bool isSnapped = false;
    private bool isWrongSocket = false;

    void Start()
    {
        initialPosition = transform.position;
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
        GameObject[] sockets = GameObject.FindGameObjectsWithTag("Socket");

        Transform nearestSocket = null;
        float nearestDistance = Mathf.Infinity;

        foreach (GameObject socket in sockets)
        {
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
            if (Vector3.Distance(transform.position, nearestSocket.position) < 0.05f)
            {
                string socketColor = nearestSocket.GetComponent<SocketColor>().color;

                transform.position = nearestSocket.position;

                if (socketColor != plugColor)
                {
                    isWrongSocket = true;
                    Debug.LogWarning("Plug snapped to a socket with the wrong color.");

                    GameObject.Find("KillManager").GetComponent<KillManager>().KillPlayers();
                }
                else
                {
                    GetComponent<Rigidbody>().isKinematic = true;
                    GetComponent<Collider>().isTrigger = true;
                    isSnapped = true;
                    Debug.Log("Plug snapped to socket.");
                    GameObject.Find("CableMission").GetComponent<CableMissionManager>().CablePlugged();
                }
            }
            else
            {
                transform.position = Vector3.Lerp(transform.position, nearestSocket.position, snapSpeed * Time.deltaTime);
            }
        }
    }

    void LateUpdate()
    {
        if (isWrongSocket)
        {
            transform.position = initialPosition;
            isWrongSocket = false;
            Debug.LogWarning("Plug snapped back to its original position due to wrong socket.");
        }
    }
}
