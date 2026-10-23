import { describe, test, expect, jest, beforeEach, afterEach } from "@jest/globals";
import {
	DockerHubTags,
	parseVersion,
	parseVersionWithLevel,
	isHigherVersion,
} from "@src/docker-hub-tags";
import type { HubResult } from "@src/docker-hub-tags";

function sampleTag(name: string, digest = "sha256:aaa", overrides: Partial<HubResult> = {}): HubResult {
	return {
		name,
		tag_status: "active",
		content_type: "image",
		full_size: 100,
		last_updated: "2024-01-01T00:00:00.000Z",
		digest,
		images: [
			{
				os: "linux",
				architecture: "amd64",
				variant: null,
				size: 100,
				status: "active",
				digest: `${digest}-amd64`,
			},
		],
		...overrides,
	};
}

describe("semver helpers", () => {
	test("parseVersion with postfix", () => {
		expect(parseVersion("8.3.8-fpm-alpine-ext")).toEqual({
			major: 8,
			minor: 3,
			patch: 8,
			postfix: "-fpm-alpine-ext",
		});
	});

	test("parseVersionWithLevel patch and minor", () => {
		expect(parseVersionWithLevel("~8.3.0-fpm-alpine-ext")?.semverLevel).toBe("patch");
		expect(parseVersionWithLevel("^8.3.0-fpm-alpine-ext")?.semverLevel).toBe("minor");
		expect(parseVersionWithLevel("8.3.0-fpm-alpine-ext")?.semverLevel).toBe("major");
	});

	test("isHigherVersion respects postfix and patch level", () => {
		const from = parseVersionWithLevel("~8.3.0-fpm-alpine-ext")!;
		const higher = parseVersion("8.3.8-fpm-alpine-ext")!;
		const otherPostfix = parseVersion("8.3.8-fpm-bookworm-ext")!;
		expect(isHigherVersion(from, higher)).toBe(true);
		expect(isHigherVersion(from, otherPostfix)).toBe(false);
	});
});

describe("DockerHubTags query helpers", () => {
	test("getTag and sameTags by digest", () => {
		const dht = DockerHubTags.createFromJson(
			JSON.stringify([
				sampleTag("8.3.8-fpm-alpine-ext", "sha256:same"),
				sampleTag("8.3-fpm-alpine-ext", "sha256:same"),
				sampleTag("other", "sha256:other"),
			])
		);
		const tag = dht.getTag("8.3.8-fpm-alpine-ext");
		expect(tag?.sameTags).toEqual(["8.3.8-fpm-alpine-ext", "8.3-fpm-alpine-ext"]);
	});

	test("getRecent finds newer patch with same postfix", () => {
		const dht = DockerHubTags.createFromJson(
			JSON.stringify([
				sampleTag("8.3.1-fpm-alpine-ext"),
				sampleTag("8.3.8-fpm-alpine-ext"),
				sampleTag("8.3.5-fpm-alpine-ext"),
			])
		);
		expect(dht.getRecent("~8.3.1-fpm-alpine-ext")?.name).toBe("8.3.8-fpm-alpine-ext");
		expect(dht.getRecent("~8.3.8-fpm-alpine-ext")).toBeUndefined();
	});
});

describe("DockerHubTags.fetch hardening", () => {
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		jest.restoreAllMocks();
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("init succeeds on valid page", async () => {
		globalThis.fetch = jest.fn<typeof fetch>().mockResolvedValue(
			new Response(
				JSON.stringify({
					count: 1,
					next: null,
					results: [sampleTag("8.3.8-fpm-alpine")],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			)
		);

		const dht = await DockerHubTags.init("library", "php", {}, { limit: 10, retry: 2 });
		expect(dht.getAllTags()).toHaveLength(1);
		expect(dht.getTag("8.3.8-fpm-alpine")?.name).toBe("8.3.8-fpm-alpine");
	});

	test("init retries on 429 then succeeds", async () => {
		const fetchMock = jest
			.fn<typeof fetch>()
			.mockResolvedValueOnce(
				new Response(JSON.stringify({ message: "Too Many Requests" }), {
					status: 429,
					headers: { "Retry-After": "0" },
				})
			)
			.mockResolvedValueOnce(
				new Response(
					JSON.stringify({
						count: 1,
						next: null,
						results: [sampleTag("latest")],
					}),
					{ status: 200 }
				)
			);
		globalThis.fetch = fetchMock;

		const dht = await DockerHubTags.init("library", "php", {}, { limit: 10, retry: 3 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(dht.getLatest()?.name).toBe("latest");
	});

	test("init throws clear error on 404 error body", async () => {
		globalThis.fetch = jest.fn<typeof fetch>().mockImplementation(() =>
			Promise.resolve(
				new Response(JSON.stringify({ message: "object not found", errinfo: {} }), {
					status: 404,
					headers: { "Content-Type": "application/json" },
				})
			)
		);

		await expect(DockerHubTags.init("library", "php", {}, { limit: 10, retry: 1 })).rejects.toMatchObject({
			name: "DockerHubTagsError",
			message: expect.stringMatching(/HTTP 404.*object not found/),
		});
	});

	test("init throws when results are missing", async () => {
		globalThis.fetch = jest.fn<typeof fetch>().mockResolvedValue(
			new Response(JSON.stringify({ message: "weird" }), { status: 200 })
		);

		await expect(DockerHubTags.init("library", "php", {}, { limit: 10, retry: 1 })).rejects.toThrow(
			/missing results array/
		);
	});
});
