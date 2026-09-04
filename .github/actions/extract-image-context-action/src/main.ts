import * as core from "@actions/core"
import type {DockerHubTags} from "docker-hub-tags";
import {
	findDockerFileNames,
	getOsNameFromDockerFile,
	getPHPTag,
	getPHPExtTag,
	getPHPExtMinorTag,
	getPHPExtMajorTag,
	isError,
	getPHPTags,
	getPHPExtTags
} from "./tools"
import {loadExtList} from "./php-extensions";
import {ImageContext, RetagContext} from "./types";

export async function run() {
	try {
		const phpVersion = core.getInput("php_version", {required: true});
		const phpExtNamespace = core.getInput("php_ext_namespace", {required: false});
		const phpType = core.getInput("php_type", {required: false});
		const suffix = core.getInput("php_ext_suffix", {required: false});
		const extensionsConfig = core.getInput("extensions_config", {required: false}) || "php-extensions.ini";
		const checkPhpextTag = !!phpExtNamespace;

		const extList = await loadExtList(phpVersion, extensionsConfig);
		let contextes = initContextes(await findDockerFileNames(), phpVersion, suffix, phpType, extList);

		const [dhtPHPTags, dhtPHPExtTags] = await Promise.all([
			getPHPTags(),
			checkPhpextTag ? getPHPExtTags(phpExtNamespace) : undefined,
		].filter((v): v is Promise<DockerHubTags> => typeof v !== "undefined"));

		contextes = filterOfficialPhpTags(contextes, dhtPHPTags);
		markFloatingTags(contextes, dhtPHPExtTags);

		const possibleLatestContext = contextes.filter(context => context.dockerFile.endsWith("alpine")).at(0);
		if (typeof possibleLatestContext !== "undefined") {
			markLatestIfRequired(possibleLatestContext, dhtPHPExtTags);
		}

		const {buildContextes, retagContextes} = splitContextes(contextes, dhtPHPExtTags);

		core.debug(`Contextes: ${JSON.stringify(buildContextes)}`);
		core.debug(`Retag contextes: ${JSON.stringify(retagContextes)}`);
		core.setOutput("context", JSON.stringify(buildContextes));
		core.setOutput("retag_context", JSON.stringify(retagContextes));
	} catch (error: unknown) {
		if (isError(error)) {
			core.setFailed(error.message);
		}
	}
}

function initContextes(fileNames: string[], phpVersion: string, suffix: string, phpType: string, extList: string): ImageContext[] {
	return fileNames.map(fileName => {
		const osName = getOsNameFromDockerFile(fileName);
		return {
			dockerFile: fileName,
			phpTag: getPHPTag(phpVersion, osName, phpType),
			phpExtTag: getPHPExtTag(phpVersion, osName, suffix, phpType),
			phpExtMinorTag: getPHPExtMinorTag(phpVersion, osName, suffix, phpType),
			phpExtMajorTag: getPHPExtMajorTag(phpVersion, osName, suffix, phpType),
			extList,
			moveMinor: false,
			moveMajor: false,
			latest: false
		};
	})
}

function filterOfficialPhpTags(contextes: ImageContext[], dhtPHPTags: DockerHubTags) {
	const phpTags = dhtPHPTags.getAllTags()
		.filter(tag => contextes.some(c => c.phpTag === tag.name))
		.map(tag => tag.name);

	return contextes.filter(({phpTag}) => phpTags.includes(phpTag));
}

function splitContextes(contextes: ImageContext[], dhtPHPExtTags?: DockerHubTags): {
	buildContextes: ImageContext[],
	retagContextes: RetagContext[],
} {
	if (typeof dhtPHPExtTags === "undefined") {
		return {buildContextes: contextes, retagContextes: []};
	}

	const existingPhpExtTags = new Set(dhtPHPExtTags.getAllTags().map(tag => tag.name));
	const buildContextes: ImageContext[] = [];
	const retagContextes: RetagContext[] = [];

	for (const context of contextes) {
		if (!existingPhpExtTags.has(context.phpExtTag)) {
			buildContextes.push(context);
			continue;
		}

		const retagMinor = context.moveMinor
			&& typeof dhtPHPExtTags.getTag(context.phpExtMinorTag) === "undefined";
		const retagMajor = context.moveMajor
			&& typeof dhtPHPExtTags.getTag(context.phpExtMajorTag) === "undefined";

		if (retagMinor || retagMajor) {
			retagContextes.push({
				phpExtTag: context.phpExtTag,
				phpExtMinorTag: context.phpExtMinorTag,
				phpExtMajorTag: context.phpExtMajorTag,
				retagMinor,
				retagMajor,
			});
		}
	}

	return {buildContextes, retagContextes};
}

function markFloatingTags(contextes: ImageContext[], dhtPHPExtTags?: DockerHubTags) {
	for (const context of contextes) {
		const canMoveMinor = context.phpExtMinorTag !== context.phpExtTag;
		const canMoveMajor = context.phpExtMajorTag !== context.phpExtTag
			&& context.phpExtMajorTag !== context.phpExtMinorTag;

		if (typeof dhtPHPExtTags === "undefined") {
			context.moveMinor = canMoveMinor;
			context.moveMajor = canMoveMajor;
			continue;
		}

		context.moveMinor = canMoveMinor
			&& typeof dhtPHPExtTags.getRecent(`~${context.phpExtTag}`) === "undefined";
		context.moveMajor = canMoveMajor
			&& typeof dhtPHPExtTags.getRecent(`^${context.phpExtTag}`) === "undefined";
	}
}

function markLatestIfRequired(context:ImageContext, dhtPHPExtTags?:DockerHubTags) {
	if (typeof dhtPHPExtTags === "undefined") {
		return;
	}
	const tag = dhtPHPExtTags.getRecent(context.phpExtTag);
	if (typeof tag === "undefined") {
		context.latest = true;
	}
}
