import { App, Columns } from './index.js';
export class Weapon {
    constructor() {
        this.HeadShotPercentage = 0.2;
        this.OverallAccuracy = 0.6;
        this._Damages = {};
    }
    toString() {
        return `{Name: ${this.DisplayName}, RPM: ${this.Rpm}}`;
    }
    get DamageProfile() {
        if (!this._DamageProfile) {
            this._DamageProfile = this.GetDamageProfileAtRange();
        }
        return this._DamageProfile;
    }
    get HeadTTK() {
        if (!this._Damages[Columns.Head]) {
            this._Damages[Columns.Head] = this.GetTimeToKill(this.DamageProfile.Damage.Head);
        }
        return this._Damages[Columns.Head];
    }
    get ChestTTK() {
        if (!this._Damages[Columns.Chest]) {
            this._Damages[Columns.Chest] = this.GetTimeToKill(this.DamageProfile.Damage.Chest);
        }
        return this._Damages[Columns.Chest];
    }
    get ExtremetiesTTK() {
        if (!this._Damages[Columns.Extremeties]) {
            this._Damages[Columns.Extremeties] = this.GetTimeToKill(this.DamageProfile.Damage.Extremeties);
        }
        return this._Damages[Columns.Extremeties];
    }
    get StomachTTK() {
        if (!this._Damages[Columns.Stomach]) {
            this._Damages[Columns.Stomach] = this.GetTimeToKill(this.DamageProfile.Damage.Stomach);
        }
        return this._Damages[Columns.Stomach];
    }
    GetTimeToKillFromEnum(id, updaterange = false) {
        if (updaterange) {
            this._DamageProfile = undefined;
            this._Damages[id] = undefined;
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
    GetDamageProfileAtRange() {
        var range = App.Range;
        for (let i = this.DamageProfiles.length - 1; i >= 0; i--) {
            var pro = this.DamageProfiles[i];
            if (pro.Range <= range) {
                return this.DamageProfiles[i];
            }
        }
        return this.DamageProfiles[0];
    }
    GetTimeToKill(damage) {
        var rawNeededShots = 250.0 / damage;
        var shotsFired = rawNeededShots / this.OverallAccuracy;
        var neededShots = Math.ceil(shotsFired);
        var rps = this.Rpm / 60.0;
        var result = ((neededShots - 1) / rps);
        return Math.ceil(result * 100.0);
    }
}
export class DamageProfile {
}
export class BodyPoints {
    constructor(bodypoints) {
        if (bodypoints.length != 4) {
            throw new Error(`Invalid bodypoints array length, Expected 4 got ${bodypoints.length}`);
        }
        this._underlyingArray = bodypoints;
    }
    get Head() {
        return this._underlyingArray[0];
    }
    get Chest() {
        return this._underlyingArray[1];
    }
    get Stomach() {
        return this._underlyingArray[2];
    }
    get Extremeties() {
        return this._underlyingArray[3];
    }
}
export var Slot;
(function (Slot) {
    Slot["Ammunition"] = "Ammunition";
    Slot["Barrel"] = "Barrel";
    Slot["Bolt"] = "Bolt";
    Slot["BoltAssembly"] = "Bolt Assembly";
    Slot["Laser"] = "Laser";
    Slot["Muzzle"] = "Muzzle";
    Slot["Perk"] = "Perk";
})(Slot || (Slot = {}));
export var Type;
(function (Type) {
    Type["Ar"] = "AR";
    Type["Lmg"] = "LMG";
    Type["Mr"] = "MR";
    Type["Pistols"] = "Pistols";
    Type["Smg"] = "SMG";
    Type["Sr"] = "SR";
    Type["Tr"] = "TR";
})(Type || (Type = {}));
export class Convert {
    static ToWeapons(json) {
        return Cast(JSON.parse(json), ToAny(R("Weapons")));
    }
    static WeaponsToJson(value) {
        return JSON.stringify(Uncast(value, ToAny(R("Weapons"))), null, 2);
    }
}
function InvalidValue(typ, val, key = '') {
    if (key) {
        throw Error(`Invalid value for key "${key}". Expected type ${JSON.stringify(typ)} but got ${JSON.stringify(val)}`);
    }
    throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
}
function JsonToJsProps(typ) {
    if (typ.jsonToJS === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}
function JsToJsonProps(typ) {
    if (typ.jsToJSON === undefined) {
        const map = {};
        typ.props.forEach((p) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}
function Transform(val, typ, getProps, key = '') {
    function TransformPrimitive(typ, val) {
        if (typeof typ === typeof val)
            return val;
        return InvalidValue(typ, val, key);
    }
    function TransformUnion(typs, val) {
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return Transform(val, typ, getProps);
            }
            catch (_) { }
        }
        return InvalidValue(typs, val);
    }
    function TransformEnum(cases, val) {
        if (cases.indexOf(val) !== -1)
            return val;
        return InvalidValue(cases, val);
    }
    function TransformArray(typ, val) {
        if (!Array.isArray(val))
            return InvalidValue("array", val);
        return val.map(el => Transform(el, typ, getProps));
    }
    function TransformDate(val) {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return InvalidValue("Date", val);
        }
        return d;
    }
    function TransformObject(props, additional, val) {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return InvalidValue("object", val);
        }
        const result = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = Transform(v, prop.typ, getProps, prop.key);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = Transform(val[key], additional, getProps, key);
            }
        });
        return result;
    }
    if (typ === "any")
        return val;
    if (typ === null) {
        if (val === null)
            return val;
        return InvalidValue(typ, val);
    }
    if (typ === false)
        return InvalidValue(typ, val);
    while (typeof typ === "object" && typ.ref !== undefined) {
        typ = TypeMap[typ.ref];
    }
    if (Array.isArray(typ))
        return TransformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? TransformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? TransformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? TransformObject(getProps(typ), typ.additional, val)
                    : InvalidValue(typ, val);
    }
    if (typ === Date && typeof val !== "number")
        return TransformDate(val);
    return TransformPrimitive(typ, val);
}
function Cast(val, typ) {
    return Transform(val, typ, JsonToJsProps);
}
function Uncast(val, typ) {
    return Transform(val, typ, JsToJsonProps);
}
function ToAny(typ) {
    return { arrayItems: typ };
}
function ToUnion(...typs) {
    return { unionMembers: typs };
}
function ToObject(props, additional) {
    return { props, additional };
}
function M(additional) {
    return { props: [], additional };
}
function R(name) {
    return { ref: name };
}
const TypeMap = {
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
//# sourceMappingURL=WarzoneWeapons.js.map