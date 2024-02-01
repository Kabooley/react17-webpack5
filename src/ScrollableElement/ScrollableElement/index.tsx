/***************************************************************************
 * `ScrollableElement` let the children component to be scrollable.
 *
 * Prerequisities:
 * - Requires `./styles.css`
 *
 * Expecting user operation:
 * - Drag and drop horizontal/vertical scrollbar's thumb.
 * - Mouse wheel on scrollable element.
 *
 * What this component provides:
 * - Enable passed children to be scrollable horizontally/vertically by mouse wheel or dnd scrollbar's thumb.
 * - Disable standard scrollbar.
 * - Custom style on scrollbar.
 * - Selectable horizontal/vertical to scrollable.
 *
 *
 * TODO:
 * - thumbをつかんでスクロールさせるときにマウスの動きよりスクロールが遅い（移動量の反映が少ない）ことの改善。
 * - scrollHeightとheightが同値の時は非表示にするという機能をつける
 * - 要修正：scrollTopを0より大きい値にしたまま親コンテナが広がると、スクロールする余地がない状態になるはずがコンテンツが上にスクロールされたままの状態になってしまう
 *
 * NOTE:
 * - div.scrollable-element__scrollableとchildrenは完全に一致するように(座標、高さ、幅)！
 * **************************************************************************/
import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

interface iProps {
    // Parent's width
    width: number;
    // Parent's height
    height: number;
    // Anything that lets know that the chilren container has been resized
    onChildrenResizeEvent: any;
    // Anything that lets know that the parent container has been resized
    onParentResizeEvent: any;
    // Wrapped components
    children: any;
    // Optional function fires when onmousedown on scrollbar thumb
    onDragStart?: () => void;
    // Optional function fires when onmouseup
    onDragEnd?: () => void;
    // Set true if you wanna disable horizontal scrollbar.
    disableHorizontalScrollbar?: boolean;
    // Set true if you wanna disable vertical scrollbar.
    disableVerticalScrollbar?: boolean;
    // Optional styles of scrollbars
    optionalStyles?: {
        verticalScrollbarThumbWidth?: number;
        horizontalScrollbarThumbHeight?: number;
    };
}

const defaultOptionalStyles = {
    verticalScrollbarThumbWidth: 3,
    horizontalScrollbarThumbHeight: 3,
};

/******************************************************************
 * 参考:
 * https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight
 * ****************************************************************/
