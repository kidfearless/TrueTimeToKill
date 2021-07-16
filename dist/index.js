import { BodyPoints, Convert, DamageProfile, Weapon } from './WarzoneWeapons.js';
export var Columns = {
    WeaponName: 0,
    TimeToKill: 1,
    Head: 2,
    Chest: 3,
    Stomach: 4,
    Extremeties: 5,
    OverallAccuracy: 6,
    HeadshotPercentage: 7,
    Size: 8,
    0: "Weapon Name",
    1: "Time To Kill",
    2: "Head",
    3: "Chest",
    4: "Stomach",
    5: "Extremeties",
    6: "Overall Accuracy",
    7: "Headshot Percentage"
};
export var SortDirection = {
    Descending: -1,
    None: 0,
    Ascending: 1
};
export class App {
    constructor() {
        this.ColumnDirection = {};
        for (let i = 0; i < Columns.Size; i++) {
            this.ColumnDirection[i] = SortDirection.Ascending;
        }
        this.ScriptImportPromise = fetch("https://fx9.github.io/ttk/scripts/guns/all_guns.js").then(this.ScriptImported.bind(this));
    }
    static get Range() {
        return App._Range;
    }
    static set Range(value) {
        App._Range = value;
        if (app.Grid) {
            app.CreateTable(true);
        }
    }
    async ScriptImported(response) {
        Columns['test fun'];
        let script = await response.text();
        script = script.split(';')[1];
        script = script.substring("\nDEFAULT_GUNS = ".length);
        let weapons = Convert.ToWeapons(script);
        this.Weapons = new Array(weapons.length);
        for (let j = 0; j < weapons.length; j++) {
            let weapon = weapons[j];
            let raw = weapon.DamageProfiles;
            weapon.DamageProfiles = [];
            for (let i = 0; i < raw.length; i++) {
                let range = new DamageProfile();
                range.Range = raw[i][0];
                range.Damage = new BodyPoints(raw[i][1]);
                weapon.DamageProfiles[i] = range;
            }
            this.Weapons[j] = Object.assign(new Weapon(), weapon);
        }
    }
    async Ready() {
        this.Grid = document.getElementById("WeaponsTable");
        let range = document.getElementById("RangeInput");
        range.addEventListener("change", (ev) => {
            App.Range = parseFloat(range.value);
        });
        await this.ScriptImportPromise;
        this.CreateTable();
    }
    CreateTable(updaterange = false) {
        this.ClearTable();
        for (let weapon of this.Weapons) {
            let weaponname = this.Grid.children[Columns.WeaponName];
            let span = document.createElement("span");
            span.innerText = weapon.DisplayName;
            weaponname.lastChild.appendChild(span);
            let timetokill = this.Grid.children[Columns.TimeToKill];
            for (let i = Columns.Head; i <= Columns.Extremeties; i++) {
                span = document.createElement("span");
                span.innerText = weapon.GetTimeToKillFromEnum(i, updaterange).toString();
                this.Grid.children[i].lastChild.appendChild(span);
            }
            let overallaccuracy = this.Grid.children[Columns.OverallAccuracy];
            let overallslider = document.createElement("input");
            overallslider.type = "range";
            overallslider.min = "0.01";
            overallslider.max = "1.0";
            overallslider.step = "0.01";
            overallslider.value = weapon.OverallAccuracy.toString();
            overallaccuracy.lastChild.appendChild(overallslider);
            overallslider.addEventListener("mouseup", () => this.OnAccuracyChanged(overallslider, weapon));
            let headshotpercentage = this.Grid.children[Columns.HeadshotPercentage];
            let headshotslider = document.createElement("input");
            headshotslider.type = "range";
            headshotslider.min = "0.01";
            headshotslider.max = "1.0";
            headshotslider.step = "0.01";
            headshotslider.value = weapon.HeadShotPercentage.toString();
            headshotslider.addEventListener("mouseup", () => this.OnHSPercentageChanged(headshotslider, weapon));
            headshotpercentage.lastChild.appendChild(headshotslider);
        }
    }
    OnHSPercentageChanged(headshotslider, weapon) {
        weapon.HeadShotPercentage = parseFloat(headshotslider.value);
        this.CreateTable(true);
    }
    OnAccuracyChanged(overallslider, weapon) {
        weapon.OverallAccuracy = parseFloat(overallslider.value);
        this.CreateTable(true);
    }
    ClearTable() {
        if (this.Grid.children.length > 0) {
            for (let i = 0; i < Columns.Size; i++) {
                this.Grid.children[i].lastChild.innerHTML = "";
            }
        }
        else {
            for (let i = 0; i < Columns.Size; i++) {
                let child = this.CreateColumn(Columns[i], i);
                this.Grid.appendChild(child);
            }
        }
    }
    CreateColumn(title, id) {
        let column = document.createElement("div");
        let header = document.createElement("span");
        header.addEventListener("click", () => this.OnHeaderClicked(id));
        header.innerText = title;
        column.appendChild(header);
        let body = document.createElement("div");
        body.classList.add("column");
        column.appendChild(body);
        column.classList.add("column");
        return column;
    }
    OnHeaderClicked(id) {
        this.ColumnDirection[id] = -this.ColumnDirection[id];
        this.SortTableByID(id);
        this.CreateTable();
        this.CurrentSortID = id;
    }
    SortTableByID(id) {
        switch (id) {
            case Columns.WeaponName:
                this.Weapons.sort((left, right) => this.ColumnDirection[id] * left.DisplayName.localeCompare(right.DisplayName));
                break;
            case Columns.Head:
            case Columns.Chest:
            case Columns.Stomach:
            case Columns.Extremeties:
                this.Weapons.sort((left, right) => this.ColumnDirection[id] * Math.sign(left.GetTimeToKillFromEnum(id) - right.GetTimeToKillFromEnum(id)));
                break;
            default:
                break;
        }
    }
    PopulateTable() {
        for (let child of this.Grid.children) {
            child.innerHTML = "";
        }
    }
}
App._Range = 40;
let app = new App();
window.onload = app.Ready.bind(app);
globalThis.Application = app;
//# sourceMappingURL=index.js.map