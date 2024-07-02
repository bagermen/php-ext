import {basename} from "path"
import * as core from "@actions/core"
import * as glob from "@actions/glob"
import {
	DockerHubTags,
	OFFICIALIMAGES_NAMESPACE
} from "docker-hub-tags";
import {
	getOsNameFromDockerFile,
	getOfficialPHPTag,
	getPHPTag,
	isError
} from "./utils"
import {ImageContext} from "./types";

export async function run() {
	try {
		const phpVersion = core.getInput("php_version", {required: true});
		const phpExtNamespace = core.getInput("php_ext_namespace", {required: false});
		const phpType = core.getInput("php_type", {required: false});

		const fileNames = await findDockerFileNames();
		const context: ImageContext[] = fileNames.map(fileName => ({
			dockerFile: fileName,
			phpTag: getOfficialPHPTag(phpVersion, getOsNameFromDockerFile(fileName), phpType),
			phpExtTag: getPHPTag(phpVersion, getOsNameFromDockerFile(fileName), phpType)
		}));

		core.setOutput("context", JSON.stringify(await filterContext(context, phpExtNamespace)));
	} catch (error: unknown) {
		if (isError(error)) {
			core.setFailed(error.message);
		}
	}
}

export async function findDockerFileNames() {
	const dockerFiles = "Dockerfile.*";
		const globber = await glob.create(dockerFiles, {followSymbolicLinks: false});
		const files = await globber.glob();

	return files.map<string>(file => basename(file));
}

export async function filterContext(contextes:ImageContext[], phpExtNamespace?: string) {
	let phpTags = contextes.map(c => c.phpTag);
	let phpExtTags = contextes.map(c=> c.phpExtTag);
	const checkPhpextTag = !!phpExtNamespace;
	const tagsList = [
		DockerHubTags.init(OFFICIALIMAGES_NAMESPACE, "php"),
		checkPhpextTag ? DockerHubTags.init(phpExtNamespace, "php") : undefined,
	].filter((v): v is Promise<DockerHubTags> => typeof v !== "undefined");

	for (const [idx, result] of (await Promise.allSettled(tagsList)).entries()) {
		if (result.status !== "fulfilled") {
			continue;
		}

		if (idx === 0) {
			phpTags = result.value.getAllTags().filter(tag => phpTags.includes(tag.name)).map(tag => tag.name);
		}

		if (checkPhpextTag && idx > 0) {
			phpExtTags = result.value.getAllTags().filter(tag => phpExtTags.includes(tag.name)).map(tag => tag.name);
		}
	}

	return contextes.filter(({phpTag, phpExtTag}) => {
		return phpTags.includes(phpTag) && (checkPhpextTag ? !phpExtTags.includes(phpExtTag) : true)
	});
}