const ScrollableElement: React.FC<iProps> = ({
    width,
    height,
    onChildrenResizeEvent,
    onParentResizeEvent,
    disableHorizontalScrollbar = false,
    disableVerticalScrollbar = false,
    onDragStart,
    onDragEnd,
    optionalStyles = {
        verticalScrollbarThumbWidth:
            defaultOptionalStyles.verticalScrollbarThumbWidth,
        horizontalScrollbarThumbHeight:
            defaultOptionalStyles.horizontalScrollbarThumbHeight,
    },
    children,
}) => {
    const [scrollWidth, setScrollWidth] = useState<number>(0);
    const [scrollHeight, setScrollHeight] = useState<number>(0);
    const [scrollTop, setScrollTop] = useState<number>(0);
    const [scrollLeft, setScrollLeft] = useState<number>(0);
    const [clientX, setClientX] = useState<number>(0);
    const [clientY, setClientY] = useState<number>(0);
    const [dragging, setDragging] = useState<'v' | 'h' | 'none'>('none');
    const [hoveringOnContainer, setHoveringOnContainer] =
        useState<boolean>(false);
    const refScrollableElement = useRef<HTMLDivElement>(null);

    /***
     *  Reflect `div.scrollable-elelement__scrollable`'s scroll status to state.
     * */
    useEffect(() => {
        let _width = width;
        let _height = height;
        let _scrollTop = 0;
        let _scrollLeft = 0;
        let _scrollWidth = 0;
        let _scrollHeight = 0;

        if (
            refScrollableElement.current !== undefined &&
            refScrollableElement.current !== null
        ) {
            _scrollTop = refScrollableElement.current.scrollTop;
            _scrollLeft = refScrollableElement.current.scrollLeft;
            _scrollWidth = refScrollableElement.current.scrollWidth;
            _scrollHeight = refScrollableElement.current.scrollHeight;
        }
        if (_width < 0) {
            _width = 0;
        }
        if (_scrollLeft + _width > _scrollWidth) {
            _scrollLeft = scrollWidth - width;
        }
        if (_scrollLeft < 0) {
            _scrollLeft = 0;
        }
        if (_height < 0) {
            _height = 0;
        }
        if (_scrollTop + _height > _scrollHeight) {
            _scrollTop = _scrollHeight - _height;
        }
        if (_scrollTop < 0) {
            _scrollTop = 0;
        }

        setScrollTop(_scrollTop);
        setScrollLeft(_scrollLeft);
        setScrollWidth(_scrollWidth);
        setScrollHeight(_scrollHeight);
    }, []);

    /***
     * Always fix scrollTop and scrollLeft in case parent resized.
     *
     * On resized horiozntally:
     * Get diff of
     * refScrollableElement.current.getBoundingClientRect().width
     * and parent width and add it to scrollLeft.
     *
     *
     **/
    useEffect(() => {
        if (
            refScrollableElement.current !== undefined &&
            refScrollableElement.current !== null
        ) {
            let _width = width;
            let _height = height;
            let _scrollTop = scrollTop;
            let _scrollLeft = scrollLeft;
            let _scrollWidth = scrollWidth;
            let _scrollHeight = scrollHeight;

            if (_width < 0) {
                _width = 0;
            }
            if (_scrollLeft + _width > _scrollWidth) {
                _scrollLeft = scrollWidth - width;
            }
            if (_scrollLeft < 0) {
                _scrollLeft = 0;
            }
            if (_height < 0) {
                _height = 0;
            }
            if (_scrollTop + _height > _scrollHeight) {
                _scrollTop = _scrollHeight - _height;
            }
            if (_scrollTop < 0) {
                _scrollTop = 0;
            }

            setScrollTop(_scrollTop);
            setScrollLeft(_scrollLeft);
            setScrollWidth(_scrollWidth);
            setScrollHeight(_scrollHeight);
        }
    }, [onParentResizeEvent]);

    /***
     * Update scrollWidth, scrollHeight in case children has been resized.
     *
     * たとえばchildrenがui要素で動的にその子要素liが増減し、
     * childrenの幅高さが変わる状況に対応するための副作用。
     **/
    useEffect(() => {
        console.log(
            '[ScrollableElement] --- on did update onChildrenResizeEvent ---'
        );

        if (
            refScrollableElement.current !== undefined &&
            refScrollableElement.current !== null
        ) {
            const _scrollWidth = refScrollableElement.current.scrollWidth;
            const _scrollHeight = refScrollableElement.current.scrollHeight;

            console.log(`scrollHeight: ${scrollHeight}`);
            console.log(`scrollWidth: ${scrollWidth}`);

            if (scrollHeight !== _scrollHeight) {
                // DEBUG:
                console.log(
                    `[ScrollableElement] update scrollHeight ${scrollHeight} --> ${_scrollHeight}`
                );
                console.log(`scrollTop: ${scrollTop}`);
                setScrollHeight(_scrollHeight);
            }
            if (scrollWidth !== _scrollWidth) {
                // DEBUG:
                console.log(
                    `[ScrollableElement] update scrollHeight ${scrollWidth} --> ${_scrollWidth}`
                );
                console.log(`scrollLeft: ${scrollLeft}`);
                setScrollWidth(_scrollWidth);
            }
        }
    }, [onChildrenResizeEvent]);

    /***
     * Always atattch anew event listener callbacks
     * so that the event listener has access to the refleshed reactives
     * while it is dragging scrollbar thumb.
     * */
    useEffect(() => {
        if (dragging !== 'none') {
            // // DEBUG:
            // console.log("[ScrollableElement] --- re atattch listeners ---");

            document.addEventListener('mousemove', onMouseMove, false);
            document.addEventListener('mouseup', onMouseUp, false);
            document.onselectstart = function () {
                return false;
            };
        }

        () => {
            // // DEBUG:
            // console.log("[ScrollableElement] --- detattch listeners ---");

            document.removeEventListener('mouseup', onMouseUp, false);
            document.removeEventListener('mousemove', onMouseMove, false);
            document.onselectstart = null;
        };
    }, [dragging]);

    /**********************************************
     * EVENT HANDLER
     * *******************************************/

    /***
     * Reflect UI operation by use to `div.scrollable-element_scrollable`'s scrollTop and scrollLeft.
     * Dragging scrollbar's thumb event, mouse wheel move event are led to this handler.
     *
     * @param {number} verticalMoveAmount -Vertical travel amount to update this.scrollTop.
     *  scrollable element will scroll up if verticalMoveAmount value is more than 0.
     * @param {number} horizontalMoveAmount - Horizontal travel amount to update this.scrollleft.
     *  scrollable element will scroll left if horizontalMoveAmont value is more than 0.
     *
     *  Reflecting will disabled
     *  if props `disableVerticalScrollbar`, `disableHorizontalScrollbar` are true.
     ***/
    const _onScroll = (
        verticalMoveAmount: number,
        horizontalMoveAmount: number
    ) => {
        if (
            refScrollableElement.current === undefined ||
            refScrollableElement.current === null
        )
            return;
        if (disableVerticalScrollbar && disableHorizontalScrollbar) return;

        // // DEBUG:
        // console.log("[ScrollableElement] --- on Scroll ---");

        if (!disableHorizontalScrollbar) {
            let _scrollLeft = scrollLeft + horizontalMoveAmount;
            const maximumScrollLeft =
                refScrollableElement.current.scrollWidth - width;
            if (_scrollLeft < 0) _scrollLeft = 0;
            if (_scrollLeft > maximumScrollLeft)
                _scrollLeft = maximumScrollLeft;
            // // DEBUG:
            // console.log(`_scrollLeft: ${_scrollLeft}`);
            setScrollLeft(_scrollLeft);
        }
        if (!disableVerticalScrollbar) {
            let _scrollTop = scrollTop + verticalMoveAmount;
            const maximumScrollTop =
                refScrollableElement.current.scrollHeight - height;
            if (_scrollTop < 0) _scrollTop = 0;
            if (_scrollTop > maximumScrollTop) _scrollTop = maximumScrollTop;
            // // DEBUG:
            // console.log(`_scrollTop: ${_scrollTop}`);
            setScrollTop(_scrollTop);
        }
    };

    /***
     * `onwheel` event:
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event
     *
     * 移動量は`e.deltaX|Y`で取得する
     *
     * 例）deltaY:
     *  マウスリールを下に転がす(scrollTopがインクリメント）と正の値に、
     *  マウスリールを上に転がす（scrollTopがデクリメント）と負の値になる
     *
     ***/
    const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        // DEBUG:
        // console.log("[ScrollableElement] --- on Wheel ---");
        _onScroll(e.deltaY, e.deltaX);
    };

    /***
     * On start dragging scrollbar's thumb.
     * Set `dragging` state true so that psuedo dnd methods activate.
     ***/
    const onMouseDown = (
        e: React.MouseEvent<HTMLDivElement>,
        isHorizontal: boolean
    ) => {
        e.stopPropagation();
        e.preventDefault();

        // // DEBUG:
        // console.log("on mouse down");
        setDragging(isHorizontal ? 'h' : 'v');
        setClientX(e.clientX);
        setClientY(e.clientY);
        if (typeof onDragStart === 'function') {
            onDragStart();
        }
    };

    /***
     *
     ***/
    const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        e.preventDefault();
        if (dragging === 'none') return;
        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousemove', onMouseMove, false);
        document.onselectstart = null;
        // // DEBUG:
        // console.log("on mouse up");
        setDragging('none');
        if (typeof onDragEnd === 'function') {
            onDragEnd();
        }
    };

    /***
     * Set `hoveringOnContainer` true if mouse pointer hovers on container.
     ***/
    const onMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setHoveringOnContainer(true);
    };

    /***
     * Set `hoveringOnContainer` false if mouse pointer hovers on container.
     ***/
    const onMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setHoveringOnContainer(false);
    };

    /***
     * メモ：
     * Vertical:
     * mouseを下げる: this.state.clientY - e.clientY 負の値
     *    マウスリールを下に転がすのと同じ
     *    scrollTopがインクリメントする
     * mouseを上げる: this.state.clientY - e.clientY 正の値
     *    マウスリールを上に転がすのと同じ
     *    scrollTopがデクリメントする
     *
     * this.state.scrollTopとthis.state.scrollLeftを更新すればよい
     **/
    const onMouseMove = (e: React.MouseEvent<Element>) => {
        e.stopPropagation();
        e.preventDefault();
        if (dragging === 'none') return;

        // // DEBUG:
        // console.log("on mouse move");

        const verticalTravelAmount = dragging === 'v' ? e.clientY - clientY : 0;
        const horizontalTravelAmount =
            dragging === 'h' ? e.clientX - clientX : 0;

        setClientX(e.clientX);
        setClientY(e.clientY);
        _onScroll(verticalTravelAmount, horizontalTravelAmount);
    };

    /*****************************************/

    /***
     * vertical thumbのtop座標を算出する。
     *
     * マウント時はscrollHeightがゼロなので、
     * `_rateHeightInScrollHeight`の算出のためにゼロで割る割り算を行ってしまう。
     * そのためNaNを返す可能性があるため最後にNaNでないかチェックする。
     * */
    const getTopOfVerticalScrollbarThumb = () => {
        const _rateHeightInScrollHeight = height / scrollHeight;
        const thumbHeight = height * _rateHeightInScrollHeight;
        const maximumVerticalThumbTop =
            height * (1 - _rateHeightInScrollHeight);
        const rateOfScrollTopInScrollRange =
            scrollTop / (scrollHeight - height);
        let verticalThumbTop =
            rateOfScrollTopInScrollRange * (height - thumbHeight);
        if (verticalThumbTop < 0) verticalThumbTop = 0;
        if (verticalThumbTop > maximumVerticalThumbTop)
            verticalThumbTop = maximumVerticalThumbTop;

        if (Number.isNaN(verticalThumbTop)) return 0;

        return verticalThumbTop;
    };

    /****
     * horizontal thumbのleft座標を算出する。
     *
     * マウント時はscrollLeftがゼロなので、
     * `_rateWidthInScrollWidth`の算出のためにゼロで割る割り算を行ってしまう。
     * そのためNaNを返す可能性があるため最後にNaNでないかチェックする。
     * */
    const getLeftOfHorizontalScrollbarThumb = () => {
        const _rateWidthInScrollWidth = width / scrollWidth;
        const thumbWidth = width * _rateWidthInScrollWidth;
        const maximumHorizontalThumbLeft =
            width * (1 - _rateWidthInScrollWidth);
        const rateOfScrollLeftInScrollRange =
            scrollLeft / (scrollWidth - width);
        let horizontalThumbWidth =
            rateOfScrollLeftInScrollRange * (width - thumbWidth);
        if (horizontalThumbWidth < 0) horizontalThumbWidth = 0;
        if (horizontalThumbWidth > maximumHorizontalThumbLeft)
            horizontalThumbWidth = maximumHorizontalThumbLeft;

        if (Number.isNaN(horizontalThumbWidth)) return 0;

        return horizontalThumbWidth;
    };

    //   DEBUG:
    const logger = (where: string) => {
        console.log(`[ScrollableElement] --- ${where} ---`);
        console.log(`width: ${width}`);
        console.log(`height: ${height}`);
        console.log(`scrollHeight: ${scrollHeight}`);
        console.log(`scrollWidth: ${scrollWidth}`);
        console.log(`scrollTop: ${scrollTop}`);
        console.log(`scrollLeft: ${scrollLeft}`);
        console.log(`clientX: ${clientX}`);
        console.log(`clientY: ${clientY}`);
        console.log('------ ');
    };

    /**********************************************
     *   RENDERER
     * ********************************************/

    const renderScrollbarHorizontal = (
        trackStyle: React.CSSProperties,
        thumbStyle: React.CSSProperties
    ) => {
        let _className = ['scroll-thumb'];
        if (hoveringOnContainer) {
            _className.push('visible');
        } else {
            _className.push('invisible fade');
        }
        const className = _className.join(' ');

        let showScrollbar = !disableHorizontalScrollbar;
        if (width >= scrollWidth) {
            showScrollbar = false;
        }

        return showScrollbar ? (
            <div className="scroll-track" style={trackStyle}>
                <div
                    className={className}
                    style={thumbStyle}
                    onMouseDown={(e) => onMouseDown(e, true)}
                ></div>
            </div>
        ) : (
            <></>
        );
    };

    const renderScrollbarVertical = (
        trackStyle: React.CSSProperties,
        thumbStyle: React.CSSProperties
    ) => {
        let _className = ['scroll-thumb'];
        if (hoveringOnContainer) {
            _className.push('visible');
        } else {
            _className.push('invisible fade');
        }
        const className = _className.join(' ');

        let showScrollbar = !disableVerticalScrollbar;
        if (height >= scrollHeight) {
            showScrollbar = false;
        }

        return showScrollbar ? (
            <div className="scroll-track" style={trackStyle}>
                <div
                    className={className}
                    style={thumbStyle}
                    onMouseDown={(e) => onMouseDown(e, false)}
                ></div>
            </div>
        ) : (
            <></>
        );
    };

    /****************************************************************
     * Calcuration on rendering
     ****************************************************************/
    /****************************************************************
     * NOTE:
     *
     * - `div.scrollable-element__container`: `div.scrollable-element__scrollable`を
     *   スクロール可能にするために`overflow: hidden`と`width`, `height`を付与する。
     *
     * - `div.scrollable-element__scrollable`: `children`を完全にラップするので、
     *   `childre`の`scrollWidth`や`scrollTop`は
     *   この`div.scrollable-element__scrollable`のDOMから取得できる
     *
     ****************************************************************/

    const horizontalThumbWidth =
        scrollWidth === 0 ? 0 : width * (width / scrollWidth);
    const verticalThumbHeight =
        scrollHeight === 0 ? 0 : height * (height / scrollHeight);

    const containerStyle: React.CSSProperties = {
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
    };

    const scrollableStyle: React.CSSProperties = {
        position: 'absolute',
        top: scrollTop ? `-${scrollTop}px` : '0px',
        left: scrollLeft ? `-${scrollLeft}px` : '0px',
    };

    const horizontalScrollbarTrackStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: `${optionalStyles.horizontalScrollbarThumbHeight}px`,
        background: 'transparent',
    };

    const horizontalScrollbarThumbStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: 0,
        left: getLeftOfHorizontalScrollbarThumb(),
        width: `${horizontalThumbWidth}px`,
        height: '100%',
    };

    const verticalScrollbarTrackStyle: React.CSSProperties = {
        position: 'absolute',
        top: 0,
        right: 0,
        width: `${optionalStyles.verticalScrollbarThumbWidth}px`,
        height: '100%',
        background: 'transparent',
    };

    const verticalScrollbarThumbStyle: React.CSSProperties = {
        position: 'absolute',
        top: getTopOfVerticalScrollbarThumb(),
        right: 0,
        height: `${verticalThumbHeight}px`,
        width: '100%',
    };

    // DEBUG:
    // console.log("[ScrollableElement] --- rerebder ---");

    return (
        <div
            className="scrollable-element__container"
            style={containerStyle}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                className="scrollable-element__scrollable"
                style={scrollableStyle}
                onWheel={onWheel}
                ref={refScrollableElement}
            >
                {children}
            </div>
            {renderScrollbarHorizontal(
                horizontalScrollbarTrackStyle,
                horizontalScrollbarThumbStyle
            )}
            {renderScrollbarVertical(
                verticalScrollbarTrackStyle,
                verticalScrollbarThumbStyle
            )}
        </div>
    );
};

export default ScrollableElement;
