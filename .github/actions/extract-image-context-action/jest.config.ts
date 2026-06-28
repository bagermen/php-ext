import type { JestConfigWithTsJest } from "ts-jest"
import { pathsToModuleNameMapper, createJsWithTsPreset } from "ts-jest"
import { readFileSync } from "node:fs"
const { compilerOptions } = JSON.parse(readFileSync("./tsconfig.base.json", "utf-8"))

const defaultPreset = createJsWithTsPreset({
	tsconfig: "<rootDir>/__tests__/tsconfig.json"
});

export default async (): Promise<JestConfigWithTsJest> => ({
	...defaultPreset,
	roots: ["<rootDir>/__tests__/"],
	preset: "ts-jest",
	testEnvironment: "node",
	verbose: true,
	clearMocks: true,
	moduleFileExtensions: ["ts", "js"],
	testPathIgnorePatterns: ["/node_modules/", "/dist/", "/__tests__/mocks/"],
	moduleNameMapper: {
		...pathsToModuleNameMapper(compilerOptions.paths, { prefix: "<rootDir>/" }),
		"^@actions/core$": "<rootDir>/__tests__/mocks/actions-core.ts",
		"^@actions/glob$": "<rootDir>/__tests__/mocks/actions-glob.ts",
	}
})
