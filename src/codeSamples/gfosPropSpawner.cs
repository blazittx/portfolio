using UnityEngine;
using System.Collections.Generic;

public class PropSpawner : MonoBehaviour
{
    public List<GameObject> propPrefabs; 
    public List<BoxCollider> spawnAreas; 
    public int numberOfPropsToSpawn = 10;
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
        GameObject propToSpawn = propPrefabs[Random.Range(0, propPrefabs.Count)];
        BoxCollider selectedArea = spawnAreas[Random.Range(0, spawnAreas.Count)];

        Vector3 spawnPoint = GetRandomPointInCollider(selectedArea);

        GameObject spawnedProp = Instantiate(propToSpawn, spawnPoint, Random.rotation);

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
