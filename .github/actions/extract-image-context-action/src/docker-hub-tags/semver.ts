import type { ParsedVersion, ParsedVersionLevel, SemverLevel } from "./types";

const RegEx = /^([!^~]?)v?(\d+)(\.(\d+))?(\.(\d+))?([\d.a-z-]+)*$/i;

const convertSemverLevel = (indicator: string): SemverLevel => {
	switch (indicator) {
		case "^":
			return "minor";
		case "~":
			return "patch";
		case "!":
			return "evenMajor";
		default:
			return "major";
	}
};

export const parseVersion = (version: string): ParsedVersion | undefined => {
	const match = version.match(RegEx);
	if (!match) {
		return;
	}
	return {
		major: Number(match[2]),
		minor: Number(match[4] || "0"),
		patch: Number(match[6] || "0"),
		postfix: match[7] ?? "",
	};
};

export const parseVersionWithLevel = (version: string): ParsedVersionLevel | undefined => {
	const versionInfo = parseVersion(version);
	if (!versionInfo) {
		return;
	}
	const match = version.match(RegEx);
	if (!match) {
		return;
	}
	return {
		...versionInfo,
		semverLevel: convertSemverLevel(match[1] ?? ""),
	};
};

export const isHigherVersion = (from: ParsedVersion | ParsedVersionLevel, to: ParsedVersion): boolean => {
	if ((from.postfix || "").toLowerCase() !== (to.postfix || "").toLowerCase()) {
		return false;
	}
	if ("semverLevel" in from) {
		switch (from.semverLevel) {
			case "patch":
				return from.major === to.major && from.minor === to.minor && from.patch < to.patch;
			case "minor":
				return (
					from.major === to.major &&
					(from.minor < to.minor || (from.minor === to.minor && from.patch < to.patch))
				);
			case "major":
			case "evenMajor":
				return (
					(from.major < to.major ||
						(from.major === to.major &&
							(from.minor < to.minor || (from.minor === to.minor && from.patch < to.patch)))) &&
					(from.semverLevel === "major" || from.major % 2 === to.major % 2)
				);
		}
	}
	return (
		from.major < to.major ||
		(from.major === to.major &&
			(from.minor < to.minor || (from.minor === to.minor && from.patch < to.patch)))
	);
};
