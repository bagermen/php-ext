import {getOsNameFromDockerFile} from "@src/utils"

test("remove docker prefix", () => {
	const file = "aaa/ddd/Dockerfile.alpine";
	expect(getOsNameFromDockerFile(file)).toBe("alpine");
});
