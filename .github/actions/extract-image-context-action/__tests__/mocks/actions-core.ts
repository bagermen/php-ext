import { jest } from "@jest/globals";

export const debug = jest.fn();
export const setFailed = jest.fn();
export const setOutput = jest.fn();
export const getInput = jest.fn<(name: string) => string>();
