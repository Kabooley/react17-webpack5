import type { iConfig, iTreeMeta } from './fetchLibs.worker';

// Fetch all versions data of `moduleName`
export const getNPMVersionsForModule = async (moduleName: string) => {
    const url = `https://data.jsdelivr.com/v1/package/npm/${moduleName}`;
    return fetcher<{ tags: Record<string, string>; versions: string[] }>(url, {
        cache: 'no-store',
    });
};

// Fetch referenced module to get correct version.
export const getNPMVersionForModuleByReference = async (
    moduleName: string,
    // modules version
    reference: string
) => {
    const url = `https://data.jsdelivr.com/v1/package/resolve/npm/${moduleName}@${reference}`;
    return fetcher<{ version: string | null }>(url);
};

export const getFileTreeForModuleByVersion = async (
    config: iConfig,
    moduleName: string,
    version: string
) => {
    const url = `https://data.jsdelivr.com/v1/package/npm/${moduleName}@${version}/flat`;
    const response = await fetcher<iTreeMeta>(url);
    if (response instanceof Error) {
        return response;
    } else {
        return {
            ...response,
            moduleName,
            version,
        };
    }
};

export const getFileForModuleByFilePath = async (
    config: iConfig,
    moduleName: string,
    version: string,
    file: string
) => {
    // file comes with a prefix /
    const url = `https://cdn.jsdelivr.net/npm/${moduleName}@${version}${file}`;
    const res = await fetch(url);
    if (res.ok) {
        return res.text();
    } else {
        return new Error('OK');
    }
};

const fetcher = <T>(
    url: string,
    init?: RequestInit | undefined
): Promise<T | Error> => {
    return fetch(url, init).then((response) => {
        if (response.ok) {
            return response.json().then((data) => data as T);
        } else {
            return new Error(
                `Error: Something went wrong among fetching ${url}`
            );
        }
    });
};
