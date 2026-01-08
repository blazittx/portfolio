using UnityEngine;

public class FuelBar : MonoBehaviour
{
    public GameObject fuelBar;
    public FuelTank fuelTank;

    public Material yellowMaterial;
    public Material greenMaterial;
    public Material redMaterial;

    void Update()
    {
        float fuelPercentage = fuelTank.fillPercentage;
        fuelBar.transform.localScale = new Vector3(fuelPercentage / 100.0f, 1f, 1f);

        if (fuelPercentage < 60)
        {
            fuelBar.GetComponent<Renderer>().material = yellowMaterial;
        }
        else if (fuelPercentage >= 60 && fuelPercentage < 80)
        {
            fuelBar.GetComponent<Renderer>().material = greenMaterial;
        }
        else if (fuelPercentage >= 80)
        {
            fuelBar.GetComponent<Renderer>().material = redMaterial;
        }
    }
}
