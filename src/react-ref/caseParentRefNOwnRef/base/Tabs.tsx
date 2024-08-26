import React, { useRef, useState, useEffect } from "react";

// NOTE: 無理やり型を合わせている。
// 本来`child: Node`でclassNameというpropertyを持たないが、iJSXNode.classNameをoptionalにすることによって
// 回避している
interface iJSXNode extends Node {
  className?: string;
}

interface iProps {
  _ref: React.RefObject<HTMLDivElement>;
  numberOfTabs: number;
}

const stylesOfTabsArea: React.CSSProperties = {
  overflow: "hidden",
  width: "100%",
  height: "40px",
  backgroundColor: "#a7a9c1",
  display: "flex"
};

const stylesOfTab: React.CSSProperties = {
  minWidth: "100px",
  height: "40px",
  // backgroundColor: "#565879",
  border: "1px solid white"
};

// Tabsは自身でrefを持ち、選択中のタブのスタイルを変更するために自身のref、`_refTabs`を使っている
const Tabs = ({ _ref, numberOfTabs }: iProps) => {
  const [selected, setSelected] = useState<number>(1);
  const _refTabArea = useRef<HTMLDivElement>(null);
  const _refTabs = useRef<HTMLDivElement[]>([]);
  // const _refTabs = useRef(
  //   Array.from({ length: numberOfTabs }, (_, i) => i + 1).map(() =>
  //     React.createRef<HTMLDivElement>()
  //   )
  // );

  // _refTabs.currentのref配列の数をnumberOfTabsに一致するように再計算するための更新
  useEffect(() => {
    if (_refTabs.current) {
      _refTabs.current = _refTabs.current.slice(0, numberOfTabs);
    }
  }, []);

  // _refTabs.currentのref配列の数をnumberOfTabsに一致するように再計算するための更新
  useEffect(() => {
    if (_refTabs.current) {
      _refTabs.current = _refTabs.current.slice(0, numberOfTabs);
    }
  }, [numberOfTabs]);

  useEffect(() => {
    console.log(_refTabs.current);
  });

  const changeTab = (selectedTabNode: HTMLDivElement, index: number) => {
    // 一旦すべてのtabのclassNameを'tab'にする
    for (var i = 0; i < _refTabArea.current!.childNodes.length; i++) {
      var child: iJSXNode = _refTabArea.current!.childNodes[i];
      if (/tab/.test(child.className!)) {
        child.className = "tab";
      }
    }
    console.log("onchange");
    console.log(selectedTabNode);
    // 選択されたtabのみclassName='tab active'にする
    selectedTabNode.className = "tab active";
    setSelected(index);
  };

  return (
    <div
      className="tabs-area"
      ref={_refTabArea}
      // ref={_ref}
      style={stylesOfTabsArea}
    >
      {Array.from({ length: numberOfTabs }, (_, i) => i + 1).map((i, index) => (
        <div
          className={index === selected ? "tab active" : "tab"}
          key={index}
          style={stylesOfTab}
          ref={(node: HTMLDivElement) => (_refTabs.current[index] = node)}
          onClick={() => changeTab(_refTabs.current[index], index)}
        >
          <span>tab {i}</span>
        </div>
      ))}
    </div>
  );
};

export default Tabs;
