export type DockerHubTagsFilter = {
	os?: string;
	architecture?: string;
	variant?: string;
};

export const defaultDockerHubTagsFilter: DockerHubTagsFilter = {};

export type DockerHubTagsOptions = {
	limit: number;
	retry: number;
};

export const defaultDockerHubTagsOptions: DockerHubTagsOptions = {
	limit: 1000,
	retry: 10,
};

export class DockerHubTagsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "DockerHubTagsError";
	}
}

export type SemverLevel = "patch" | "minor" | "major" | "evenMajor";

export type ParsedVersion = {
	major: number;
	minor: number;
	patch: number;
	postfix: string;
};

export type ParsedVersionLevel = ParsedVersion & {
	semverLevel: SemverLevel;
};

export type HubImage = {
	os: string;
	architecture: string;
	variant: string | null;
	size: number;
	status: string;
	digest: string;
};

export type HubResult = {
	name: string;
	tag_status: string;
	content_type: string;
	full_size: number;
	last_updated: Date | string;
	digest: string;
	images: HubImage[];
};

export type Tag = HubResult;

export type TagDetailed = HubResult & {
	sameTags: string[];
};

export type HubPage = {
	count?: number;
	next: string | null;
	results: unknown[];
};
