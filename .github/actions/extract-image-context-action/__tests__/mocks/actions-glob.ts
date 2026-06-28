import { jest } from "@jest/globals";

export const create = jest.fn(async () => ({
	glob: jest.fn(async () => []),
}));
