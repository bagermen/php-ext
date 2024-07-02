import {filterContext} from "@src/main";
import {getOsNameFromDockerFile, getOfficialPHPTag, getPHPTag} from "@src/utils"
import {DockerHubTags} from "docker-hub-tags";

describe("Test utils", () => {
	test("getOsNameFromDockerFile: remove docker prefix", () => {
		const file = "aaa/ddd/Dockerfile.alpine";
		expect(getOsNameFromDockerFile(file)).toBe("alpine");
	});

	test("getOfficialPHPTag: check name", () => {
		const file = "aaa/ddd/Dockerfile.alpine";
		expect(getOfficialPHPTag("8.3.8", "alpine", "fpm")).toBe("8.3.8-fpm-alpine");
	});

	test("getPHPTag: check name", () => {
		const file = "aaa/ddd/Dockerfile.alpine";
		expect(getPHPTag("8.3.8", "alpine", "fpm")).toBe("8.3.8-fpm-alpine-ext");
	});
});

let dhtInitMock: jest.SpiedFunction<typeof DockerHubTags.init>;
let getAllTags: jest.SpiedFunction<typeof DockerHubTags.prototype.getAllTags>;

describe("DockerHub Queries", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("PHPTag Only: tag exists in official PHP repo", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-alpine",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "8.3.8-fpm-alpine",
			phpExtTag: "8.3.8-fpm-alpine-ext"
		}]);
		expect(dhtInitMock).toHaveBeenCalled();
		expect(getAllTags).toHaveBeenCalled();
		expect(result).toHaveLength(1);
		expect(result.at(0)?.phpTag).toBe("8.3.8-fpm-alpine");
	});

	test("PHPTag Only: tag doesn't exists in official PHP repo", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-something",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "8.3.8-fpm-alpine",
			phpExtTag: "8.3.8-fpm-alpine-ext"
		}]);
		expect(dhtInitMock).toHaveBeenCalled();
		expect(getAllTags).toHaveBeenCalled();
		expect(result).toHaveLength(0);
	});

	test("2 repos: phpTag exist, phpExtTag doen't exists", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-alpine",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "8.3.8-fpm-alpine",
			phpExtTag: "something"
		}],"namespace");
		expect(dhtInitMock).toHaveBeenCalledTimes(2);
		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(result).toHaveLength(1);
	});

	test("2 repos: phpTag exist, phpExtTag exists", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-alpine",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "8.3.8-fpm-alpine",
			phpExtTag: "8.3.8-fpm-alpine"
		}],"namespace");
		expect(dhtInitMock).toHaveBeenCalledTimes(2);
		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(result).toHaveLength(0);
	});

	test("2 repos: phpTag doresn't exist, phpExtTag exists", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-alpine-ext",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "something",
			phpExtTag: "8.3.8-fpm-alpine-ext"
		}],"namespace");
		expect(dhtInitMock).toHaveBeenCalledTimes(2);
		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(result).toHaveLength(0);
	});

	test("2 repos: nothing found", async () => {
		let dhtInstance = new (DockerHubTags as any)([]) as DockerHubTags;
		dhtInitMock = jest.spyOn(DockerHubTags, "init").mockResolvedValue(dhtInstance);
		getAllTags = jest.spyOn(dhtInstance, "getAllTags").mockReturnValue(
			[
				{
					name: "8.3.8-fpm-something",
					tag_status: '',
					content_type: '',
					full_size: 0,
					last_updated: new Date(),
					digest: '',
					images: []
				}
			]
		);

		const result = await filterContext([{
			dockerFile: "Dockerfile.alpine",
			phpTag: "8.3.8-fpm-alpine",
			phpExtTag: "8.3.8-fpm-alpine-ext"
		}],"namespace");
		expect(dhtInitMock).toHaveBeenCalledTimes(2);
		expect(getAllTags).toHaveBeenCalledTimes(2);
		expect(result).toHaveLength(0);
	});
});
