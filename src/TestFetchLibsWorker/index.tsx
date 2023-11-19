import React, { useEffect, useRef } from 'react';
import type {
    iRequest,
    iResponse,
} from '../TestFetchLibsWorker/fetchLibs.worker';

const cl = (message: string) => {
    console.log(`[TestFetchLibsWorker] ${message}`);
};

const Test: React.FC = () => {
    const agent = useRef<Worker>();

    useEffect(() => {
        if (window.Worker && agent.current === undefined) {
            // DEBUG:
            cl('Generate agent worker');

            agent.current = new Worker(
                new URL(
                    '/src/TestFetchLibsWorker/fetchLibs.worker.ts',
                    import.meta.url
                ),
                { type: 'module' }
            );
            agent.current.addEventListener('message', handleMessage);

            const dummyModules = [
                { name: 'react', version: '18.2.0' },
                { name: 'react-dom/client', version: '18.2.0' },
            ];
            dummyModules.forEach((dm) => {
                // DEBUG:
                cl(`Request: ${dm.name}@${dm.version}`);

                agent.current?.postMessage({
                    order: 'RESOLVE_DEPENDENCY',
                    payload: {
                        moduleName: dm.name,
                        version: dm.version,
                    },
                } as iRequest);
            });
        }

        return () => {
            if (window.Worker && agent.current !== undefined) {
                // DEBUG:
                cl('Terminate agent worker.');
                agent.current.removeEventListener('message', handleMessage);
                agent.current.terminate();
                agent.current = undefined;
            }
        };
    }, []);

    const handleMessage = (e: MessageEvent<iResponse>) => {
        const { error, order, payload } = e.data;
        if (error) {
            // ひとまず
            console.error(error);
        }
        const { depsMap } = payload;

        cl('Got depsMap');
        console.log(depsMap);
        const iterator = depsMap.entries();
        let length = depsMap.size;
        const modules: string[] = [];
        while (length--) {
            modules.push(iterator.next().value);
        }
        console.log(modules);
    };

    return (
        <div className="test-fetchlibs-worker">
            <h2>TEST FETCHLIBS WORKER</h2>
        </div>
    );
};

export default Test;
