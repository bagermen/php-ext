import * as core from "@actions/core"
import * as glob from "@actions/glob"

try {
	const phpVersion = core.getInput("php-version", {required: true});
	const phpType = core.getInput("php-type", {required: false});

	const dockerFiles = "Dockerfile.*";
	const globber = await glob.create(dockerFiles, {followSymbolicLinks: false});
	const files = await globber.glob();

	core.setOutput("image-context", JSON.stringify(createOutput(phpVersion, files, phpType)));
} catch (error) {
	core.setFailed(error.message);
}

function getImageName(phpVersion, osName, phpType) {
	return `${phpVersion}${phpType ? `-${phpType}-` : ''}${osName}`;
}

function createOutput(phpVersion, files, phpType) {
	const osList = files.map(file => file.replace(/.*Dockerfile\./, ""));

	return osList.map((osName, idx) => ({
		image: getImageName(phpVersion, osName, phpType),
		dockerFile: files[idx]
	}));
}
