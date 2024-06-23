import {basename} from "path"
import * as core from "@actions/core"
import * as glob from "@actions/glob"


async function Run() {
	try {
		const phpVersion = core.getInput("php_version", {required: true});
		const phpType = core.getInput("php_type", {required: false});

		const dockerFiles = "Dockerfile.*";
		const globber = await glob.create(dockerFiles, {followSymbolicLinks: false});
		const files = await globber.glob();

		core.setOutput("context", JSON.stringify(createOutput(phpVersion, files, phpType)));
	} catch (error: unknown) {
		if (isError(error)) {
			core.setFailed(error.message);
		}
	}
}

Run();

function getImageName(phpVersion:string, osName:string, phpType:string) {
	return `${phpVersion}${phpType ? `-${phpType}-` : ''}${osName}`;
}

function createOutput(phpVersion:string, files:string[], phpType:string) {
	const osList = files.map(file => file.replace(/.*Dockerfile\./, ""));

	return osList.map((osName, idx) => ({
		image: getImageName(phpVersion, osName, phpType),
		file: basename(files[idx])
	}));
}

function isError(error: unknown): error is Error {
	if (error && typeof error === "object" && "message" in error) {
		return true;
	}

	return false;
}
