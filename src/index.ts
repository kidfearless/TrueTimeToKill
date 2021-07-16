import { FireOnDomReady } from './Helpers.js';
import { BodyPoints, Convert, DamageProfile, IWeapon, Type, Weapon, WeaponTypes } from './WarzoneWeapons.js';



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
	Filters: {};

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
		this.Filters = {};
		for(let type in WeaponTypes)
		{
			this.Filters[type] = true;
		}
		for (let i = 0; i < Columns.Size; i++)
		{
			this.ColumnDirection[i] = SortDirection.Ascending;
		}
		this.ScriptImportPromise = fetch("https://fx9.github.io/ttk/scripts/guns/all_guns.js").then(this.ScriptImported.bind(this));
	}

	async ScriptImported(response: Response)
	{
		Columns['test fun'];
		let script = await response.text();
		script = script.split(';')[1];
		script = script.substring("\nDEFAULT_GUNS = ".length);
		let weapons = Convert.ToWeapons(script);
		this.Weapons = new Array(weapons.length);

		// initialize the weapons as class objects rather than generic js objects
		for (let j = 0; j < weapons.length; j++)
		{
			let weapon = weapons[j];

			let raw = weapon.DamageProfiles as any[][];
			weapon.DamageProfiles = [];
			for (let i = 0; i < raw.length; i++)
			{
				let range = new DamageProfile();
				range.Range = raw[i][0];
				range.Damage = new BodyPoints(raw[i][1]);
				weapon.DamageProfiles[i] = range;
			}
			this.Weapons[j] = Object.assign(new Weapon(), weapon);
		}
	}

	async Ready()
	{
		this.Grid = document.getElementById("WeaponsTable") as HTMLDivElement;
		let range = document.getElementById("RangeInput") as HTMLInputElement;
		
		range.addEventListener("change", (ev) => 
		{
			App.Range = parseFloat(range.value);
		});

		let settings = document.getElementById("SettingsRow") as HTMLDivElement;
		for(let type in WeaponTypes)
		{
			let span = document.createElement("span");
			span.style.marginRight = "8px";
			let checkbox = document.createElement("input");
			checkbox.name = type + "_filterbox";
			checkbox.type = "checkbox";
			checkbox.checked = true;


			let label = document.createElement("label");
			label.htmlFor = type + "_filterbox";
			label.textContent = WeaponTypes[type];

			span.appendChild(checkbox);
			span.appendChild(label);
			span.addEventListener("click", () => this.OnWeaponTypeFiltered(checkbox, type));
			settings.appendChild(span);
		}
		await this.ScriptImportPromise;

		this.CreateTable();
	}
	OnWeaponTypeFiltered(checkbox: HTMLInputElement, type: string): any
	{
		checkbox.checked = !checkbox.checked;
		this.Filters[type] = checkbox.checked;
		this.CreateTable();
	}
	private CreateTable(updaterange:boolean = false)
	{
		// 1.72 ms - replaceChildren
		// 1.77 ms - innerhtml

		this.ClearTable();

		for (let weapon of this.Weapons)
		{
			if(!this.Filters[weapon.Type])
			{
				continue;
			}
			let weaponname = this.Grid.children[Columns.WeaponName];
			// @ts-ignore lastChild is a div element
			let span = document.createElement("span");
			span.innerText =  weapon.DisplayName;
			weaponname.lastChild.appendChild(span);

			let timetokill =  this.Grid.children[Columns.TimeToKill];

			for (let i = Columns.Head; i <= Columns.Extremeties; i++)
			{
				span = document.createElement("span");
				span.innerText = weapon.GetTimeToKillFromEnum(i, updaterange).toString();
				this.Grid.children[i].lastChild.appendChild(span);
			}


			let overallaccuracy =  this.Grid.children[Columns.OverallAccuracy];
			let slider = this.CreateAccuracySlider(weapon.OverallAccuracy, overallaccuracy.lastChild);
			slider.addEventListener("mouseup", () => this.OnAccuracyChanged(slider, weapon));
			


			let headshotpercentage =  this.Grid.children[Columns.HeadshotPercentage];
			let slider2 = this.CreateAccuracySlider(weapon.HeadShotPercentage, headshotpercentage.lastChild);
			slider2.addEventListener("mouseup", () => this.OnHSPercentageChanged(slider2, weapon));


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
		weapon.HeadShotPercentage = parseFloat(headshotslider.value);
		this.CreateTable(true);
	}
	OnAccuracyChanged(overallslider: HTMLInputElement, weapon: Weapon): any
	{
		weapon.OverallAccuracy = parseFloat(overallslider.value);
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