import {
	DockerHubTagsError,
	type DockerHubTagsFilter,
	type DockerHubTagsOptions,
	type HubImage,
	type HubPage,
	type HubResult,
} from "./types";

const PAGESIZE = 100;
const HTTP_HEADERS = { Accept: "application/json" };
const RETRY_DELAY_MS = [250, 750] as const;

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function randomRetryDelay(): number {
	return Math.random() * RETRY_DELAY_MS[1] + RETRY_DELAY_MS[0];
}

function retryAfterMs(response: Response): number {
	const header = response.headers.get("Retry-After");
	if (!header) {
		return randomRetryDelay();
	}
	const seconds = Number(header);
	if (!Number.isNaN(seconds) && seconds >= 0) {
		return seconds * 1000;
	}
	const dateMs = Date.parse(header);
	if (!Number.isNaN(dateMs)) {
		return Math.max(0, dateMs - Date.now());
	}
	return randomRetryDelay();
}

function errorMessageFromBody(text: string, status: number): string {
	try {
		const json = JSON.parse(text) as { message?: string; detail?: string };
		const msg = json.message ?? json.detail;
		if (msg) {
			return `Docker Hub HTTP ${status}: ${msg}`;
		}
	} catch {
		// not JSON
	}
	const snippet = text.trim().slice(0, 200);
	return snippet
		? `Docker Hub HTTP ${status}: ${snippet}`
		: `Docker Hub HTTP ${status}`;
}

function parseHubPage(json: unknown): HubPage {
	if (!json || typeof json !== "object") {
		throw new DockerHubTagsError("Docker Hub response is not an object");
	}
	const page = json as Record<string, unknown>;
	if (!Array.isArray(page.results)) {
		throw new DockerHubTagsError(
			`Docker Hub response missing results array (keys: ${Object.keys(page).join(", ") || "none"})`
		);
	}
	const next = page.next;
	if (next !== null && typeof next !== "undefined" && typeof next !== "string") {
		throw new DockerHubTagsError("Docker Hub response has invalid next field");
	}
	return {
		count: typeof page.count === "number" ? page.count : undefined,
		next: typeof next === "string" ? next : null,
		results: page.results,
	};
}

function asString(value: unknown, fallback = ""): string {
	return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
	return typeof value === "number" ? value : fallback;
}

function normalizeImage(raw: unknown): HubImage | undefined {
	if (!raw || typeof raw !== "object") {
		return;
	}
	const image = raw as Record<string, unknown>;
	return {
		os: asString(image.os),
		architecture: asString(image.architecture),
		variant: image.variant === null || typeof image.variant === "string" ? (image.variant as string | null) : null,
		size: asNumber(image.size),
		status: asString(image.status),
		digest: asString(image.digest),
	};
}

function normalizeTag(raw: unknown): HubResult | undefined {
	if (!raw || typeof raw !== "object") {
		return;
	}
	const tag = raw as Record<string, unknown>;
	const name = asString(tag.name);
	if (!name) {
		return;
	}
	const imagesRaw = Array.isArray(tag.images) ? tag.images : [];
	const images = imagesRaw.map(normalizeImage).filter((img): img is HubImage => typeof img !== "undefined");
	return {
		name,
		tag_status: asString(tag.tag_status),
		content_type: asString(tag.content_type),
		full_size: asNumber(tag.full_size),
		last_updated: typeof tag.last_updated === "string" || tag.last_updated instanceof Date
			? tag.last_updated
			: "",
		digest: asString(tag.digest),
		images,
	};
}

async function fetchOnce(url: string, init: RequestInit): Promise<Response> {
	const response = await fetch(url, init);
	if (response.status === 429) {
		const err = new Error(`rate limited`) as Error & { response: Response };
		err.response = response;
		throw err;
	}
	return response;
}

export async function fetchRetry(url: string, retry: number, init: RequestInit): Promise<Response> {
	let tryCount = retry;
	let lastError: unknown;

	while (tryCount--) {
		try {
			return await fetchOnce(url, init);
		} catch (error) {
			lastError = error;
			const response = (error as { response?: Response })?.response;
			if (response?.status === 429) {
				await sleep(retryAfterMs(response));
				continue;
			}
			await sleep(randomRetryDelay());
		}
	}
	throw lastError;
}

export async function fetchTags(
	namespace: string,
	repository: string,
	filter: DockerHubTagsFilter,
	options: DockerHubTagsOptions
): Promise<HubResult[]> {
	const getUrl = (page: number) =>
		`https://hub.docker.com/v2/namespaces/${namespace}/repositories/${repository}/tags?page=${page}&page_size=${PAGESIZE}`;

	const tags: HubResult[] = [];
	let page = 0;

	tagLimit: while (true) {
		page++;
		const fetched = await fetchRetry(getUrl(page), options.retry, {
			method: "GET",
			headers: HTTP_HEADERS,
		});

		const text = await fetched.text();
		if (!fetched.ok) {
			throw new DockerHubTagsError(errorMessageFromBody(text, fetched.status));
		}

		let json: unknown;
		try {
			json = JSON.parse(text);
		} catch {
			throw new DockerHubTagsError(`Docker Hub returned non-JSON response (HTTP ${fetched.status})`);
		}

		const response = parseHubPage(json);
		for (const raw of response.results) {
			const tag = normalizeTag(raw);
			if (!tag) {
				continue;
			}
			if (tag.content_type === "image" && tag.tag_status === "active" && tag.digest) {
				tag.images = tag.images.filter(
					(image) =>
						image.status === "active" &&
						image.digest &&
						image.os !== "unknown" &&
						image.architecture !== "unknown" &&
						(!filter.os || image.os === filter.os) &&
						(!filter.architecture || image.architecture === filter.architecture) &&
						(!filter.variant || image.variant === filter.variant)
				);
				if (tag.images.length > 0) {
					tags.push(tag);
					if (options.limit > 0 && tags.length >= options.limit) {
						break tagLimit;
					}
				}
			}
		}
		if (!response.next) {
			break;
		}
	}

	return tags;
}
