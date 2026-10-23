import { jest } from "@jest/globals";

export const debug: jest.MockedFunction<(message: string) => void> = jest.fn();
export const setFailed: jest.MockedFunction<(message: string | Error) => void> = jest.fn();
export const setOutput: jest.MockedFunction<(name: string, value: unknown) => void> = jest.fn();
export const getInput: jest.MockedFunction<(name: string) => string> = jest.fn<(name: string) => string>();
