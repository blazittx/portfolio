using UnityEngine;
using FMODUnity; // Make sure to include the FMODUnity namespace

public class FuelTank : MonoBehaviour
{
    // Variables
    public bool IsFilling = false; // Boolean to check if the fuel tank is being filled
    public float fillPercentage = 0f;
    public GameObject smokeCircle;
    public GameObject CubeScaler;
    bool methodCalled;
    public GameObject DeathZonePrefab;
    private GameObject instantiatedDeathZone;
    public Transform DeathZoneTransform;
    public string alarmSoundEvent;
    private FMOD.Studio.EventInstance alarmSoundInstance;
    public bool alarm;

    private void Update()
    {
        // Code logic
        if (IsFilling && fillPercentage < 100f)
        {
            fillPercentage += Time.deltaTime * 15;
        }

        if (fillPercentage >= 80 && !methodCalled)
        {
            if (!alarm)
            {
                alarm = true;
                alarmSoundInstance = RuntimeManager.CreateInstance(alarmSoundEvent);
                RuntimeManager.AttachInstanceToGameObject(alarmSoundInstance, transform, GetComponent<Rigidbody>());
                alarmSoundInstance.start();
            }

            smokeCircle.SetActive(true);

            instantiatedDeathZone = Instantiate(DeathZonePrefab, DeathZoneTransform.position, Quaternion.identity);

            methodCalled = true;
        }
    }

    public void StopAlarm()
    {
        smokeCircle.SetActive(false);
        if (instantiatedDeathZone != null)
        {
            Destroy(instantiatedDeathZone); // Destroy the instantiated DeathZone object
        }
        alarmSoundInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
        alarm = false;
        fillPercentage = 0f;
    }
}
