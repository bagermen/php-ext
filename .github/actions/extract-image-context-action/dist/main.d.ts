import { ImageContext } from "./types";
export declare function run(): Promise<void>;
export declare function findDockerFileNames(): Promise<string[]>;
export declare function filterContext(contextes: ImageContext[], phpExtNamespace?: string): Promise<ImageContext[]>;
