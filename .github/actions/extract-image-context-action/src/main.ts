import * as core from "@actions/core"
import type {DockerHubTags} from "docker-hub-tags";
import {
	findDockerFileNames,
	getOsNameFromDockerFile,
	getPHPTag,
	getPHPExtTag,
	isError,
	getPHPTags,
	getPHPExtTags
} from "./tools"
import {ImageContext} from "./types";

export async function run() {
	try {
		const phpVersion = core.getInput("php_version", {required: true});
		const phpExtNamespace = core.getInput("php_ext_namespace", {required: false});
		const phpType = core.getInput("php_type", {required: false});
		const suffix = core.getInput("php_ext_suffix", {required: false});
		const checkPhpextTag = !!phpExtNamespace;

		let contextes = initContextes(await findDockerFileNames(), phpVersion, suffix, phpType);

		const [dhtPHPTags, dhtPHPExtTags] = await Promise.all([
			getPHPTags(),
			checkPhpextTag ? getPHPExtTags(phpExtNamespace) : undefined,
		].filter((v): v is Promise<DockerHubTags> => typeof v !== "undefined"));

		contextes = filterContextes(contextes, dhtPHPTags, dhtPHPExtTags);

		const possibleLatestContext = contextes.filter(context => context.dockerFile.endsWith("alpine")).at(0);
		if (typeof possibleLatestContext !== "undefined") {
			markLatestIfRequired(possibleLatestContext, dhtPHPExtTags);
		}

		if (checkPhpextTag && typeof possibleLatestContext?.phpExtTag !== "undefined"
			&& typeof dhtPHPExtTags.getRecent(possibleLatestContext.phpExtTag) === "undefined") {
				possibleLatestContext.latest = true;
		}

		core.debug(`Contextes: ${JSON.stringify(contextes)}`);
		core.setOutput("context", JSON.stringify(contextes));
	} catch (error: unknown) {
		if (isError(error)) {
			core.setFailed(error.message);
		}
	}
}

function initContextes(fileNames: string[], phpVersion: string, suffix: string, phpType: string): ImageContext[] {
	return fileNames.map(fileName => ({
		dockerFile: fileName,
		phpTag: getPHPTag(phpVersion, getOsNameFromDockerFile(fileName), phpType),
		phpExtTag: getPHPExtTag(phpVersion, getOsNameFromDockerFile(fileName), suffix, phpType),
		latest: false
	}))
}

function filterContextes(contextes: ImageContext[], dhtPHPTags: DockerHubTags, dhtPHPExtTags?: DockerHubTags) {
	const checkPhpextTag = typeof dhtPHPExtTags !== "undefined";

	let phpTags = contextes.map(c => c.phpTag);
	let phpExtTags = checkPhpextTag ? contextes.map(c=> c.phpExtTag) : [];

	phpTags = dhtPHPTags.getAllTags().filter(tag => phpTags.includes(tag.name)).map(tag => tag.name);
	if (checkPhpextTag) {
		phpExtTags = dhtPHPExtTags.getAllTags().filter(tag => phpExtTags.includes(tag.name)).map(tag => tag.name);
	}

	return contextes.filter(({phpTag, phpExtTag}) => {
		return phpTags.includes(phpTag) && (checkPhpextTag ? !phpExtTags.includes(phpExtTag) : true)
	});
}

function markLatestIfRequired(context:ImageContext, dhtPHPExtTags?:DockerHubTags) {
	if (typeof dhtPHPExtTags === "undefined") {
		return;
	}
	if (typeof dhtPHPExtTags.getRecent(context.phpExtTag) === "undefined") {
		context.latest = true;
	}
}
