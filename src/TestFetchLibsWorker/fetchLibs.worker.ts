/************************************************
 *
 *
 * NOTE: depth 1以降はどのモジュールもversionが`latest`になる
 * TODO: このファイルが原因であるのか定かでないけれど、`window`ってなに？というエラーが出ている
 * TODO: メインスレッドと通信できない(また？)
 * **********************************************/

// import { valid } from 'semver';
import {
    getFileTreeForModuleByVersion,
    getFileForModuleByFilePath,
    getNPMVersionForModuleByReference,
    getNPMVersionsForModule,
} from './fetcher';
import { mapModuleNameToModule } from './edgeCases';
import { createStore, set as setItem, get as getItem, clear } from 'idb-keyval';

// DEBUG:
import { logArrayData } from './logArrayData';

// TODO: typescriptをimportするのはここであるべきか？
import ts from 'typescript';
// import { preProcessFile } from 'typescript';

// なんかtypescriptを直接インポートするとwindowってなに？ってエラーが出る
// そのためネットから取得する
// (同じ理由でtypeof import("typescript")もできない？)
// declare const ts: any;
// if (typeof self.importScripts === 'function') {
//     self.importScripts(
//         'https://cdn.jsdelivr.net/npm/typescript@5.2.2/lib/typescript.min.js'
//     );
//     console.log('[fetchLibs.worker] typescript Downloaded');
// }

// --- types ---

// types for ts.preProcessFile() method.
enum ModuleKind {
    None = 0,
    CommonJS = 1,
    AMD = 2,
    UMD = 3,
    System = 4,
    ES2015 = 5,
    ES2020 = 6,
    ES2022 = 7,
    ESNext = 99,
    Node16 = 100,
    NodeNext = 199,
}
type ResolutionMode = ModuleKind.ESNext | ModuleKind.CommonJS | undefined;
interface TextRange {
    pos: number;
    end: number;
}
interface FileReference extends TextRange {
    fileName: string;
    resolutionMode?: ResolutionMode;
}
interface PreProcessedFileInfo {
    referencedFiles: FileReference[];
    typeReferenceDirectives: FileReference[];
    libReferenceDirectives: FileReference[];
    importedFiles: FileReference[];
    ambientExternalModules?: string[];
    isLibFile: boolean;
}

type iOrder = 'RESOLVE_DEPENDENCY';

interface iRequest {
    order: iOrder;
    payload: {
        moduleName: string;
        version: string;
    };
}

interface iResponse {
    order: iOrder;
    payload: {
        depsMap: Map<string, string>;
    };
    error?: Error;
}

interface Logger {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    groupCollapsed: (...args: any[]) => void;
    groupEnd: (...args: any[]) => void;
}

// 正直いらないかも。ATAのconfigをひとまず模倣しただけ。この方法は便利そうですけどね。
interface iConfig {
    typescript: typeof import('typescript');
    logger?: Logger;
    // delegate: {
    //   start: () => void;
    //   finished: () => void;
    // };
}

// Tree object that contained in response from fetching package module.
interface iTreeMeta {
    default: string;
    files: Array<{ name: string }>;
    moduleName: string;
    version: string;
}

type iTree =
    | iTreeMeta
    | { error: Error; message: string }
    | {
          error: {
              version: string | null;
          };
          message: string;
      };

// Type of `.d.ts` file from `iTreeMeta.files`.
interface iDTSFile {
    moduleName: string;
    moduleVersion: string;
    vfsPath: string;
    path: string;
}

// --- IndexedDB interfaces ---

const store = createStore(
    'fetched-type-modules-cache-v1-db',
    'fetched-type-modules-cache-v1-store'
);

// DEBUG:
const clearStore = async () => await clear(store);

// --- Methods ---

