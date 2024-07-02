export function getOsNameFromDockerFile(file: string) {
	return file.replace(/.*Dockerfile\./, "");
}

export function getOfficialPHPTag(phpVersion:string, osName:string, phpType?:string) {
	return `${phpVersion}${phpType ? `-${phpType}-` : ''}${osName}`;
}

export function getPHPTag(phpVersion:string, osName:string, phpType?:string) {
	const officialTag = getOfficialPHPTag(phpVersion, osName, phpType);
	return `${officialTag}-ext`;
}

export function isError(error: unknown): error is Error {
	if (error && typeof error === "object" && "message" in error) {
		return true;
	}

	return false;
}
