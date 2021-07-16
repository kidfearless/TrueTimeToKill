// To parse this data:
//
//   import { Convert } from "./file";
import { App, Columns } from './index.js';
//
//   const weapons = Convert.toWeapons(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface IWeapon
{
	Name: string;
	DisplayName: string;
	AttachmentsType: string;
	Type: Type;
	Rpm: number;
	OpenBoltDelayMs: number;
	DamageProfiles: Array<(number | number[])[]> | DamageProfile[];
	Attachments: Attachment[];
	IsCustom?: boolean;
	SelectedAttachments?: any[];
	AdvancedOptions?: any[];

}

export class Weapon implements IWeapon
{
	Name: string;
	DisplayName: string;
	AttachmentsType: string;
	Type: Type;
	Rpm: number;
	OpenBoltDelayMs: number;
	DamageProfiles: DamageProfile[];
	Attachments: Attachment[];
	// IsCustom: boolean;
	// SelectedAttachments: any[];
	// AdvancedOptions: any[];
	HeadShotPercentage: number = 0.2;
	OverallAccuracy: number = 0.6;
	private _DamageProfile: DamageProfile | undefined;
	private _Damages = {};


	//@override
	toString(): string
	{
		return `{Name: ${this.DisplayName}, RPM: ${this.Rpm}}`;
	}

	public get DamageProfile(): DamageProfile
	{
		if (!this._DamageProfile)
		{
			this._DamageProfile = this.GetDamageProfileAtRange();
		}
		return this._DamageProfile;
	}

	public get HeadTTK(): number
	{
		if (!this._Damages[Columns.Head])
		{
			this._Damages[Columns.Head] = this.GetTimeToKill(this.DamageProfile.Damage.Head);
		}
		return this._Damages[Columns.Head];
	}
	public get ChestTTK(): number
	{
		if (!this._Damages[Columns.Chest])
		{
			this._Damages[Columns.Chest] = this.GetTimeToKill(this.DamageProfile.Damage.Chest);
		}
		return this._Damages[Columns.Chest];
	}
	public get ExtremetiesTTK(): number
	{
		if (!this._Damages[Columns.Extremeties])
		{
			this._Damages[Columns.Extremeties] = this.GetTimeToKill(this.DamageProfile.Damage.Extremeties);
		}
		return this._Damages[Columns.Extremeties];
	}
	public get StomachTTK(): number
	{
		if (!this._Damages[Columns.Stomach])
		{
			this._Damages[Columns.Stomach] = this.GetTimeToKill(this.DamageProfile.Damage.Stomach);
		}
		return this._Damages[Columns.Stomach];
	}