/***
 * Fetch to get npm module package file lists.
 * fetch(`https://data.jsdelivr.com/v1/package/npm/${moduleName}@${version}/flat`).
 *
 * @param {iConfig} config -
 * @param {string} moduleName - Name of npm module package.
 * @param {string} version - Version of npm module package.
 * @returns {Promise<{moduleName: string; version: string; default: string; files: Array<{name: string;}>;} | {error: Error; message: string;}>} - Object that contains file list of package or fetching error.
 *
 * This will fix version if `version` is incorrect if possible.
 * */

const getFileTreeForModule = async (
    config: iConfig,
    moduleName: string,
    version: string
) => {
    let _version = version;
    if (!_version.length) _version = 'latest';

    // Update version if passed version is like "18.0".
    if (version.split('.').length < 2) {
        // The jsdelivr API needs a _version_ not a tag. So, we need to switch out
        // the tag to the version via an API request.
        const response = await getNPMVersionForModuleByReference(
            moduleName,
            _version
        );
        if (response instanceof Error) {
            return {
                error: response,
                message: `Could not go from a tag to version on npm for ${moduleName} - possible typo?`,
            };
        }

        const neededVersion = response.version;
        if (!neededVersion) {
            const versions = await getNPMVersionsForModule(moduleName);
            if (versions instanceof Error) {
                return {
                    error: response,
                    message: `Could not get versions on npm for ${moduleName} - possible typo?`,
                };
            }

            const tags = Object.entries(versions.tags).join(', ');
            return {
                error: new Error('Could not find tag for module'),
                message: `Could not find a tag for ${moduleName} called ${_version}. Did find ${tags}`,
            };
        }

        _version = neededVersion;
    }

    const response = await getFileTreeForModuleByVersion(
        config,
        moduleName,
        _version
    );
    if (response instanceof Error) {
        return {
            error: response,
            message: `${response.message} Please make sure module name or version is correct.`,
        };
    }
    return response;
};

// --- helpers ---

// Check if parameter string includes any whitespaces.
const isIncludingWhiteSpaces = (str: string) => {
    return /\s/g.test(str);
};

/***
 * Exclude invalid module name.
 *
 * https://docs.npmjs.com/package-name-guidelines
 * https://github.com/npm/validate-npm-package-name#naming-rules
 *
 * Module name begins with '.', '_' is not allowed.
 * Module name includes any whitespace is not allowed.
 * package name should not contain any of the following characters: ~)('!*
 * */

const excludeInvalidModuleName = (moduleName: string) => {
    let result = true;
    result = !moduleName.startsWith('.') && result;
    result = !moduleName.startsWith('_') && result;
    result = !isIncludingWhiteSpaces(moduleName) && result;
    // TODO: use regext to exlude name including invalid character
    return result;
};

/***
 * Exclude invalid npm package version string.
 *
 * @param {string} version - Version string that will be checked by semver.valid().
 * @returns {string|null} - Returns result of semver.valid(version).
 *
 * https://semver.org/
 * https://www.npmjs.com/package/semver
 * https://semver.org/#backusnaur-form-grammar-for-valid-semver-versions
 *
 * NOTE: semver does not allows `latest` as correct versioning.
 * 厳密なバージョン指定でないと受け付けない。つまり、`X.Y.Z`
 * */
const validateModuleVersion = (version: string) => {
    // semver.valid() method.
    // return valid(version);
    return version;
};

/**
 * Retrieve referenced files which has `.d.ts` extension from tree object.
 *
 * @param {iTreeMeta} tree - Tree object which was fetched by its module name and contains files which are referenced from the module.
 * @param {string} vfsPrefix - Virtual file path for `.d.ts` file.
 * @returns {Array<iDTSFile>}
 * */

const getDTSFilesFromTree = (tree: iTreeMeta, vfsPrefix: string) => {
    const dtsFiles: iDTSFile[] = [];

    for (const file of tree.files) {
        if (file.name.endsWith('.d.ts')) {
            dtsFiles.push({
                moduleName: tree.moduleName,
                moduleVersion: tree.version,
                vfsPath: `${vfsPrefix}${file.name}`,
                path: file.name,
            } as iDTSFile);
        }
    }

    return dtsFiles;
};

