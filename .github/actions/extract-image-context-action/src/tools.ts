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

export function isError(error: unknown): error is Error {
	if (error && typeof error === "object" && "message" in error) {
		return true;
	}

	return false;
}
