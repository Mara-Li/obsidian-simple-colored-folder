import { describe, test, expect } from "bun:test";
import {
	convertStyleSettings,
	convertToCSS,
	generateName,
	themes,
} from "../src/template";
import { DEFAULT_COLOR, type Prefix } from "../src/interfaces";

describe("generateName", () => {
	test("should generate standardized CSS variable names", () => {
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const folderName = "Test Folder";

		const result = generateName(prefix, folderName);

		expect(result.bg).toBe("scf-bg-testfolder");
		expect(result.color).toBe("scf-color-testfolder");
	});

	test("should include CSS var prefix when provided", () => {
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const folderName = "Test Folder";

		const result = generateName(prefix, folderName, "--");

		expect(result.bg).toBe("--scf-bg-testfolder");
		expect(result.color).toBe("--scf-color-testfolder");
	});

	test("should handle special characters and dots", () => {
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const folderName = "Test.Folder.With-Special_Chars!";

		const result = generateName(prefix, folderName);

		expect(result.bg).toBe("scf-bg-testfolderwith-specialchars");
		expect(result.color).toBe("scf-color-testfolderwith-specialchars");
	});
});
describe("convertToCSS", () => {
	test("should generate folder CSS with correct selectors", () => {
		const folderName = "Projects";
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const template = "";

		const result = convertToCSS(folderName, prefix, template);

		expect(result).toContain(`/* ---- Projects ---- */`);
		expect(result).toContain(`[data-path="${folderName}"]`);
		expect(result).toContain(`var(--scf-bg-projects)`);
		expect(result).toContain(`var(--scf-color-projects)`);
	});

	test("should incorporate custom template with variables", () => {
		const folderName = "Notes";
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const template = "/* Custom styles for ${folderName} using ${bg} and ${color} */";

		const result = convertToCSS(folderName, prefix, template);

		expect(result).toContain(
			"/* Custom styles for Notes using --scf-bg-notes and --scf-color-notes */"
		);
	});
});

describe("convertStyleSettings", () => {
	test("should generate style settings for folder", () => {
		const folderName = "Media";
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const template = "";

		const result = convertStyleSettings(folderName, prefix, template);

		expect(result).toContain(`title: Media`);
		expect(result).toContain(`id: scf-bg-media`); // lowercase 'media'
		expect(result).toContain(`id: scf-color-media`); // lowercase 'media'
		expect(result).toContain(`default-light: "${DEFAULT_COLOR}"`);
		expect(result).toContain(`default-dark: "${DEFAULT_COLOR}"`);
	});

	test("should include custom template content when provided", () => {
		const folderName = "Notes";
		const prefix: Prefix = { bg: "scf-bg", color: "scf-color" };
		const template = "custom-id: ${folderName}-custom\ntitle: Custom ${folderName}";

		const result = convertStyleSettings(folderName, prefix, template);

		expect(result).toContain("custom-id: Notes-custom");
		expect(result).toContain("title: Custom Notes");
	});
});

describe("themes", () => {
	test("should generate theme variables", () => {
		const vn: Prefix = { bg: "scf-bg-Assets", color: "scf-color-Assets" };

		const result = themes(vn);

		expect(result).toContain(`${vn.bg}: "${DEFAULT_COLOR}"`);
		expect(result).toContain(`${vn.color}: var(--nav-item-color)`);
	});
});