// `react-dom/client`を`react-dom__client`にしてくれたりする
// Taken from dts-gen: https://github.com/microsoft/dts-gen/blob/master/lib/names.ts
function getDTName(s: string) {
    if (s.indexOf('@') === 0 && s.indexOf('/') !== -1) {
        // we have a scoped module, e.g. @bla/foo
        // which should be converted to   bla__foo
        s = s.substr(1).replace('/', '__');
    }
    return s;
}

/***
 * Parse passed code and returns list of imported module name and version set.
 *
 * @ param {import("typescript")} ts - TypeScript library.~
 * @param {string} code - Code that will be parsed what modules are imported in this code.
 * @return {Array<{module: string, version: string}>} - `code`から読み取ったimportモジュールのうち、
 * `.d.ts`拡張子ファイルでないもの、TypeScriptライブラリでないものをリスト化して返す。
 * */
const retrieveImportedModulesByParse = (
    ts: typeof import('typescript'),
    code: string
) => {
    // ts: typescript
    const meta = ts.preProcessFile(code) as PreProcessedFileInfo;
    // Ensure we don't try download TypeScript lib references
    // @ts-ignore - private but likely to never change
    const libMap: Map<string, string> = ts.libMap || new Map();

    // meta.referencedFiles, meta.importedFiles, meta.libReferenceDirectives
    // をいったん一つの配列にまとめて、
    //`.d.ts`拡張子ファイルでないもの、かつすでに取得済でないモジュールを抽出する
    const references = meta.referencedFiles
        .concat(meta.importedFiles)
        .concat(meta.libReferenceDirectives)
        .filter((f) => !f.fileName.endsWith('.d.ts'))
        .filter((d) => !libMap.has(d.fileName));

    return references.map((r) => {
        let version = undefined;
        if (!r.fileName.startsWith('.')) {
            version = 'latest';
            const line = code.slice(r.end).split('\n')[0]!;
            if (line.includes('// types:'))
                version = line.split('// types: ')[1]!.trim();
        }

        return {
            module: r.fileName,
            version,
        };
    });
};

// --- Main ---

/***
 * Agent resolves module's type definition files.
 *
 * @param {iConfig} config - Config for this agent.
 * @param {string} moduleName - Module name to be resolved.
 * @param {string} version - Module's version to be resolved.
 * @returns {Promise<{vfs: Map<string, string>; moduleName: string; version: string;}>} - Resolved type definition files for the module and its code.
 *
 * */
