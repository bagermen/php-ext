import { describe, test, expect } from "@jest/globals";
import { parsePhpExtensionsIni, resolveExtList } from "../src/php-extensions";

const sampleIni = `
; comment
[default]
extensions = gd intl zip xdebug

[8]
extensions = gd intl redis

[8.3]
extensions = gd intl zip soap
`;

describe("parsePhpExtensionsIni", () => {
	test("parses sections and extensions", () => {
		const sections = parsePhpExtensionsIni(sampleIni);

		expect(sections.get("default")).toEqual(["gd", "intl", "zip", "xdebug"]);
		expect(sections.get("8")).toEqual(["gd", "intl", "redis"]);
		expect(sections.get("8.3")).toEqual(["gd", "intl", "zip", "soap"]);
	});

	test("ignores empty lines and inline comments", () => {
		const sections = parsePhpExtensionsIni(`
[default]
extensions = gd intl ; trailing comment
# another comment
`);

		expect(sections.get("default")).toEqual(["gd", "intl"]);
	});

	test("section names are case-insensitive", () => {
		const sections = parsePhpExtensionsIni(`
[Default]
extensions = gd intl
`);

		expect(sections.get("default")).toEqual(["gd", "intl"]);
	});
});

describe("resolveExtList", () => {
	const sections = parsePhpExtensionsIni(sampleIni);

	test("uses major.minor section first", () => {
		expect(resolveExtList("8.3.8", sections)).toBe("gd intl zip soap");
	});

	test("falls back to major section", () => {
		expect(resolveExtList("8.4.1", sections)).toBe("gd intl redis");
	});

	test("falls back to default section", () => {
		expect(resolveExtList("7.4.33", sections)).toBe("gd intl zip xdebug");
	});

	test("throws when no matching section has extensions", () => {
		const emptySections = parsePhpExtensionsIni(`
[8.3]
extensions =
`);

		expect(() => resolveExtList("8.3.8", emptySections)).toThrow(
			"No extensions found for PHP 8.3.8",
		);
	});

	test("throws when no sections match", () => {
		expect(() => resolveExtList("8.3.8", new Map())).toThrow(
			"No extensions found for PHP 8.3.8",
		);
	});
});
