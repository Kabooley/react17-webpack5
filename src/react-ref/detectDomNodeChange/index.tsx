import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import type { ResizeCallbackData } from 'react-resizable';

const TestDetectDomNodeChange = () => {
    const [height, setHeight] = useState(36);
    const [width, setWidth] = useState(200);

    const measuredRef = useCallback((node) => {
        if (node !== null) {
            setHeight(node.getBoundingClientRect().height);
            setWidth(node.getBoundingClientRect().width);
        }
    }, []);

    const onResize: (
        e: React.SyntheticEvent,
        data: ResizeCallbackData
    ) => any = (event, { node, size, handle }) => {
        console.log('resized');
    };

    return (
        <>
            <ResizableBox
                width={width}
                height={height}
                onResize={onResize}
                resizeHandles={['e', 's']}
                handle={(h, ref) => (
                    <span
                        className={`custom-handle custom-handle-${h}`}
                        ref={ref}
                    />
                )}
            >
                <h1 ref={measuredRef} style={{ height: '100%', width: '100%' }}>
                    Hello, world
                </h1>
            </ResizableBox>
            <h2>
                The above header is {Math.round(height)}px tall{' '}
                {Math.round(width)}px width
            </h2>
        </>
    );
};

export default TestDetectDomNodeChange;
