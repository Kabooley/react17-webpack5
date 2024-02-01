import React, { useState, useLayoutEffect, useEffect } from "react";

/***
 * https://stackoverflow.com/a/19014495
 * */
function useWindowSize() {
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [height, setHeight] = useState<number>(window.innerHeight);
  useEffect(() => {
    function updateSize() {
      setWidth(window.innerWidth);
      setHeight(window.innerHeight);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return [width, height];
}

export default useWindowSize;
