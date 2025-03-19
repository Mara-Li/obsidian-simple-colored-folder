export function minifyCss(css: string): string {
	const styleSheet = new CSSStyleSheet();
	styleSheet.replaceSync(css);
	return [...styleSheet.cssRules].map((rule) => rule.cssText).join("");
}
export function standardize(str: string) {
	return str
		.standardize()
		.replace(/\s/g, "")
		.replaceAll(/[\.!_]+/g, "");
}

export function removeExtraNewLine(str: string) {
	return str.replaceAll(/\s{4}\n/g, "\n").replaceAll(/\n{2,}/g, "\n");
}
