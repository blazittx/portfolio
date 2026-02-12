using UnityEngine;
using FMODUnity;

public class FuelTank : MonoBehaviour
{
    public bool IsFilling = false;
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
            Destroy(instantiatedDeathZone);
        }
        alarmSoundInstance.stop(FMOD.Studio.STOP_MODE.ALLOWFADEOUT);
        alarm = false;
        fillPercentage = 0f;
    }
}
