import { FireOnDomReady } from './Helpers.js';
import { IWeapon, Weapon, WeaponTypes, Games } from './WarzoneWeapons.js';
// import { BodyPoints, Convert, DamageProfile, IWeapon, Type, Weapon, WeaponTypes } from './WarzoneWeapons.js';



export var Columns =
{
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


export var SortDirection =
{
	Descending: -1,
	None: 0,
	Ascending: 1
};


export class App
{
	ColumnDirection: {};
	Weapons: Weapon[];
	ScriptImportPromise: Promise<Response>;
	Grid: HTMLDivElement;
	WeaponFilters: {};
	GameFilters: {};

	private static _Range: number = 40;
	CurrentSortID: number;
	public static get Range(): number
	{
		return App._Range;
	}
	public static set Range(value: number)
	{
		App._Range = value;
		if (app.Grid)
		{
			app.SortTableByID(app.CurrentSortID);
			app.CreateTable(true);
		}
	}

	constructor()
	{
		this.ColumnDirection = {};
		this.WeaponFilters = {};
		this.GameFilters = {};
		for(let type of WeaponTypes)
		{
			this.WeaponFilters[type] = true;
		}
		for(let game in Games)
		{
			this.GameFilters[game] = true;
		}
		for (let i = 0; i < Columns.Size; i++)
		{
			this.ColumnDirection[i] = SortDirection.Ascending;
		}
		this.ScriptImportPromise = fetch("data/Weapons.min.json").then(this.ScriptImported.bind(this));
	}

	async ScriptImported(response: Response)
	{
		let script = await response.json() as IWeapon[];
		
		// @ts-ignore 
		this.Weapons = script;

		// initialize the weapons as class objects rather than generic js objects
		for (let j = 0; j < script.length; j++)
		{
			let weapon = script[j];
			this.Weapons[j] = Object.assign(new Weapon(), weapon);
		}
	}

	async Ready()
	{
		this.Grid = document.getElementById("WeaponsTable") as HTMLDivElement;
		let range = document.getElementById("RangeInput") as HTMLInputElement;
		let settings = document.getElementById("SettingsRow") as HTMLDivElement;
		
		range.addEventListener("change", (ev) => 
		{
			App.Range = parseFloat(range.value);
		});

		document.getElementById("AccuracyMinus").addEventListener("click", () => this.ChangeAllAccuracies(-0.01));
		document.getElementById("AccuracyPlus").addEventListener("click", () => this.ChangeAllAccuracies(0.01));
		
		for(let type of WeaponTypes)
		{
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

		for(let game in Games)
		{
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
	
	ChangeAllAccuracies(modifier: number): any
	{
		for(let weapon of this.Weapons)
		{
			weapon.OverallAccuracy += modifier;
			weapon.OverallAccuracy = Math.min(1, weapon.OverallAccuracy);
			weapon.OverallAccuracy = Math.max(0.01, weapon.OverallAccuracy);
		}

		this.CreateTable();
	}

	OnWeaponTypeFiltered(checkbox: HTMLInputElement, type: string): any
	{
		checkbox.checked = !checkbox.checked;
		this.WeaponFilters[type] = checkbox.checked;
		this.CreateTable();
	}

	OnGameTypeFiltered(checkbox: HTMLInputElement, game: string): any
	{
		checkbox.checked = !checkbox.checked;
		this.GameFilters[game] = checkbox.checked;
		this.CreateTable();
	}

	private CreateTable(updaterange:boolean = false)
	{
		// 1.72 ms - replaceChildren
		// 1.77 ms - innerhtml

		this.ClearTable();

		for (let weapon of this.Weapons)
		{
			if(!this.WeaponFilters[weapon.Category] || !this.GameFilters[weapon.Stats.Game])
			{
				continue;
			}
			let weaponname = this.Grid.children[Columns.WeaponName];
			// @ts-ignore lastChild is a div element
			let span = document.createElement("span");
			span.innerText =  weapon.WeaponName;
			weaponname.lastChild.appendChild(span);

			for (let i = Columns.TimeToKill; i <= Columns.Extremeties; i++)
			{
				let label1 = document.createElement("span");
				label1.innerText = weapon.GetTimeToKillFromEnum(i, updaterange).toString();
				this.Grid.children[i].lastChild.appendChild(label1);
			}


			let overallaccuracy =  this.Grid.children[Columns.OverallAccuracy];
			let accuracyslider = this.CreateAccuracySlider(weapon.OverallAccuracy, overallaccuracy.lastChild);
			accuracyslider.addEventListener("change", () => this.OnAccuracyChanged(accuracyslider, weapon));
			


			let headshotpercentage =  this.Grid.children[Columns.HeadshotPercentage];
			let headshotslider = this.CreateAccuracySlider(weapon.HeadshotPercentage, headshotpercentage.lastChild);
			headshotslider.addEventListener("change", () => this.OnHSPercentageChanged(headshotslider, weapon));

			let chestratio =  this.Grid.children[Columns.ChestToStomachRatio];
			let chestslider = this.CreateAccuracySlider(weapon.ChestToBodyRatio, chestratio.lastChild);
			chestslider.addEventListener("change", () => this.OnChestRatioChanged(chestslider, weapon));


		}
	}

	private CreateAccuracySlider(accuracy:number, parentNode: Node): HTMLInputElement
	{
		/* 	<div>
				<span>0.6</span>
				<slider />
			</div> */
		let div = document.createElement("div");
		let span = document.createElement("span");
		// @ts-ignore parseInt can take a number as well as a string
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

	OnHSPercentageChanged(headshotslider: HTMLInputElement, weapon: Weapon): any
	{
		weapon.HeadshotPercentage = parseFloat(headshotslider.value);
		this.CreateTable(true);
	}
	OnAccuracyChanged(overallslider: HTMLInputElement, weapon: Weapon): any
	{
		weapon.OverallAccuracy = parseFloat(overallslider.value);
		this.CreateTable(true);
	}
	OnChestRatioChanged(slider: HTMLInputElement, weapon: Weapon): any
	{
		weapon.ChestToBodyRatio = parseFloat(slider.value);
		this.CreateTable(true);
	}

	private ClearTable()
	{
		// 0.92 - 1.27
		if (this.Grid.children.length > 0)
		{
			for (let i = 0; i < Columns.Size; i++)
			{
				// @ts-ignore intellisense shows this is fine but not the compiler. replaceChildren does exist on a div
				this.Grid.children[i].lastChild.innerHTML = "";
			}
		}

		else
		{
			for (let i = 0; i < Columns.Size; i++)
			{
				let child = this.CreateColumn(Columns[i], i);
				this.Grid.appendChild(child);
			}
		}
	}

	CreateColumn(title: string, id: number)
	{
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
	OnHeaderClicked(id: number): void
	{

		this.ColumnDirection[id] = -this.ColumnDirection[id];
		this.SortTableByID(id);
		this.CreateTable();
		this.CurrentSortID = id;
	}

	SortTableByID(id: number)
	{
		switch (id)
		{
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

	PopulateTable()
	{
		for (let child of this.Grid.children)
		{
			child.innerHTML = "";

		}
	}


}

let app = new App();
window.onload = app.Ready.bind(app);

globalThis.Application = app;