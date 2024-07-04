import {getOsNameFromDockerFile, getPHPTag, getPHPExtTag} from "@src/tools"

describe("Test utils", () => {
	test("getOsNameFromDockerFile: remove docker prefix", () => {
		const file = "aaa/ddd/Dockerfile.alpine";
		expect(getOsNameFromDockerFile(file)).toBe("alpine");
	});

	test("getOfficialPHPTag: check name", () => {
		expect(getPHPTag("8.3.8", "alpine", "fpm")).toBe("8.3.8-fpm-alpine");
	});

	test("getPHPTag: check name", () => {
		expect(getPHPExtTag("8.3.8", "alpine", "ext", "fpm")).toBe("8.3.8-fpm-alpine-ext");
	});
});
