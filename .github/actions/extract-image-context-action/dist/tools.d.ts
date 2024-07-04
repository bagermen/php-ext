import { DockerHubTags } from "docker-hub-tags";
export declare function getPHPTags(): Promise<DockerHubTags>;
export declare function getPHPExtTags(phpExtNamespace: string): Promise<DockerHubTags>;
export declare function findDockerFileNames(): Promise<string[]>;
export declare function getOsNameFromDockerFile(file: string): string;
export declare function getPHPTag(phpVersion: string, osName: string, phpType?: string): string;
export declare function getPHPExtTag(phpVersion: string, osName: string, extSuffix: string, phpType?: string): string;
export declare function isError(error: unknown): error is Error;
