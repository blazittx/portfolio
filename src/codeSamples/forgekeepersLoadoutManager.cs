using System;
using System.IO;
using UnityEngine;

public class LoadoutManager : MonoBehaviour
{
    public static LoadoutManager Instance { get; private set; }

    [Serializable]
    public class LoadoutData
    {
        public string leftHandItemId;
        public string rightHandItemId;
        public string legItemId;
        public string coreItemId;
    }

    public LoadoutData Current => currentLoadout;

    private LoadoutData currentLoadout = new LoadoutData();
    private string savePath;

    private void Awake()
    {
        if (Instance != null)
        {
            Destroy(gameObject);
            return;
        }

        Instance = this;
        DontDestroyOnLoad(gameObject);

        savePath = Path.Combine(Application.persistentDataPath, "loadoutSave.json");
        Load();
    }

    public void SetLoadout(string leftHand, string rightHand, string legs, string core)
    {
        currentLoadout.leftHandItemId = leftHand;
        currentLoadout.rightHandItemId = rightHand;
        currentLoadout.legItemId = legs;
        currentLoadout.coreItemId = core;
        Save();
    }

    public void Save()
    {
        var json = JsonUtility.ToJson(currentLoadout, true);
        File.WriteAllText(savePath, json);
    }

    public void Load()
    {
        if (!File.Exists(savePath))
        {
            currentLoadout = new LoadoutData();
            Save();
            return;
        }

        var json = File.ReadAllText(savePath);
        currentLoadout = JsonUtility.FromJson<LoadoutData>(json) ?? new LoadoutData();
    }

    public void ResetSave()
    {
        currentLoadout = new LoadoutData();
        Save();
    }
}
