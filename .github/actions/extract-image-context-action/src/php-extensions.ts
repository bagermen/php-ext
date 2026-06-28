import {readFile} from "fs/promises";
import {resolve} from "path";

export function parsePhpExtensionsIni(content: string): Map<string, string[]> {
	const sections = new Map<string, string[]>();
	let currentSection: string | undefined;

	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.replace(/[;#].*$/, "").trim();
		if (!line) {
			continue;
		}

		const sectionMatch = line.match(/^\[([^\]]+)\]$/);
		if (sectionMatch) {
			currentSection = sectionMatch[1].trim().toLowerCase();
			if (!sections.has(currentSection)) {
				sections.set(currentSection, []);
			}
			continue;
		}

		const extensionsMatch = line.match(/^extensions\s*=\s*(.+)$/i);
		if (extensionsMatch && currentSection) {
			sections.set(
				currentSection,
				extensionsMatch[1].trim().split(/\s+/).filter(Boolean),
			);
		}
	}

	return sections;
}

export function resolveExtList(phpVersion: string, sections: Map<string, string[]>): string {
	const parts = phpVersion.split(".");
	const majorMinor = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : undefined;
	const major = parts[0];

	const candidates = [
		majorMinor,
		major,
		"default",
	].filter((key): key is string => typeof key === "string");

	for (const key of candidates) {
		const extensions = sections.get(key.toLowerCase());
		if (extensions && extensions.length > 0) {
			return extensions.join(" ");
		}
	}

	throw new Error(
		`No extensions found for PHP ${phpVersion} in php-extensions.ini (tried: ${candidates.join(", ")})`,
	);
}

export async function loadExtList(phpVersion: string, configPath: string): Promise<string> {
	const absolutePath = resolve(process.cwd(), configPath);
	const content = await readFile(absolutePath, "utf8");
	const sections = parsePhpExtensionsIni(content);

	return resolveExtList(phpVersion, sections);
}
