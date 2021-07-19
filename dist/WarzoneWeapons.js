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
        this.HeadshotPercentage = 0.2;
        this.ChestToBodyRatio = .6;
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
    get TimeToKill() {
        return this.GetEstimatedTimeToKill();
    }
    GetEstimatedTimeToKill() {
        let accuracy = this.OverallAccuracy;
        let hsaccuracy = this.HeadshotPercentage;
        let chestPercentage = (1.0 - hsaccuracy) * this.ChestToBodyRatio;
        let stomachPercentage = (1.0 - hsaccuracy) * (1.0 - this.ChestToBodyRatio);
        let health = 250.0;
        let damageprofile = this.DamageProfile;
        let rawNeededShots = 0;
        do {
            let healthToHS = health / damageprofile.Head;
            let healthToChest = health / damageprofile.Chest;
            let healthToStomach = health / damageprofile.Stomach;
            let pikesmagicformula = ((hsaccuracy * healthToHS) +
                (chestPercentage * healthToChest) +
                (stomachPercentage * healthToStomach)) / (hsaccuracy + chestPercentage + stomachPercentage);
            let shotsneeded = Math.ceil(pikesmagicformula);
            let remaining = shotsneeded;
            let headbullets = Math.ceil(remaining * hsaccuracy);
            remaining -= headbullets;
            let chestbullets = Math.ceil(remaining * chestPercentage);
            remaining -= chestbullets;
            let stomachbullets = remaining;
            let damage = (headbullets * damageprofile.Head) +
                (chestbullets * damageprofile.Chest) +
                (stomachbullets * damageprofile.Stomach);
            health -= damage;
            rawNeededShots += headbullets + chestbullets + stomachbullets;
        } while (health > 0);
        let shotsFired = rawNeededShots / accuracy;
        let neededShots = Math.ceil(shotsFired);
        let rps = this.Stats.RPM / 60.0;
        let result = ((neededShots - 1) / rps);
        let timeToTarget = App.Range / this.Stats.BulletVelocity;
        result += timeToTarget + this.Stats.OpenBoltDelay;
        return Math.ceil(result * 1000.0);
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
            case Columns.TimeToKill:
                return this.TimeToKill;
            default:
                return Number.NaN;
        }
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
}
//# sourceMappingURL=WarzoneWeapons.js.map