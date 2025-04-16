import Pickr from "@simonwep/pickr";
import { debounce, Setting } from "obsidian";
import { DEFAULT_COLOR } from "./interfaces";
import type { ThemedColors } from "./interfaces";

export class PickerSettingsComponent extends Setting {
	private pickrLight: Pickr;
	private pickrDark: Pickr;
	constructor(
		containerEl: HTMLElement,
		label: string,
		color: { themeDark: string; themeLight: string },
		onChange: (values: { themeDark: string; themeLight: string }) => void
	) {
		super(containerEl);
		this.setName(label).setClass("no-border").setClass("picker-settings-component");

		const control = this.controlEl.createDiv({ cls: "dual-alpha-picker-controls" });
		const lightWrapper = control.createDiv({ cls: "alpha-picker-wrapper light" });
		const darkWrapper = control.createDiv({ cls: "alpha-picker-wrapper dark" });

		const lightEl = lightWrapper.createDiv({ cls: "alpha-picker light" });
		const darkEl = darkWrapper.createDiv({ cls: "alpha-picker dark" });
		const createPickr = (el: HTMLElement, defaultColor: string): Pickr => {
			const pickr = Pickr.create({
				el,
				theme: "nano",
				default: defaultColor,
				components: {
					preview: true,
					opacity: true,
					hue: true,
					interaction: {
						input: true,
						rgba: true,
						hex: true,
						save: true,
					},
				},
			});
			pickr.on("save", () => {
				pickr.hide();
			});
			return pickr;
		};
		this.pickrLight = createPickr(lightEl, color.themeLight);
		this.pickrDark = createPickr(darkEl, color.themeDark);
		lightWrapper
			.createEl("button", {
				cls: "clickable-icon",
				attr: { "aria-label": "Reset light color" },
				text: "↺",
			})
			.addEventListener("click", () => {
				this.pickrLight.setColor(DEFAULT_COLOR);
				onChange(this.getColors());
			});
		const q = lightWrapper.querySelector(".pcr-button");
		if (q) q.ariaLabel = "Theme light";
		darkWrapper
			.createEl("button", {
				cls: "clickable-icon",
				attr: { "aria-label": "Reset dark color" },
				text: "↺",
			})
			.addEventListener("click", () => {
				this.pickrDark.setColor(DEFAULT_COLOR);
				onChange(this.getColors());
			});
		const q2 = darkWrapper.querySelector(".pcr-button");
		if (q2) q2.ariaLabel = "Theme dark";
		const update = debounce(
			() => {
				onChange({
					themeLight: this.pickrLight.getColor().toHEXA().toString(),
					themeDark: this.pickrDark.getColor().toHEXA().toString(),
				});
			},
			200,
			true
		);
		this.pickrLight.on("change", update);
		this.pickrDark.on("change", update);
	}
	public setColors({ themeDark, themeLight }: ThemedColors): void {
		this.pickrLight.setColor(themeDark);
		this.pickrDark.setColor(themeLight);
	}
	public getColors(): ThemedColors {
		return {
			themeLight: this.pickrLight.getColor().toHEXA().toString(),
			themeDark: this.pickrDark.getColor().toHEXA().toString(),
		};
	}
}
