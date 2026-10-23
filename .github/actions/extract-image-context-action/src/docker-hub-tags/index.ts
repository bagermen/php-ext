import { fetchTags } from "./fetch";
import { isHigherVersion, parseVersion, parseVersionWithLevel } from "./semver";
import {
	defaultDockerHubTagsFilter,
	defaultDockerHubTagsOptions,
	DockerHubTagsError,
	type DockerHubTagsFilter,
	type DockerHubTagsOptions,
	type HubResult,
	type ParsedVersion,
	type ParsedVersionLevel,
	type Tag,
	type TagDetailed,
} from "./types";

export type {
	DockerHubTagsFilter,
	DockerHubTagsOptions,
	HubImage,
	HubResult,
	ParsedVersion,
	ParsedVersionLevel,
	SemverLevel,
	Tag,
	TagDetailed,
} from "./types";

export { DockerHubTagsError } from "./types";
export { parseVersion, parseVersionWithLevel, isHigherVersion } from "./semver";

export const OFFICIALIMAGES_NAMESPACE = "library";

export class DockerHubTags {
	private tags: HubResult[] = [];

	private constructor(tags: HubResult[]) {
		this.tags = tags;
	}

	static init = async (
		namespace: string,
		repository: string,
		filter: Partial<DockerHubTagsFilter> = defaultDockerHubTagsFilter,
		options: Partial<DockerHubTagsOptions> = defaultDockerHubTagsOptions
	): Promise<DockerHubTags> =>
		new DockerHubTags(
			await fetchTags(
				namespace,
				repository,
				Object.assign({}, defaultDockerHubTagsFilter, filter),
				Object.assign({}, defaultDockerHubTagsOptions, options)
			)
		);

	static createFromJson = (json: string): DockerHubTags => new DockerHubTags(JSON.parse(json) as HubResult[]);

	exportToJson = (): string => JSON.stringify(this.tags, undefined, 2);

	getAllTags = (): Tag[] => this.tags;

	getLatest = (): TagDetailed | undefined => this.getTag("latest");

	getTag = (tag: string): TagDetailed | undefined => {
		const tagFound = this.tags.find((t) => tag.localeCompare(t.name) === 0);
		if (!tagFound) {
			return;
		}
		return {
			...tagFound,
			sameTags: this.tags.filter((t) => t.digest === tagFound.digest).map((t) => t.name),
		};
	};

	getRecent = (version: string | ParsedVersionLevel): TagDetailed | undefined => {
		const currentVersion: ParsedVersionLevel | undefined =
			typeof version === "string" ? parseVersionWithLevel(version) : version;
		if (!currentVersion) {
			throw new DockerHubTagsError(`Cannot parse ${version}`);
		}
		let resultTag: { name: string; version: ParsedVersion } | undefined;
		for (const t of this.tags) {
			const targetVersion = parseVersion(t.name);
			if (
				targetVersion &&
				isHigherVersion(currentVersion, targetVersion) &&
				(!resultTag || isHigherVersion(resultTag.version, targetVersion))
			) {
				resultTag = {
					name: t.name,
					version: targetVersion,
				};
			}
		}
		return resultTag ? this.getTag(resultTag.name) : undefined;
	};
}
