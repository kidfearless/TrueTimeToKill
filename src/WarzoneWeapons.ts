import { App, Columns } from './index.js';
export var WeaponTypes =
[
	"Light Machine Guns",
	"Small Machine Guns",
	"Pistols",
	"Tactical Rifles",
	"Sniper Rifles",
	"Marksman Rifles",
	"Assault Rifles"
];

export interface IDamage
{
	Head: number;
	Chest: number;
	Stomach: number;
	Extremities: number;
	Dropoff: number;
}

export interface IWeapon
{
	WeaponName: string;
	Stats: IWeaponStats;
	Category: string;
	WeaponAttachments: IWeaponAttachment[];
}
/* 
	100		200
	---		--
	1		x

*/
export class Weapon implements IWeapon
{
	GetTimeToKill(damage: number): number
	{
		// Time in seconds here
		let rawNeededShots = 250.0 / damage;

		let shotsFired = rawNeededShots / this.OverallAccuracy;


		let neededShots = Math.ceil(shotsFired);


		let rps = this.Stats.RPM / 60.0;
		// -1 because unless the gun has an open bolt delay it fires instantly
		let result = ((neededShots - 1) / rps);

		let timeToTarget = App.Range / this.Stats.BulletVelocity;
		result += timeToTarget + this.Stats.OpenBoltDelay;

		// return in milliseconds
		return Math.ceil(result * 1000.0);
	}
	GetDamageProfileAtRange(): IDamage
	{
		let def = this.Stats.DamageData["Default"];
		let range = App.Range;
		for (let i = def.length - 1; i >= 0; i--)
		{
			let pro = def[i];
			if (pro.Dropoff <= range)
			{
				return def[i];
			}
		}

		return def[0];
	}
	_DamageProfile: IDamage;
	public get DamageProfile(): IDamage
	{
		if (!this._DamageProfile)
		{
			this._DamageProfile = this.GetDamageProfileAtRange();
		}
		return this._DamageProfile;
	}

	public get HeadTTK(): number
	{
		return this.GetTimeToKill(this.DamageProfile.Head);
	}
	public get ChestTTK(): number
	{
		return this.GetTimeToKill(this.DamageProfile.Chest);

	}
	public get ExtremetiesTTK(): number
	{
		return this.GetTimeToKill(this.DamageProfile.Extremities);

	}
	public get StomachTTK(): number
	{
		return this.GetTimeToKill(this.DamageProfile.Stomach);

	}

	GetTimeToKillFromEnum(id: number, updaterange: boolean = false): number
	{
		if (updaterange)
		{
			this._DamageProfile = undefined;
		}
		switch (id)
		{
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
	WeaponName: string;
	Stats: IWeaponStats;
	Category: string;
	WeaponAttachments: IWeaponAttachment[];
	OverallAccuracy: number = .50;
	HeadshotPercentage: number = .20;
}


export interface IWeaponStats
{
	WeaponSlots: string[];

	DamageData: Record<string, IDamage[]>;

	Burst: boolean;
	RPM: number;
	AltRPM: number;
	OpenBoltDelay: number;
	AimDownSights: number;
	TacticalSprintToFire: number;
	SprintToFire: number;
	ReloadTime: number;
	MagSize: number;
	Movement: number;
	AdsMovement: number;
	BulletVelocity: number;
	RecoilMag: number;
	HorizBounce: number;
	HipfireArea: number;
}

export interface IWeaponSlot
{
	Attachment: string;
	Slot: string;
}

export interface IWeaponAttachment
{
	Name: string;
	Slot: string;
	UnlockLevel: string;
	DifferentDp: number;
	RPMModifier: number;
	RangeModifier: number;
	AimDownSightsModifier: number;
	TacticalSprintToFire: number;
	SprintToFire: number;
	MovementModifier: number;
	ADSMovementModifier: number;
	BulletVelocityModifier: number;
	VerticalRecoilModifier: number;
	HorizontalBounceModifier: number;
	HipfireModifier: number;
	Details: string;
	ReloadModifier: number;
	MagSizeModifier: number;
	DataDate: string;
	SprintModifier: number;
	ADSFiringMoveModifier: number;
	StrafeModifier: number;
}