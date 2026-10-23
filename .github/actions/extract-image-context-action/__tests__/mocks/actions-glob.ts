import { jest } from "@jest/globals";

type Globber = {
	glob: () => Promise<string[]>;
};

export const create: jest.MockedFunction<
	(patterns: string, options?: { followSymbolicLinks?: boolean }) => Promise<Globber>
> = jest.fn(async () => ({
	glob: jest.fn(async () => []),
}));
