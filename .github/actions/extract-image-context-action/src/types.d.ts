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
