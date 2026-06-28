export declare function parsePhpExtensionsIni(content: string): Map<string, string[]>;
export declare function resolveExtList(phpVersion: string, sections: Map<string, string[]>): string;
export declare function loadExtList(phpVersion: string, configPath: string): Promise<string>;
