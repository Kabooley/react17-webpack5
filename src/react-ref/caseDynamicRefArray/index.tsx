import React, { useState, useRef, useEffect } from "react";
import Tabs from "./Tabs";
import SimpleSlider from "../SimpleSlider";
import { ResizableBox } from "react-resizable";
import type { ResizeCallbackData } from "react-resizable";

const defaultWidth = 300;

const ResizableScrollableTabs = () => {
  const [width, setWidth] = useState<number>(defaultWidth);
  // SimpleSliderのsliderが今どこにあるのか
  const [position, setPosition] = useState<number>(0);
  // TabsのDOMRect.width
  const [scrollableWidth, setScrollableWidth] = useState<number>(defaultWidth);
  // TabsのElement.scrollWidth
  const [scrollWidth, setScrollWidth] = useState<number>(defaultWidth);
  // Tabsのdiv.tabの数
  const [numberOfTabs, setNumberOfTabs] = useState<number>(10);
  // TabsのDOMを指す
  const refTabsArea = useRef<{
    getTabsAreaRect: () => DOMRect | undefined;
    getScrollWidth: () => number;
  }>(null);

  useEffect(() => {
    console.log("did update");
  });

  // Get dom width after mount
  useEffect(() => {
    if (refTabsArea.current) {
      setScrollableWidth(refTabsArea.current.getTabsAreaRect().width);
      setScrollWidth(refTabsArea.current.getScrollWidth());
    }
  }, []);

  // Handle events which causes changing scrollWidth, scrollableWidth
  useEffect(() => {
    if (refTabsArea.current) {
      setScrollableWidth(refTabsArea.current.getTabsAreaRect().width);
      setScrollWidth(refTabsArea.current.getScrollWidth());
    }
  }, [width, numberOfTabs]);

  const onEditorSecResize: (
    e: React.SyntheticEvent,
    data: ResizeCallbackData
  ) => any = (event, { node, size, handle }) => {
    setWidth(size.width);
  };

  const incrementTab = (flag: boolean) => {
    const isMinus = numberOfTabs - 1 < 0 ? true : false;
    if (!flag && isMinus) return;
    else if (!flag) setNumberOfTabs(numberOfTabs - 1);
    else setNumberOfTabs(numberOfTabs + 1);
  };

  // TabsのDOMRect.width/Element.scrollWidthの割合
  const ratioOfScrollableWidth = scrollableWidth / scrollWidth;
  // sliderWidthはTabsのDOMRect.widthに先の割合をかけたもの
  const sliderWidth = scrollableWidth * ratioOfScrollableWidth;
  // SimpleSliderのスライダを動かした結果、Tabsがスクロールする距離
  const scrollLeft = position * (scrollWidth - scrollableWidth);
  const stylesOfContainer = {
    width: width,
    height: 10,
    bottom: 0,
    left: 0
  };

  return (
    <>
      <ResizableBox
        width={width}
        height={Infinity}
        minConstraints={[200, Infinity]}
        maxConstraints={[800, Infinity]}
        onResize={onEditorSecResize}
        resizeHandles={["e"]}
        handle={(h, ref) => (
          <span className={`custom-handle custom-handle-${h}`} ref={ref} />
        )}
      >
        <div
          className="scrollable-resizable-tabs"
          style={{ position: "relative" }}
        >
          <Tabs
            _ref={refTabsArea}
            numberOfTabs={numberOfTabs}
            scrollLeft={scrollLeft}
          />
          <SimpleSlider
            sliderWidth={sliderWidth}
            setCurrentPosition={setPosition}
            stylesOfContainer={stylesOfContainer}
          />
        </div>
      </ResizableBox>
      <button onClick={() => incrementTab(true)}>increment tab</button>
      <button onClick={() => incrementTab(false)}>decrement tab</button>
    </>
  );
};

export default ResizableScrollableTabs;
