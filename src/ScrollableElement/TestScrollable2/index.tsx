import React, { useState, useRef } from 'react';
import { Resizable } from 'react-resizable';
import type { ResizeCallbackData } from 'react-resizable';
import ScrollableElement from '../ScrollableElement';
import '../ScrollableElement/styles.css';

const minConstraints = 100;
const maxConstraints = 700;

// ひとまず垂直方向にリサイズ可能なコンテナで試す
/***
 * TODO: mount後にサイズが変化する(ScrollableElementからみて)children要素に対応させる
 * */
const Article = () => {
    const [width, setWidth] = useState(300);
    const [height, setHeight] = useState(400);
    const [childWidth, setChildWidth] = useState(600);
    const [childHeight, setChildHeight] = useState(800);
    const refScrollableContent = useRef<HTMLDivElement>(null);

    const onResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
        const { node, size, handle } = data;
        setHeight(size.height);
        // setWidth(size.width);
        // DEBUG:
        console.log('onresize resizable');
    };

    // Optionally
    const disablePointerEvent = () => {
        console.log('Disabled pointer events on iframe element');
    };

    // Optionally
    const enablePointerEvent = () => {
        console.log('Enabled pointer events on iframe element');
    };

    const onClickExpandWidth = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setChildWidth(childWidth + 100);
    };
    const onClickShrinkWidth = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const _width = childWidth - 100 < 0 ? 0 : childWidth - 100;
        setChildWidth(_width);
    };
    const onClickExpandHeight = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setChildHeight(childHeight + 100);
    };
    const onClickShrinkHeight = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        const _height = childHeight - 100 < 0 ? 0 : childHeight - 100;
        setChildHeight(_height);
    };

    const buttonStyle = {
        marginTop: '16px',
        marginLeft: '16px',
    };

    return (
        <div>
            <button onClick={onClickExpandWidth} style={buttonStyle}>
                expand width
            </button>
            <button onClick={onClickShrinkWidth} style={buttonStyle}>
                shrink width
            </button>
            <button onClick={onClickExpandHeight} style={buttonStyle}>
                expand height
            </button>
            <button onClick={onClickShrinkHeight} style={buttonStyle}>
                shrink height
            </button>
            <Resizable
                className="custom-box box"
                width={width}
                height={height}
                handle={(h, ref) => (
                    <span
                        className={`custom-handle custom-handle-${h}`}
                        ref={ref}
                    />
                )}
                resizeHandles={['s']}
                axis={'y'}
                minConstraints={[minConstraints, minConstraints]}
                maxConstraints={[maxConstraints, maxConstraints]}
                onResize={onResize}
            >
                <div
                    className="article-container"
                    style={{
                        width: width,
                        height: height,
                        margin: '40px',
                        background: '#33f9ff',
                        border: '1px solid  ##444',
                    }}
                >
                    <ScrollableElement
                        height={height}
                        width={width}
                        disableHorizontalScrollbar={false}
                        disableVerticalScrollbar={false}
                        optionalStyles={{
                            verticalScrollbarThumbWidth: 10,
                            horizontalScrollbarThumbHeight: 10,
                        }}
                        onChildrenResizeEvent={[childHeight, childWidth]}
                        onParentResizeEvent={[width, height]}
                        onDragStart={disablePointerEvent}
                        onDragEnd={enablePointerEvent}
                    >
                        <div
                            className="scrollable-content"
                            ref={refScrollableContent}
                            style={{
                                border: '4px solid red',
                                width: `${childWidth}px`,
                                height: `${childHeight}px`,
                                overflow: 'hidden',
                            }}
                        >
                            <span style={{ color: 'black' }}>
                                Lorem ipsum dolor sit amet, consectetur
                                adipiscing elit. Maecenas placerat ac mauris
                                convallis tincidunt. Sed quis sem libero. Sed
                                viverra malesuada nibh et placerat. Nam id nisl
                                at tortor pellentesque consectetur. Etiam
                                finibus justo et leo interdum congue et vel
                                urna. Aenean et neque odio. Maecenas id augue
                                pharetra, sollicitudin neque at, facilisis diam.
                                Nunc convallis massa in egestas convallis.
                                Pellentesque habitant morbi tristique senectus
                                et netus et malesuada fames ac turpis egestas.
                                Class aptent taciti sociosqu ad litora torquent
                                per conubia nostra, per inceptos himenaeos.
                                Maecenas tellus elit, fringilla cursus nisi non,
                                dignissim scelerisque lacus. Etiam eu suscipit
                                massa. In hac habitasse platea dictumst. Morbi
                                fermentum mauris vitae egestas imperdiet. Duis
                                dictum eleifend congue. Nullam vitae tempor
                                enim. Suspendisse mi purus, lacinia in
                                ullamcorper ac, sagittis in velit. Fusce massa
                                sem, lobortis id elit mollis, consectetur
                                aliquet leo. Vestibulum ullamcorper in libero
                                nec sodales. Pellentesque ut risus id nunc
                                ullamcorper porta non eget elit. Integer iaculis
                                lacus ligula, in ultrices quam laoreet eget.
                                Phasellus gravida erat vitae augue commodo, ut
                                bibendum nisi rhoncus. Aenean non quam
                                condimentum, condimentum ex non, mollis lorem.
                                Pellentesque sed viverra leo, eu sollicitudin
                                libero. Maecenas venenatis eu augue non
                                scelerisque. Vivamus vestibulum ante porta nisl
                                aliquam posuere. Pellentesque habitant morbi
                                tristique senectus et netus et malesuada fames
                                ac turpis egestas. Vivamus lectus erat, pharetra
                                vitae arcu vel, pulvinar egestas lectus. Proin
                                ut eros in velit pellentesque tempus. Nunc
                                hendrerit lacus vel sapien accumsan molestie.
                                Proin iaculis id elit vel consectetur. Fusce
                                sagittis nulla quis quam facilisis, sit amet
                                elementum libero convallis. Nullam laoreet ante
                                dolor. Fusce sit amet volutpat massa.
                                Suspendisse id ligula libero. Suspendisse
                                fermentum velit vel suscipit volutpat. Mauris
                                vitae lacinia orci, et tempus velit. Aenean sed
                                lacus sem. Nam ac dolor rhoncus, cursus dolor
                                eu, consequat odio. In hac habitasse platea
                                dictumst. Duis tincidunt nunc ac fermentum
                                lobortis. Vivamus a posuere velit. Nulla rhoncus
                                augue et neque varius, a condimentum purus
                                iaculis. Etiam eget augue sed risus fringilla
                                suscipit quis quis risus. Nullam bibendum, quam
                                at consectetur mollis, leo urna bibendum massa,
                                a finibus risus turpis non arcu. Phasellus non
                                magna vitae metus lobortis bibendum eget eu
                                sapien. Nunc fermentum accumsan orci quis
                                rhoncus. Proin faucibus, enim id porta
                                sollicitudin, purus mauris egestas enim, sed
                                egestas nisi dolor id neque. Cras auctor viverra
                                urna, ac feugiat lorem pellentesque eget. Cras
                                luctus neque leo, vel placerat odio efficitur
                                eu. Curabitur sagittis bibendum tempus. Mauris
                                tempor pellentesque orci vehicula volutpat.
                                Nulla sed fermentum odio, sed semper quam. Lorem
                                ipsum dolor sit amet, consectetur adipiscing
                                elit. Maecenas placerat ac mauris convallis
                                tincidunt. Sed quis sem libero. Sed viverra
                                malesuada nibh et placerat. Nam id nisl at
                                tortor pellentesque consectetur. Etiam finibus
                                justo et leo interdum congue et vel urna. Aenean
                                et neque odio. Maecenas id augue pharetra,
                                sollicitudin neque at, facilisis diam. Nunc
                                convallis massa in egestas convallis.
                                Pellentesque habitant morbi tristique senectus
                                et netus et malesuada fames ac turpis egestas.
                                Class aptent taciti sociosqu ad litora torquent
                                per conubia nostra, per inceptos himenaeos.
                                Maecenas tellus elit, fringilla cursus nisi non,
                                dignissim scelerisque lacus. Etiam eu suscipit
                                massa. In hac habitasse platea dictumst. Morbi
                                fermentum mauris vitae egestas imperdiet. Duis
                                dictum eleifend congue. Nullam vitae tempor
                                enim. Suspendisse mi purus, lacinia in
                                ullamcorper ac, sagittis in velit. Fusce massa
                                sem, lobortis id elit mollis, consectetur
                                aliquet leo. Vestibulum ullamcorper in libero
                                nec sodales. Pellentesque ut risus id nunc
                                ullamcorper porta non eget elit. Integer iaculis
                                lacus ligula, in ultrices quam laoreet eget.
                                Phasellus gravida erat vitae augue commodo, ut
                                bibendum nisi rhoncus. Aenean non quam
                                condimentum, condimentum ex non, mollis lorem.
                                Pellentesque sed viverra leo, eu sollicitudin
                                libero. Maecenas venenatis eu augue non
                                scelerisque. Vivamus vestibulum ante porta nisl
                                aliquam posuere. Pellentesque habitant morbi
                                tristique senectus et netus et malesuada fames
                                ac turpis egestas. Vivamus lectus erat, pharetra
                                vitae arcu vel, pulvinar egestas lectus. Proin
                                ut eros in velit pellentesque tempus. Nunc
                                hendrerit lacus vel sapien accumsan molestie.
                                Proin iaculis id elit vel consectetur. Fusce
                                sagittis nulla quis quam facilisis, sit amet
                                elementum libero convallis. Nullam laoreet ante
                                dolor. Fusce sit amet volutpat massa.
                                Suspendisse id ligula libero. Suspendisse
                                fermentum velit vel suscipit volutpat. Mauris
                                vitae lacinia orci, et tempus velit. Aenean sed
                                lacus sem. Nam ac dolor rhoncus, cursus dolor
                                eu, consequat odio. In hac habitasse platea
                                dictumst. Duis tincidunt nunc ac fermentum
                                lobortis. Vivamus a posuere velit. Nulla rhoncus
                                augue et neque varius, a condimentum purus
                                iaculis. Etiam eget augue sed risus fringilla
                                suscipit quis quis risus. Nullam bibendum, quam
                                at consectetur mollis, leo urna bibendum massa,
                                a finibus risus turpis non arcu. Phasellus non
                                magna vitae metus lobortis bibendum eget eu
                                sapien. Nunc fermentum accumsan orci quis
                                rhoncus. Proin faucibus, enim id porta
                                sollicitudin, purus mauris egestas enim, sed
                                egestas nisi dolor id neque. Cras auctor viverra
                                urna, ac feugiat lorem pellentesque eget. Cras
                                luctus neque leo, vel placerat odio efficitur
                                eu. Curabitur sagittis bibendum tempus. Mauris
                                tempor pellentesque orci vehicula volutpat.
                                Nulla sed fermentum odio, sed semper quam.
                            </span>
                        </div>
                    </ScrollableElement>
                </div>
            </Resizable>
            <div
                className="logger"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    color: 'black',
                    fontSize: '22px',
                    marginBottom: '8px',
                }}
            >
                <span>parent's width: {width}</span>
                <span>parent's height: {height}</span>
                <span>children's width: {childWidth}</span>
                <span>children's height: {childHeight}</span>
            </div>
        </div>
    );
};

export default Article;
