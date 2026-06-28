import { pathsToModuleNameMapper, createJsWithTsEsmPreset, } from "ts-jest";
import tsconfigBase from "./tsconfig.base.json" with { type: 'json' };
const { compilerOptions } = tsconfigBase;
const defaultPreset = createJsWithTsEsmPreset();
export default async () => {
    return {
        ...defaultPreset,
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
        moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' })
    };
};