const fetchTypeAgent = (
    config: iConfig,
    moduleName: string,
    version: string
) => {
    // const moduleMap = new Map<string, ModuleMeta>();
    const fsMap = new Map<string, string>();

    let downloading = 0;
    let downloaded = 0;

    // DEBUG:
    const fetchingModuleTitle = `${moduleName}@${version}`;

    const resolver = async (
        _moduleName: string,
        version: string,
        depth: number
    ) => {
        console.log(`[fetching ${fetchingModuleTitle}] depth: ${depth}`);

        // Exclude invalid module name and invalid version.
        if (!excludeInvalidModuleName(_moduleName)) {
            console.error(
                `Module name ${_moduleName} is invalid or unignorable.`
            );
            if (depth > 0) return;
            throw new Error(
                'Error: Invalid module name. You might input incorrect module name.'
            );
        }
        if (version !== 'latest' && !validateModuleVersion(version)) {
            console.error(
                `Module version ${version} of ${_moduleName} is invalid or unignorable.`
            );
            if (depth > 0) return;
            throw new Error(
                'Error: Invalid semantic version. You might input incorrect module version.'
            );
        }

        // Converts some of the known global imports to node so that we grab the right info.
        // And strip module filepath e.g. react-dom/client --> react-dom
        const moduleName = mapModuleNameToModule(_moduleName);

        // DEBUG:
        console.log(
            `[fetching ${fetchingModuleTitle}] depsToGet: ${_moduleName}@${version}`
        );

        // Return if it's already downloaded.
        // if (moduleMap.has(moduleName)) {
        //   console.log(`[fetching ${fetchingModuleTitle}] Module ${moduleName} is already downloaded.`);
        //   return;
        // }
        const isAlreadyExists = await getItem(moduleName, store);
        if (isAlreadyExists) {
            console.log(
                `[fetching ${fetchingModuleTitle}] Module ${moduleName} is already downloaded.`
            );
            return;
        }

        // Find where the .d.ts file at.
        // moduleMap.set(moduleName, { state: "loading" });
        await setItem(moduleName, `${moduleName}@${version}`, store);

        const _tree: iTree = await getFileTreeForModule(
            config,
            moduleName,
            version
        );
        if (_tree.hasOwnProperty('error')) {
            config.logger?.error(
                (_tree as { error: Error; message: string }).message
            );
            // TODO: このエラースローは適切か？
            throw (_tree as { error: Error; message: string }).error;
        }
        const tree = _tree as iTreeMeta;

        // DEBUG:
        console.log(`[fetching ${fetchingModuleTitle}] treesOnly:`);
        console.log(tree);

        const hasDtsFile = tree.files.find((f) => f.name.endsWith('.d.ts'));

        // DEBUG:
        console.log(`[fetching ${fetchingModuleTitle}] hasDtsFile:`);
        console.log(hasDtsFile);

        let DTSFiles1: iDTSFile[] = [];
        let DTSFiles2: iDTSFile[] = [];

        if (hasDtsFile !== undefined) {
            // Retrieve .d.ts file directly.
            DTSFiles1 = getDTSFilesFromTree(
                tree,
                `/node_modules/${tree.moduleName}`
            );

            // DEBUG:
            console.log(`[fetching ${fetchingModuleTitle}] dtsFilesFromNPM:`);
            logArrayData(DTSFiles1);
        } else {
            // Look for DT file instead.
            const _dtTree: iTree = await getFileTreeForModule(
                config,
                `@types/${getDTName(moduleName)}`,
                version
            );
            if (_dtTree.hasOwnProperty('error')) {
                config.logger?.error(
                    (_dtTree as { error: Error; message: string }).message
                );
                // TODO: このエラースローは適切か？
                throw (_dtTree as { error: Error; message: string }).error;
            }
            const dtTree = _dtTree as iTreeMeta;

            // DEBUG:
            console.log(`[fetching ${fetchingModuleTitle}] dtTreesOnly:`);
            console.log(dtTree);

            DTSFiles2 = getDTSFilesFromTree(
                dtTree,
                `/node_modules/@types/${getDTName(moduleName).replace(
                    'types__',
                    ''
                )}`
            );

            // DEBUG:
            console.log(`[fetching ${fetchingModuleTitle}] dtsFilesFromDT:`);
            console.log(DTSFiles2);
        }

        const downloadListOfDTSFiles = DTSFiles1.concat(DTSFiles2);
        downloading = downloadListOfDTSFiles.length;

        // DEBUG:
        console.log(`[fetching ${fetchingModuleTitle}] allDTSFiles:`);
        console.log(downloadListOfDTSFiles);

        // downloadListOfDTSFilesの長さがゼロの時はそのまま戻るので特に

        // Get package.json for module.
        await resolverOfPackageJson(tree);

        // Download all .d.ts files
        await Promise.all(
            downloadListOfDTSFiles.map(async (dtsFile) => {
                const dtsFileCode = await getFileForModuleByFilePath(
                    config,
                    dtsFile.moduleName,
                    dtsFile.moduleVersion,
                    dtsFile.path
                );
                downloaded++;
                if (dtsFileCode instanceof Error) {
                    config.logger?.error(
                        `Had an issue getting ${dtsFile.path} for ${dtsFile.moduleName}`
                    );
                } else {
                    fsMap.set(dtsFile.vfsPath, dtsFileCode);
                    // NOTE: ファイルを一つダウンロードする度に何かしたい場合このタイミング
                    // 例えば進行状況とかログに出したいとか。

                    // Retrieve all imported module names
                    //
                    // TODO: この時点でdepsToGetと同じ内容になっているのか確認
                    const modules = retrieveImportedModulesByParse(
                        config.typescript,
                        dtsFileCode
                    );
                    // Recurse through deps

                    await Promise.all(
                        modules.map((m) => {
                            const _version: string =
                                m.version === undefined ? 'latest' : m.version;
                            return resolver(m.module, _version, depth + 1);
                        })
                    );
                }
            })
        );
    };

    // Get package.json for the dependency.
    const resolverOfPackageJson = async (tree: iTreeMeta) => {
        let prefix = `/node_modules/${tree.moduleName}`;
        if (tree.files.find((f) => f.name.endsWith('.d.ts')) === undefined) {
            prefix = `/node_modules/@types/${getDTName(tree.moduleName).replace(
                'types__',
                ''
            )}`;
        }
        const path = prefix + '/package.json';
        const pkgJSON = await getFileForModuleByFilePath(
            config,
            tree.moduleName,
            tree.version,
            '/package.json'
        );

        if (typeof pkgJSON == 'string') {
            fsMap.set(path, pkgJSON);
            // NOTE: ファイルを一つダウンロードする度に何かしたい場合このタイミング
            // 例えば進行状況とかログに出したいとか。
        } else {
            config.logger?.error(
                `Could not download package.json for ${tree.moduleName}`
            );
        }
    };

    return resolver(moduleName, version, 0).then(() => {
        // TODO: download数がゼロだった場合の処理を決める

        return {
            vfs: fsMap,
            moduleName: moduleName,
            version: version,
        };
    });
};

