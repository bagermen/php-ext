import type { JestConfigWithTsJest } from "ts-jest"
import { pathsToModuleNameMapper } from "ts-jest"
import { compilerOptions } from "./tsconfig.base.json"


export default async (): Promise<JestConfigWithTsJest> => {
	return {
		roots: [
			"<rootDir>/__tests__/"
		],
		verbose: true,
		preset: "ts-jest",
		clearMocks: true,
		testEnvironment: "node",
    	moduleFileExtensions: [
			"ts",
      		"js",
    	],
		testPathIgnorePatterns: [
      		"/node_modules/",
      		"/dist/"
    	],
		globals: {
			"ts-jest": {
				tsconfig: "./__tests__/tsconfig.json"
			}
		},
		moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
	};
};
