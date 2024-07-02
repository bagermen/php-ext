import {basename} from "path"
import * as core from "@actions/core"
import * as glob from "@actions/glob"
import {
	DockerHubTags,
	OFFICIALIMAGES_NAMESPACE
} from "docker-hub-tags";
import {
	getOfficialPHPTag,
	getPHPTag,
	isError
} from "./utils"
import {ImageContext} from "./types";

export async function run() {
	try {
		const phpVersion = core.getInput("php_version", {required: true});
		const phpType = core.getInput("php_type", {required: false});
		const checkPhpextTag = core.getBooleanInput("check_phpext_tag_existence", {required: false});

		const fileNames = await findDockerFileNames();
		const context: ImageContext[] = fileNames.map(fileName => ({
			dockerFile: fileName,
			phpTag: getOfficialPHPTag(phpVersion, fileName, phpType),
			phpExtTag: getPHPTag(phpVersion, fileName, phpType)
		}));

		core.setOutput("context", JSON.stringify(await filterContext(context, checkPhpextTag)));
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

export async function filterContext(contextes:ImageContext[], checkPhpextTag?: boolean) {
	let phpTags = contextes.map(c => c.phpTag);
	let phpExtTag = contextes.map(c=> c.phpExtTag);
	const phpExtNamespace = "besogon1";
	const tagsList = [
		DockerHubTags.init(OFFICIALIMAGES_NAMESPACE, "php"),
		checkPhpextTag ? DockerHubTags.init(phpExtNamespace, "php") : undefined,
	].filter((v): v is Promise<DockerHubTags> => typeof v !== "undefined");

	for (const result of await Promise.allSettled(tagsList)) {
		if (result.status !== "fulfilled") {
			continue;
		}
		phpTags = result.value.getAllTags().filter(tag => phpTags.includes(tag.name)).map(tag => tag.name);

		if (checkPhpextTag) {
			phpExtTag = result.value.getAllTags().filter(tag => phpExtTag.includes(tag.name)).map(tag => tag.name);
		}
	}

	return contextes.filter(({phpTag, phpExtTag}) => {
		return phpTags.includes(phpTag) && (checkPhpextTag ? phpExtTag.includes(phpExtTag) : true)
	});
}
