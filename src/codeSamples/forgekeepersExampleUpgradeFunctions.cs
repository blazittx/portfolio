public void IncreaseWeaponAmmoCapacity(float percentage)
{
    Debug.Log($"[WeaponUpgradeManager] IncreaseWeaponAmmoCapacity called with percentage: {percentage}");

    WeaponPrefab rightWeapon = playerShoot.GetRightHandWeapon();
    if (rightWeapon != null)
    {
        int oldCapacity = rightWeapon.ammoCapacity;
        int increaseAmount = Mathf.RoundToInt(oldCapacity * (percentage / 100f));
        rightWeapon.ammoCapacity = oldCapacity + increaseAmount;

        Debug.Log(
            $"[WeaponUpgradeManager] Right weapon ammoCapacity changed from {oldCapacity} to {rightWeapon.ammoCapacity} (increased by {increaseAmount}).");
    }

    WeaponPrefab leftWeapon = playerShoot.GetLeftHandWeapon();
    if (leftWeapon != null)
    {
        int oldCapacity = leftWeapon.ammoCapacity;
        int increaseAmount = Mathf.RoundToInt(oldCapacity * (percentage / 100f));
        leftWeapon.ammoCapacity = oldCapacity + increaseAmount;

        Debug.Log(
            $"[WeaponUpgradeManager] Left weapon ammoCapacity changed from {oldCapacity} to {leftWeapon.ammoCapacity} (increased by {increaseAmount}).");
    }
}

public void IncreaseWeaponBulletCount(int amount)
{
    Debug.Log($"[WeaponUpgradeManager] IncreaseWeaponBulletCount called with amount: {amount}");

    WeaponPrefab rightWeapon = playerShoot.GetRightHandWeapon();
    if (rightWeapon != null)
    {
        int oldCount = rightWeapon.bulletCount;
        rightWeapon.bulletCount += amount;

        Debug.Log(
            $"[WeaponUpgradeManager] Right weapon bulletCount changed from {oldCount} to {rightWeapon.bulletCount} (increased by {amount}).");
    }

    WeaponPrefab leftWeapon = playerShoot.GetLeftHandWeapon();
    if (leftWeapon != null)
    {
        int oldCount = leftWeapon.bulletCount;
        leftWeapon.bulletCount += amount;

        Debug.Log(
            $"[WeaponUpgradeManager] Left weapon bulletCount changed from {oldCount} to {leftWeapon.bulletCount} (increased by {amount}).");
    }
}