import React, { useEffect } from "react";

type iMouseMoveEventCB = (e: React.MouseEvent<HTMLDivElement>) => void;

const useMouseMoveOnWindow = (handler: iMouseMoveEventCB) => {
  useEffect(() => {
    document.addEventListener("mousemove", handler);

    return () => {
      document.removeEventListener("mousemove", handler);
    };
  }, [handler]);
};
