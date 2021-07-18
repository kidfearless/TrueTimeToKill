import { App, Columns } from './index.js';
export var WeaponTypes = [
    "Light Machine Guns",
    "Small Machine Guns",
    "Pistols",
    "Tactical Rifles",
    "Sniper Rifles",
    "Marksman Rifles",
    "Assault Rifles"
];
export class Weapon {
    constructor() {
        this.OverallAccuracy = .50;
        this.HeadshotPercentage = .20;
    }
    GetTimeToKill(damage) {
        let rawNeededShots = 250.0 / damage;
        let shotsFired = rawNeededShots / this.OverallAccuracy;
        let neededShots = Math.ceil(shotsFired);
        let rps = this.Stats.RPM / 60.0;
        let result = ((neededShots - 1) / rps);
        let timeToTarget = App.Range / this.Stats.BulletVelocity;
        result += timeToTarget + this.Stats.OpenBoltDelay;
        return Math.ceil(result * 1000.0);
    }
    GetDamageProfileAtRange() {
        let def = this.Stats.DamageData["Default"];
        let range = App.Range;
        for (let i = def.length - 1; i >= 0; i--) {
            let pro = def[i];
            if (pro.Dropoff <= range) {
                return def[i];
            }
        }
        return def[0];
    }
    get DamageProfile() {
        if (!this._DamageProfile) {
            this._DamageProfile = this.GetDamageProfileAtRange();
        }
        return this._DamageProfile;
    }
    get HeadTTK() {
        return this.GetTimeToKill(this.DamageProfile.Head);
    }
    get ChestTTK() {
        return this.GetTimeToKill(this.DamageProfile.Chest);
    }
    get ExtremetiesTTK() {
        return this.GetTimeToKill(this.DamageProfile.Extremities);
    }
    get StomachTTK() {
        return this.GetTimeToKill(this.DamageProfile.Stomach);
    }
    GetTimeToKillFromEnum(id, updaterange = false) {
        if (updaterange) {
            this._DamageProfile = undefined;
        }
        switch (id) {
            case Columns.Chest:
                return this.ChestTTK;
            case Columns.Head:
                return this.HeadTTK;
            case Columns.Stomach:
                return this.StomachTTK;
            case Columns.Extremeties:
                return this.ExtremetiesTTK;
            default:
                return Number.NaN;
        }
    }
}
//# sourceMappingURL=WarzoneWeapons.js.map