// Incase this was worker.
// self.addEventListener('message', (e: MessageEvent<iRequest>) => {
self.onmessage = (e: MessageEvent<iRequest>) => {
    const { payload, order } = e.data;
    if (order !== 'RESOLVE_DEPENDENCY') return;
    const { moduleName, version } = payload;

    // TODO: configを呼び出し側から渡すようにするべきかの検討
    const config = {
        typescript: ts,
        logger: console,
    };

    // DEBUG:
    console.log(`[fetchLibs.worker] Got request: ${moduleName}@${version}`);

    fetchTypeAgent(config, moduleName, version)
        .then(
            (r: {
                vfs: Map<string, string>;
                moduleName: string;
                version: string;
            }) => {
                self.postMessage({
                    order: 'RESOLVE_DEPENDENCY',
                    payload: {
                        depsMap: r.vfs,
                    },
                } as iResponse);
            }
        )
        .catch((e) => {
            const emptyMap = new Map<string, string>();
            self.postMessage({
                order: 'RESOLVE_DEPENDENCY',
                payload: {
                    depsMap: emptyMap,
                },
                error: e,
            } as iResponse);
        });
};

export {
    fetchTypeAgent,
    // types
    iRequest,
    iResponse,
    iConfig,
    iTreeMeta,
    // DEBUG:
    clearStore,
};

// workerが正常に生成されているのかの確認
// `self`は`DedicatedWebWorkerGlobalScope`になっていないとならない
// もしも`self`が`Window`である場合、それは破棄されなくてはならない
// ReactはStrictModeだとuseEffectを2度実行するのでuseEffectでworkerを生成すると2度生成することになる
// この内globalがwindowになる方を破棄するはず
console.log('[fetchLibs.worker.ts]...');
console.log(self);
console.log(self.importScripts);
