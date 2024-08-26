import React, { useState, useRef, useEffect } from "react";
import SimpleSlider from "./SimpleSlider";
import Tabs from "./Tabs";

const defaultSectionWidth = 300;

const ResizableTabs = () => {
  const [position, setPosition] = useState<number>(0);
  const [sectionWidth, setSectionWidth] = useState<number>(defaultSectionWidth);
  const [scrollableWidth, setScrollableWidth] = useState<number>(
    defaultSectionWidth
  );
  const [scrollWidth, setScrollWidth] = useState<number>(defaultSectionWidth);
  const refTabs = useRef<HTMLDivElement>(null);

  const ratioOfScrollableWidth = scrollableWidth / scrollWidth;
  const sliderWidth = scrollableWidth * ratioOfScrollableWidth;
  const scrollLeft = position * (scrollWidth - scrollableWidth);

  if (refTabs.current) {
    refTabs.current.scrollLeft = scrollLeft;
  }

  return (
    <div className="resizable-tabs">
      <Tabs ref={refTabs} scrollLeft={scrollLeft} />
      <SimpleSlider
        sliderWidth={sliderWidth}
        setCurrentPosition={setPosition}
        stylesOfContainer={{
          width: sectionWidth,
          height: 10,
          bottom: 0,
          left: 0
        }}
      />
    </div>
  );
};

export default ResizableTabs;
