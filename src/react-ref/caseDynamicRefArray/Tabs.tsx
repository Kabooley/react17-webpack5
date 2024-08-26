import React, { useRef, useState, useEffect, useImperativeHandle } from "react";

// NOTE: 無理やり型を合わせている。
// 本来`child: Node`でclassNameというpropertyを持たないが、iJSXNode.classNameをoptionalにすることによって
// 回避している
interface iJSXNode extends Node {
  className?: string;
}

interface iProps {
  _ref: React.RefObject<{
    getTabsAreaRect: () => DOMRect | undefined;
    getScrollWidth: () => number;
  }>;
  numberOfTabs: number;
  scrollLeft: number;
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
const Tabs = ({ _ref, numberOfTabs, scrollLeft }: iProps) => {
  const [selected, setSelected] = useState<number>(1);
  const _refTabArea = useRef<HTMLDivElement>(null);
  const _refTabs = useRef<HTMLDivElement[]>([]);

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

  // 水平方向スクロール処理
  useEffect(() => {
    if (_refTabArea.current) {
      _refTabArea.current.scrollLeft = scrollLeft;
    }
  }, [scrollLeft]);

  // メリット：
  // - 親コンポーネントからのrefをDOMに渡す必要がないので子コンポーネントは自分のrefを使うことができる
  // デメリット：
  // - 子コンポーネントは親コンポーネントからの要求を知らなくてはならないので蜜結合が高まる
  useImperativeHandle(
    _ref,
    () => {
      return {
        getTabsAreaRect() {
          if (_refTabArea.current) {
            return _refTabArea.current.getBoundingClientRect();
          } else return undefined;
        },
        getScrollWidth() {
          if (_refTabArea.current) {
            return _refTabArea.current.scrollWidth;
          } else return undefined;
        }
      };
    },
    []
  );

  const changeTab = (selectedTabNode: HTMLDivElement, index: number) => {
    // 一旦すべてのtabのclassNameを'tab'にする
    for (var i = 0; i < _refTabArea.current!.childNodes.length; i++) {
      var child: iJSXNode = _refTabArea.current!.childNodes[i];
      if (/tab/.test(child.className!)) {
        child.className = "tab";
      }
    }
    // 選択されたtabのみclassName='tab active'にする
    selectedTabNode.className = "tab active";
    setSelected(index);
  };

  return (
    <div className="tabs-area" ref={_refTabArea} style={stylesOfTabsArea}>
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
