using UnityEngine;
using System.Collections.Generic;

public class PropSpawner : MonoBehaviour
{
    public List<GameObject> propPrefabs; // List of prop prefabs to spawn
    public List<BoxCollider> spawnAreas; // List of BoxColliders defining the spawn areas
    public int numberOfPropsToSpawn = 10; // Number of props to spawn
    public float minForce = 1f;
    public float maxForce = 5f;
    public float minTorque = 1f;
    public float maxTorque = 10f;

    void Start()
    {
        if (spawnAreas.Count == 0)
        {
            Debug.LogError("No spawn areas assigned!");
            return;
        }

        for (int i = 0; i < numberOfPropsToSpawn; i++)
        {
            SpawnRandomProp();
        }
    }

    private void SpawnRandomProp()
    {
        // Choose a random prop prefab
        GameObject propToSpawn = propPrefabs[Random.Range(0, propPrefabs.Count)];
        // Choose a random spawn area
        BoxCollider selectedArea = spawnAreas[Random.Range(0, spawnAreas.Count)];

        // Generate a random position within the selected BoxCollider's bounds
        Vector3 spawnPoint = GetRandomPointInCollider(selectedArea);

        // Instantiate the prop at the random position
        GameObject spawnedProp = Instantiate(propToSpawn, spawnPoint, Random.rotation);

        // Apply a random force and torque if the prop has a Rigidbody
        Rigidbody propRb = spawnedProp.GetComponent<Rigidbody>();
        if (propRb != null)
        {
            Vector3 randomForce = Random.insideUnitSphere * Random.Range(minForce, maxForce);
            Vector3 randomTorque = Random.insideUnitSphere * Random.Range(minTorque, maxTorque);

            propRb.AddForce(randomForce, ForceMode.Impulse);
            propRb.AddTorque(randomTorque, ForceMode.Impulse);
        }
    }

    private Vector3 GetRandomPointInCollider(BoxCollider boxCollider)
    {
        Vector3 point = new Vector3(
            Random.Range(-boxCollider.size.x, boxCollider.size.x) * 0.5f,
            Random.Range(-boxCollider.size.y, boxCollider.size.y) * 0.5f,
            Random.Range(-boxCollider.size.z, boxCollider.size.z) * 0.5f
        );

        return boxCollider.transform.TransformPoint(point) + boxCollider.center;
    }
}
