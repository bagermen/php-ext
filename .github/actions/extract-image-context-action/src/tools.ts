import {basename} from "path"
import * as glob from "@actions/glob"

import {
	DockerHubTags,
	OFFICIALIMAGES_NAMESPACE
} from "docker-hub-tags";

export function getPHPTags() {
	return DockerHubTags.init(OFFICIALIMAGES_NAMESPACE, "php");
}

export function getPHPExtTags(phpExtNamespace: string) {
	return DockerHubTags.init(phpExtNamespace, "php");
}

export async function findDockerFileNames() {
	const dockerFiles = "Dockerfile.*";
		const globber = await glob.create(dockerFiles, {followSymbolicLinks: false});
		const files = await globber.glob();

	return files.map<string>(file => basename(file));
}

export function getOsNameFromDockerFile(file: string) {
	return file.replace(/.*Dockerfile\./, "");
}

export function getPHPTag(phpVersion:string, osName:string, phpType?:string) {
	return `${phpVersion}${phpType ? `-${phpType}-` : ''}${osName}`;
}

export function getPHPExtTag(phpVersion:string, osName:string, extSuffix: string, phpType?:string) {
	const officialTag = getPHPTag(phpVersion, osName, phpType);
	return `${officialTag}-${extSuffix}`;
}

/** Split semver-ish PHP version into major / major.minor aliases (e.g. 8.2.33 → { major: "8", minor: "8.2" }). */
export function getVersionAliases(phpVersion: string): {major: string; minor: string} {
	const parts = phpVersion.split(".");
	const major = parts[0] ?? phpVersion;
	const minor = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : major;
	return {major, minor};
}

export function getPHPExtMinorTag(phpVersion: string, osName: string, extSuffix: string, phpType?: string) {
	const {minor} = getVersionAliases(phpVersion);
	return getPHPExtTag(minor, osName, extSuffix, phpType);
}

export function getPHPExtMajorTag(phpVersion: string, osName: string, extSuffix: string, phpType?: string) {
	const {major} = getVersionAliases(phpVersion);
	return getPHPExtTag(major, osName, extSuffix, phpType);
}

export function isError(error: unknown): error is Error {
	if (error && typeof error === "object" && "message" in error) {
		return true;
	}

	return false;
}
