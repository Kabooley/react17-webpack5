import React, { useState, useEffect, useRef } from "react";

interface iProps {
  setCurrentPosition: (pos: number) => void;
  stylesOfContainer: iStylesOfContainer;
  sliderWidth: number;
}

interface iDOMRectProps {
  bottom: number;
  height: number;
  width: number;
  x: number;
  y: number;
  top: number;
  right: number;
  backgroundColor?: string;
}

interface iStylesOfContainer {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  width: number;
  height: number;
}

const SimpleSlider = ({
  setCurrentPosition,
  stylesOfContainer,
  sliderWidth
}: iProps) => {
  // It is true since onMouseDown on div.slider until onMouseUp.
  const [dragging, setdragging] = useState<boolean>(false);
  // Ratio of div.slider coordinate x on div.simple-slider movable range
  const [sliderCoordXRatio, setSliderCoordXRatio] = useState<number>(0);

  // Keep coordinates and rect info on MouseDown.
  const [onMouseDownCoord, setOnMouseDownCoord] = useState<{
    sliderRect: iDOMRectProps | undefined;
    clientX: number;
    clientY: number;
  }>({
    sliderRect: undefined,
    clientX: 0,
    clientY: 0
  });
  // Points div.slider
  const refSlider = useRef<HTMLDivElement>(null);
  // Points div.simple-slider DOM
  const refContainer = useRef<HTMLDivElement>(null);
  // Contains onMouseMove event on div.slider
  const [mouseevent, setMouseEvent] = useState<React.MouseEvent<
    HTMLDivElement
  > | null>(null);
  const containerWidth = stylesOfContainer.width;

  useEffect(() => {
    let raf: number;
    if (dragging && mouseevent) {
      console.log("[SimpleSlider] animation");
      raf = requestAnimationFrame(() =>
        // eslint-disable-next-line no-use-before-define
        slidesSlider(mouseevent)
      );
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [dragging, mouseevent]);

  const onWindowMouseUp = (e: any) => {
    console.log("MOUSE UP on OUTSIDE");
    // eslint-disable-next-line no-use-before-define
    handleMouseUp(e);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!refSlider.current || !refContainer.current) return;

    const rectSlider = refSlider.current.getBoundingClientRect();

    window.addEventListener("mouseup", onWindowMouseUp);
    // eslint-disable-next-line no-use-before-define
    window.addEventListener("mousemove", handleMouseMove);

    // DEBUG:
    console.log("MOUSE DOWN");

    setdragging(true);
    setOnMouseDownCoord({
      // onmousedownの時点のsliderのrectを切り取らないといけないので
      // そのままrectSliderを渡すわけにはいかない(参照だから)
      sliderRect: {
        bottom: rectSlider.bottom,
        height: rectSlider.height,
        width: rectSlider.width,
        x: rectSlider.x,
        y: rectSlider.y,
        top: rectSlider.top,
        right: rectSlider.right
      },
      // pointer client
      clientX: e.clientX,
      clientY: e.clientY
    });
  };

  /***
   * Disable `mouseup` event listener of Window,
   * Set state `dragging` false.
   * */

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    console.log("MOUSE UP");
    window.removeEventListener("mouseup", onWindowMouseUp);
    // eslint-disable-next-line no-use-before-define
    window.removeEventListener("mousemove", handleMouseMove);
    setdragging(false);
  };

  const slidesSlider = (e: React.MouseEvent<HTMLDivElement>) => {
    if (
      !dragging ||
      !refContainer.current ||
      onMouseDownCoord.sliderRect === undefined
    )
      return;

    console.log("MOUSE MOVE");

    const containerRect = refContainer.current.getBoundingClientRect();

    // もしもe.clientXがonMouseDown時の座標より...
    if (e.clientX - onMouseDownCoord.clientX > 0) {
      // 右に移動していたら:
      console.log(`TO RIGHT ${e.clientX - onMouseDownCoord.clientX}`);

      // mouseが移動した距離。
      const travelDistance = e.clientX - onMouseDownCoord.clientX;
      // mousemoveした後のsliderのx座標
      const updatedSliderCoordX =
        onMouseDownCoord.sliderRect.x + travelDistance;

      const updatedSliderRightCoordX = updatedSliderCoordX + sliderWidth;
      // Prevent sliding slider over the container edge.
      if (updatedSliderRightCoordX > containerRect.width) {
        console.log(
          `sliding over: ${updatedSliderRightCoordX - containerRect.width}`
        );
        setSliderCoordXRatio(1);
        setCurrentPosition(1);
        return;
      }

      const ratio =
        updatedSliderCoordX /
        (containerRect.width - onMouseDownCoord.sliderRect.width);
      setSliderCoordXRatio(ratio);
      setCurrentPosition(ratio);
    } else {
      // 左に移動していたら:
      console.log(`TO LEFT ${e.clientX - onMouseDownCoord.clientX}`);

      // onMouseDown時にdiv.sliderがいた位置からマウスが移動した距離だけ左に移動する
      // onMouseDown時にdiv.sliderがいた位置：onMouseDownCoordX.sliderRect.x - rectContainer.x
      // マウスが移動した距離：onMouseDownCoord.x - e.clientX
      //
      // Prettierで数式の（）が消されるので。
      const travelDistance = onMouseDownCoord.clientX - e.clientX;
      const updatedSliderCoordX =
        onMouseDownCoord.sliderRect.x - containerRect.x - travelDistance;

      // Prevent sliding slider over the container.
      if (0 > updatedSliderCoordX) {
        console.log(`sliding over: ${containerRect.x}`);
        setSliderCoordXRatio(0);
        setCurrentPosition(0);
        return;
      }

      const ratio =
        updatedSliderCoordX /
        (containerRect.width - onMouseDownCoord.sliderRect.width);
      setSliderCoordXRatio(ratio);
      setCurrentPosition(ratio);
    }
  };

  const handleMouseEnter = () => {};
  const handleMouseLeave = () => {};

  // set mousemoveevent to state to trigger modifying DOM on requestAnimationFrame().
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouseEvent(e);
  };

  const subtractionWidth = containerWidth - sliderWidth;
  const latestSliderCoordX = sliderCoordXRatio * subtractionWidth;

  return (
    <>
      <div
        className="simple-slider"
        ref={refContainer}
        style={{
          width: stylesOfContainer.width,
          height: stylesOfContainer.height,
          backgroundColor: "#7f8ac4",
          position: "absolute",
          left: stylesOfContainer.left,
          bottom: stylesOfContainer.bottom
        }}
      >
        <div
          className="slider"
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          style={{
            position: "absolute",
            top: "0px",
            // left: sliderCoordX + "px",
            left: latestSliderCoordX + "px",
            width: `${sliderWidth}px`,
            height: "100%",
            backgroundColor: "#3b4680"
          }}
          ref={refSlider}
        ></div>
      </div>
    </>
  );
};

export default SimpleSlider;
