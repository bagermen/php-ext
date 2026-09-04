export type ImageContext = {
	dockerFile: string,
	phpTag: string,
	phpExtTag: string,
	phpExtMinorTag: string,
	phpExtMajorTag: string,
	extList: string,
	moveMinor: boolean,
	moveMajor: boolean,
	latest: boolean
}

export type RetagContext = {
	phpExtTag: string,
	phpExtMinorTag: string,
	phpExtMajorTag: string,
	retagMinor: boolean,
	retagMajor: boolean,
}
