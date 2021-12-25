import { Weapon, WeaponTypes, Games } from './WarzoneWeapons.js';
export var Columns = {
    WeaponName: 0,
    TimeToKill: 1,
    Head: 2,
    Chest: 3,
    Stomach: 4,
    Extremeties: 5,
    OverallAccuracy: 6,
    HeadshotPercentage: 7,
    ChestToStomachRatio: 8,
    Size: 9,
    0: "Weapon Name",
    1: "Time To Kill",
    2: "Head TTK",
    3: "Chest TTK",
    4: "Stomach TTK",
    5: "Extremeties TTK",
    6: "Overall Accuracy",
    7: "Headshot Percentage",
    8: "Chest Percentage"
};
export var SortDirection = {
    Descending: -1,
    None: 0,
    Ascending: 1
};
export class App {
    constructor() {
        this.ColumnDirection = {};
        this.WeaponFilters = {};
        this.GameFilters = {};
        for (let type of WeaponTypes) {
            this.WeaponFilters[type] = true;
        }
        for (let game in Games) {
            this.GameFilters[game] = true;
        }
        for (let i = 0; i < Columns.Size; i++) {
            this.ColumnDirection[i] = SortDirection.Ascending;
        }
        this.ScriptImportPromise = fetch("data/Weapons.min.json").then(this.ScriptImported.bind(this));
    }
    static get Range() {
        return App._Range;
    }
    static set Range(value) {
        App._Range = value;
        if (app.Grid) {
            app.SortTableByID(app.CurrentSortID);
            app.CreateTable(true);
        }
    }
    async ScriptImported(response) {
        let script = await response.json();
        this.Weapons = script;
        for (let j = 0; j < script.length; j++) {
            let weapon = script[j];
            this.Weapons[j] = Object.assign(new Weapon(), weapon);
        }
    }
    async Ready() {
        this.Grid = document.getElementById("WeaponsTable");
        let range = document.getElementById("RangeInput");
        let settings = document.getElementById("SettingsRow");
        range.addEventListener("change", (ev) => {
            App.Range = parseFloat(range.value);
        });
        document.getElementById("AccuracyMinus").addEventListener("click", () => this.ChangeAllAccuracies(-0.01));
        document.getElementById("AccuracyPlus").addEventListener("click", () => this.ChangeAllAccuracies(0.01));
        for (let type of WeaponTypes) {
            let span = document.createElement("span");
            span.style.marginRight = "8px";
            let checkbox = document.createElement("input");
            checkbox.name = type + "_filterbox";
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.addEventListener("click", () => this.OnWeaponTypeFiltered(checkbox, type));
            let label = document.createElement("label");
            label.htmlFor = type + "_filterbox";
            label.textContent = type;
            span.appendChild(checkbox);
            span.appendChild(label);
            span.addEventListener("click", () => this.OnWeaponTypeFiltered(checkbox, type));
            settings.appendChild(span);
        }
        settings.appendChild(document.createElement("br"));
        for (let game in Games) {
            let span = document.createElement("span");
            span.style.marginRight = "8px";
            let checkbox = document.createElement("input");
            checkbox.name = game;
            checkbox.type = "checkbox";
            checkbox.checked = true;
            checkbox.addEventListener("click", () => this.OnGameTypeFiltered(checkbox, game));
            let label = document.createElement("label");
            label.htmlFor = game + "_filterbox";
            label.textContent = Games[game];
            span.appendChild(checkbox);
            span.appendChild(label);
            span.addEventListener("click", () => this.OnGameTypeFiltered(checkbox, game));
            settings.appendChild(span);
        }
        await this.ScriptImportPromise;
        this.CreateTable();
    }
    ChangeAllAccuracies(modifier) {
        for (let weapon of this.Weapons) {
            weapon.OverallAccuracy += modifier;
            weapon.OverallAccuracy = Math.min(1, weapon.OverallAccuracy);
            weapon.OverallAccuracy = Math.max(0.01, weapon.OverallAccuracy);
        }
        this.CreateTable();
    }
    OnWeaponTypeFiltered(checkbox, type) {
        checkbox.checked = !checkbox.checked;
        this.WeaponFilters[type] = checkbox.checked;
        this.CreateTable();
    }
    OnGameTypeFiltered(checkbox, game) {
        checkbox.checked = !checkbox.checked;
        this.GameFilters[game] = checkbox.checked;
        this.CreateTable();
    }
    CreateTable(updaterange = false) {
        this.ClearTable();
        for (let weapon of this.Weapons) {
            if (!this.WeaponFilters[weapon.Category] || !this.GameFilters[weapon.Stats.Game]) {
                continue;
            }
            let weaponname = this.Grid.children[Columns.WeaponName];
            let span = document.createElement("span");
            span.innerText = weapon.WeaponName;
            weaponname.lastChild.appendChild(span);
            for (let i = Columns.TimeToKill; i <= Columns.Extremeties; i++) {
                let label1 = document.createElement("span");
                label1.innerText = weapon.GetTimeToKillFromEnum(i, updaterange).toString();
                this.Grid.children[i].lastChild.appendChild(label1);
            }
            let overallaccuracy = this.Grid.children[Columns.OverallAccuracy];
            let accuracyslider = this.CreateAccuracySlider(weapon.OverallAccuracy, overallaccuracy.lastChild);
            accuracyslider.addEventListener("change", () => this.OnAccuracyChanged(accuracyslider, weapon));
            let headshotpercentage = this.Grid.children[Columns.HeadshotPercentage];
            let headshotslider = this.CreateAccuracySlider(weapon.HeadshotPercentage, headshotpercentage.lastChild);
            headshotslider.addEventListener("change", () => this.OnHSPercentageChanged(headshotslider, weapon));
            let chestratio = this.Grid.children[Columns.ChestToStomachRatio];
            let chestslider = this.CreateAccuracySlider(weapon.ChestToBodyRatio, chestratio.lastChild);
            chestslider.addEventListener("change", () => this.OnChestRatioChanged(chestslider, weapon));
        }
    }
    CreateAccuracySlider(accuracy, parentNode) {
        let div = document.createElement("div");
        let span = document.createElement("span");
        span.textContent = parseInt(Math.round(100 * accuracy)).toString();
        div.appendChild(span);
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = "0.01";
        slider.max = "1.0";
        slider.step = "0.01";
        slider.value = accuracy.toString();
        div.appendChild(slider);
        parentNode.appendChild(div);
        return slider;
    }
    OnHSPercentageChanged(headshotslider, weapon) {
        weapon.HeadshotPercentage = parseFloat(headshotslider.value);
        this.CreateTable(true);
    }
    OnAccuracyChanged(overallslider, weapon) {
        weapon.OverallAccuracy = parseFloat(overallslider.value);
        this.CreateTable(true);
    }
    OnChestRatioChanged(slider, weapon) {
        weapon.ChestToBodyRatio = parseFloat(slider.value);
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
        let header = document.createElement("label");
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
                this.Weapons.sort((left, right) => this.ColumnDirection[id] * left.WeaponName.localeCompare(right.WeaponName));
                break;
            case Columns.Head:
            case Columns.Chest:
            case Columns.Stomach:
            case Columns.Extremeties:
            case Columns.TimeToKill:
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