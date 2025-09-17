export function formatCss(css: string, minify?: boolean): string {
	const styleSheet = new CSSStyleSheet();
	styleSheet.replaceSync(css);
	return [...styleSheet.cssRules]
		.map((rule) => {
			if (!minify) {
				return rule.cssText
					.replaceAll("{", "{\n   ")
					.replaceAll(";", ";\n   ")
					.replace(/\n\s*}/g, "\n}")
					.replace(/\s*,/g, ",\n")
					.replace(/ \./g, ".");
			}
			return rule.cssText;
		})
		.join(minify ? "" : "\n");
}

export function standardize(str: string) {
	return str
		.standardize()
		.unidecode()
		.replace(/\s/g, "")
		.replaceAll(/[\.!_]+/g, "");
}

export function removeExtraNewLine(str: string) {
	return str.replaceAll(/\s{4}\n/g, "\n").replaceAll(/\n{2,}/g, "\n");
}
