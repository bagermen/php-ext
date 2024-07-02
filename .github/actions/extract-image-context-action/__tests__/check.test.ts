import {filterContext} from "@src/main";
import {getOsNameFromDockerFile} from "@src/utils"
import {DockerHubTags} from "docker-hub-tags";

test("remove docker prefix", () => {
	const file = "aaa/ddd/Dockerfile.alpine";
	expect(getOsNameFromDockerFile(file)).toBe("alpine");
});

let dhtInitMock: jest.SpiedFunction<typeof DockerHubTags.init>;
let getAllTags: jest.SpiedFunction<typeof DockerHubTags.prototype.getAllTags>;


describe("Test DockerHub queries", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("Filter Contextes By DockerHub", async () => {
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
});