	public GetTimeToKillFromEnum(id: number, updaterange: boolean = false): number
	{
		if (updaterange)
		{
			this._DamageProfile = undefined;
			this._Damages[id] = undefined;
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

	public GetDamageProfileAtRange(): DamageProfile
	{
		var range = App.Range;
		for (let i = this.DamageProfiles.length - 1; i >= 0; i--)
		{
			var pro = this.DamageProfiles[i];
			if (pro.Range <= range)
			{
				return this.DamageProfiles[i];
			}
		}

		return this.DamageProfiles[0];
	}

	public GetTimeToKill(damage: number): number
	{
		var rawNeededShots = 250.0 / damage;

		var shotsFired = rawNeededShots / this.OverallAccuracy;


		var neededShots = Math.ceil(shotsFired);


		var rps = this.Rpm / 60.0;
		// -1 because unless the gun has an open bolt delay it fires instantly
		var result = ((neededShots - 1) / rps);

		return Math.ceil(result * 100.0);
	}
}

export class DamageProfile
{
	public Range: number;
	public Damage: BodyPoints;
}

export class BodyPoints
{
	private _underlyingArray: number[];


	public get Head(): number
	{
		return this._underlyingArray[0];
	}
	public get Chest(): number
	{
		return this._underlyingArray[1];
	}
	public get Stomach(): number
	{
		return this._underlyingArray[2];
	}
	public get Extremeties(): number
	{
		return this._underlyingArray[3];
	}

	constructor(bodypoints: number[])
	{
		if (bodypoints.length != 4)
		{
			throw new Error(`Invalid bodypoints array length, Expected 4 got ${bodypoints.length}`);
		}

		this._underlyingArray = bodypoints;
	}
}

export interface Attachment
{
	GunName: string;
	AttName: string;
	Modifiers: Modifiers;
	// AltDamageProfile: Array<DamageProfile[]> | null;
	Slot: Slot;
}

export type RawDamageProfile = number[] | number;

export interface Modifiers
{
	RpmMod: number;
	RangeMod: number;
}

export enum Slot
{
	Ammunition = "Ammunition",
	Barrel = "Barrel",
	Bolt = "Bolt",
	BoltAssembly = "Bolt Assembly",
	Laser = "Laser",
	Muzzle = "Muzzle",
	Perk = "Perk",
}

export enum Type
{
	Ar = "AR",
	Lmg = "LMG",
	Mr = "MR",
	Pistols = "Pistols",
	Smg = "SMG",
	Sr = "SR",
	Tr = "TR",
}

export var WeaponTypes = {
	"AR": "Assault Rifles",
	"LMG": "Large Machine Guns",
	"MR": "Marksmen Rifles",
	"Pistols": "Pistols",
	"SMG": "Small Machine Guns",
	"SR": "Sniper Rifles",
	"TR": "Tactical Rifles"
};

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert
{
	public static ToWeapons(json: string): IWeapon[]
	{
		return Cast(JSON.parse(json), ToAny(R("Weapons")));
	}

	public static WeaponsToJson(value: IWeapon[]): string
	{
		return JSON.stringify(Uncast(value, ToAny(R("Weapons"))), null, 2);
	}
}

function InvalidValue(typ: any, val: any, key: any = ''): never
{
	if (key)
	{
		throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
	}
	throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`,);
}

function JsonToJsProps(typ: any): any
{
	if (typ.jsonToJS === undefined)
	{
		const map: any = {};
		typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
		typ.jsonToJS = map;
	}
	return typ.jsonToJS;
}

function JsToJsonProps(typ: any): any
{
	if (typ.jsToJSON === undefined)
	{
		const map: any = {};
		typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
		typ.jsToJSON = map;
	}
	return typ.jsToJSON;
}

function Transform(val: any, typ: any, getProps: any, key: any = ''): any
{
	function TransformPrimitive(typ: string, val: any): any
	{
		if (typeof typ === typeof val) return val;
		return InvalidValue(typ, val, key);
	}

	function TransformUnion(typs: any[], val: any): any
	{
		// val must validate against one typ in typs
		const l = typs.length;
		for (let i = 0; i < l; i++)
		{
			const typ = typs[i];
			try
			{
				return Transform(val, typ, getProps);
			} catch (_) { }
		}
		return InvalidValue(typs, val);
	}

	function TransformEnum(cases: string[], val: any): any
	{
		if (cases.indexOf(val) !== -1) return val;
		return InvalidValue(cases, val);
	}

	function TransformArray(typ: any, val: any): any
	{
		// val must be an array with no invalid elements
		if (!Array.isArray(val)) return InvalidValue("array", val);
		return val.map(el => Transform(el, typ, getProps));
	}

	function TransformDate(val: any): any
	{
		if (val === null)
		{
			return null;
		}
		const d = new Date(val);
		if (isNaN(d.valueOf()))
		{
			return InvalidValue("Date", val);
		}
		return d;
	}

	function TransformObject(props: { [k: string]: any; }, additional: any, val: any): any
	{
		if (val === null || typeof val !== "object" || Array.isArray(val))
		{
			return InvalidValue("object", val);
		}
		const result: any = {};
		Object.getOwnPropertyNames(props).forEach(key =>
		{
			const prop = props[key];
			const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
			result[prop.key] = Transform(v, prop.typ, getProps, prop.key);
		});
		Object.getOwnPropertyNames(val).forEach(key =>
		{
			if (!Object.prototype.hasOwnProperty.call(props, key))
			{
				result[key] = Transform(val[key], additional, getProps, key);
			}
		});
		return result;
	}

	if (typ === "any") return val;
	if (typ === null)
	{
		if (val === null) return val;
		return InvalidValue(typ, val);
	}
	if (typ === false) return InvalidValue(typ, val);
	while (typeof typ === "object" && typ.ref !== undefined)
	{
		typ = TypeMap[typ.ref];
	}
	if (Array.isArray(typ)) return TransformEnum(typ, val);
	if (typeof typ === "object")
	{
		return typ.hasOwnProperty("unionMembers") ? TransformUnion(typ.unionMembers, val)
			: typ.hasOwnProperty("arrayItems") ? TransformArray(typ.arrayItems, val)
				: typ.hasOwnProperty("props") ? TransformObject(getProps(typ), typ.additional, val)
					: InvalidValue(typ, val);
	}
	// Numbers can be parsed by Date but shouldn't be.
	if (typ === Date && typeof val !== "number") return TransformDate(val);
	return TransformPrimitive(typ, val);
}

function Cast<T>(val: any, typ: any): T
{
	return Transform(val, typ, JsonToJsProps);
}

function Uncast<T>(val: T, typ: any): any
{
	return Transform(val, typ, JsToJsonProps);
}

function ToAny(typ: any)
{
	return { arrayItems: typ };
}

function ToUnion(...typs: any[])
{
	return { unionMembers: typs };
}

function ToObject(props: any[], additional: any)
{
	return { props, additional };
}

function M(additional: any)
{
	return { props: [], additional };
}

function R(name: string)
{
	return { ref: name };
}

const TypeMap: any = {
	"Weapons": ToObject([
		{ json: "name", js: "Name", typ: "" },
		{ json: "display_name", js: "DisplayName", typ: "" },
		{ json: "attachments_type", js: "AttachmentsType", typ: "" },
		{ json: "type", js: "Type", typ: R("Type") },
		{ json: "rpm", js: "Rpm", typ: 0 },
		{ json: "open_bolt_delay_ms", js: "OpenBoltDelayMs", typ: 0 },
		{ json: "default_damage_profile", js: "DamageProfiles", typ: ToAny(ToAny(ToUnion(ToAny(0), 3.14))) },
		{ json: "attachments", js: "Attachments", typ: ToAny(R("Attachment")) },
		{ json: "is_custom", js: "IsCustom", typ: true },
		{ json: "selected_attachments", js: "SelectedAttachments", typ: ToAny("any") },
		{ json: "advanced_options", js: "AdvancedOptions", typ: ToAny("any") },
	], false),
	"Attachment": ToObject([
		{ json: "gun_name", js: "GunName", typ: "" },
		{ json: "att_name", js: "AttName", typ: "" },
		{ json: "modifiers", js: "Modifiers", typ: R("Modifiers") },
		{ json: "alt_damage_profile", js: "AltDamageProfile", typ: ToUnion(ToAny(ToAny(ToUnion(ToAny(0), 3.14))), null) },
		{ json: "slot", js: "Slot", typ: R("Slot") },
	], false),
	"Modifiers": ToObject([
		{ json: "rpm_mod", js: "RpmMod", typ: 3.14 },
		{ json: "range_mod", js: "RangeMod", typ: 3.14 },
	], false),
	"Slot": [
		"Ammunition",
		"Barrel",
		"Bolt",
		"Bolt Assembly",
		"Laser",
		"Muzzle",
		"Perk",
	],
	"Type": [
		"AR",
		"LMG",
		"MR",
		"Pistols",
		"SMG",
		"SR",
		"TR",
	],
};
