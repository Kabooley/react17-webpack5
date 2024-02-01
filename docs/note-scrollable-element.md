# Implement Scrollable

## 参考

https://github.com/malte-wessel/react-custom-scrollbars/tree/master

https://stackoverflow.com/questions/2326004/prevent-selection-in-html

https://stackoverflow.com/questions/51661036/mouseup-event-is-not-fired-when-you-release-button-on-another-element-or-somewhe

https://stackoverflow.com/questions/5429827/how-can-i-prevent-text-element-selection-with-cursor-drag

## Summary

-   [`react-custom-scrollbars`の改造はあきらめた](#`react-custom-scrollbars`の改造はあきらめた)
-   [Reactと`MouseEvent.addEventListener`](#Reactと`MouseEvent.addEventListener`)
-   [マウスドラグ操作中に関係ない要素を選択してしまうのを避ける方法](#マウスドラグ操作中に関係ない要素を選択してしまうのを避ける方法)
-   [onmouseupイベントが他コンポーネントに吸収されてしまう件の解決](#onmouseupイベントが他コンポーネントに吸収されてしまう件の解決)
-   [親コンポーネントのリサイズに応じてscrollTopとscrollLeftを更新させる](#親コンポーネントのリサイズに応じてscrollTopとscrollLeftを更新させる)

USAGE:

-   [ScrollableElementがスクロール機能を提供できる条件](#ScrollableElementがスクロール機能を提供できる条件)

## TODOs

-   TODO: スクロールバーのthumbをつかんだまま`scrollable-element`の外でマウスを離すと`onmouseup`イベントが発火しない件をどうやって解決するか


## 座標

scrollTop: スクロール対象の要素とそのコンテナがあるとしてコンテナの上辺をy座標ゼロにするとして、スクロール対象要素の上辺との差。正の値である。スクロール対象要素がスクロールしていない状態なら座標0

onwheel.deltaY: マウスリールを下に転がす（スクロール要素が上に登っていく）と正の値で移動量が、上に転がすと（スクロール要素が下に下っていく）負の値になる

```JavaScript
// `elementYouWannaScroll`が上方向に100px移動する
// scrollTopは負の値にはならないので何かしら代入する値が負の場合は代わりに０を付与すること
elementYouWannaScroll.scrollTop = 100;

```

## Reactと`MouseEvent.addEventListener`

Reactでは通常`addEventListener`を使うべきではない。

理由はReact特有の`virtual dom`を構築する方法によってJavaScriptのようにはいかないから。

`addEventListener`のコールバック関数は、Reactの毎レンダリング時に細心に更新されない。

理由はReactは毎レンダリング時にコンポーネント内を再生成するため、その時点で`addEventListner`のコールバック関数は最新のコンポーネントのものではなくなるから。

つまりコールバック関数でsetState()しても、そのsetState()も今のsetState()ではないため反映されなくなるのである。

参考：

https://stackoverflow.com/questions/67244161/react-js-state-not-updating-in-event-listener-in-useeffect-hook?noredirect=1&lq=1

https://stackoverflow.com/questions/60540985/react-usestate-doesnt-update-in-window-events

https://stackoverflow.com/questions/64287104/add-and-remove-mousemove-listener-on-window-with-react-hooks

https://legacy.reactjs.org/docs/hooks-faq.html#why-am-i-seeing-stale-props-or-state-inside-my-function

実をいうと、関数コンポーネントならば解決できる（参考リンクの先の通り）。

classコンポーネントで作っていたが、この問題はどうしても解決できないので関数コンポーネントに作り直した。

#### Reactで疑似Drag and dropを実装するための方法

onmousedown時に`MouseEvent.addEventListener('mouseup',)`, `MouseEvent.addEventListener('mousemove',)`をアタッチする
onmousedup時に`MouseEvent.removeEventListener('mouseup',)`, `MouseEvent.removeEventListener('mousemove',)`を呼び出しデタッチする
毎レンダリングにまたがる更新は`useEffect()`で改めて最新のコールバックに付け替える

`useEffect()`の依存関係に関して。

本来は適切な更新を行うため依存関係なしか、適切なトリガーとなるReactiveな値を含めるべき。

そこは何を依存関係のために用意できるかやパフォーマンスとの天秤にかけることになるかと。

```TypeScript
  /***
   * Always atattch anew event listener callbacks
   * so that the event listener has access to the refleshed reactives
   * while it is dragging scrollbar thumb.
   * */
  useEffect(() => {
    if (dragging !== "none") {
      // DEBUG:
      console.log("[ScrollableElement] --- re atattch listeners ---");

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.onselectstart = function () {
        return false;
      };
    }

    () => {
      // DEBUG:
      console.log("[ScrollableElement] --- detattch listeners ---");

      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
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
      // スクロールに関するstateをここで更新する
  };

  // ...

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
    // DEBUG:
    console.log("on mouse down");
    setDragging(isHorizontal ? "h" : "v");
    setClientX(e.clientX);
    setClientY(e.clientY);
  };

  /***
   *
   ***/
  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (dragging === "none") return;
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousemove", onMouseMove);
    document.onselectstart = null;
    // DEBUG:
    console.log("on mouse up");
    setDragging("none");
  };


  // ...


  const onMouseMove = (e: React.MouseEvent<Element>) => {
    e.stopPropagation();
    e.preventDefault();
    if (dragging === "none") return;

    // DEBUG:
    console.log("on mouse move");

    const verticalTravelAmount = dragging === "v" ? e.clientY - clientY : 0;
    const horizontalTravelAmount = dragging === "h" ? e.clientX - clientX : 0;

    setClientX(e.clientX);
    setClientY(e.clientY);
    _onScroll(verticalTravelAmount, horizontalTravelAmount);
  };
```

## マウスドラグ操作中に関係ない要素を選択してしまうのを避ける方法

`MouseEvent.stopPropagation()`, `MouseEvent.preventDefault()`を呼び出す。
`document.onselectStart`を操作する。

参考：

https://stackoverflow.com/a/5432363

https://github.com/malte-wessel/react-custom-scrollbars/blob/master/src/Scrollbars/index.js#325

```TypeScript

  useEffect(() => {
    if (dragging !== "none") {
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.onselectstart = function () {
        return false;
      };
    }

    () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.onselectstart = null;
    };
  }, [dragging]);

  const onMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    isHorizontal: boolean
  ) => {
    e.stopPropagation();
    e.preventDefault();

    setDragging(isHorizontal ? "h" : "v");
    setClientX(e.clientX);
    setClientY(e.clientY);
  };

  const onMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (dragging === "none") return;
    document.removeEventListener("mouseup", onMouseUp);
    document.removeEventListener("mousemove", onMouseMove);
    document.onselectstart = null;
    setDragging("none");
  };

  const onMouseMove = (e: React.MouseEvent<Element>) => {
    e.stopPropagation();
    e.preventDefault();
    if (dragging === "none") return;

    const verticalTravelAmount = dragging === "v" ? e.clientY - clientY : 0;
    const horizontalTravelAmount = dragging === "h" ? e.clientX - clientX : 0;

    setClientX(e.clientX);
    setClientY(e.clientY);
    _onScroll(verticalTravelAmount, horizontalTravelAmount);
  };
```

codesandboxのscrollbarのthumbのスタイル

```css
element.style {
    position: absolute;
    width: 10px;
    height: 204px;
    right: 0px;
    top: 0px;
}
.monaco-scrollable-element > .invisible.fade {
    transition: opacity 0.8s linear;
}

.monaco-scrollable-element > .invisible {
    opacity: 0;
    pointer-events: none;
}

.monaco-scrollable-element > .visible {
    opacity: 1;
    background: transparent;
    transition: opacity 0.1s linear;
    z-index: 11;
}
```

## ScrollableElementがスクロール機能を提供できる条件

```HTML
<!--
  NOTE: div.scrollable-element__container と div.scrollable-element__scrollableは
  ScrollableElementが提供するコンポーネントで、
  div.parentとdiv.childは利用者が用意するコンポーネント
-->
<div class="parent">
  <div class="scrollable-element__container">
    <div class="scrollable-element__scrollable">
      <div class="child you-wanna-make-this-scrollable"></div>
    </div>
  </div>
</div>
```

-   `div.parent`のwidthと`div.child`のscrollWidthに差があるとき
-   且つ`div.parent`のwidthと`div.child`のscrollWidthの差が`div.parentのwidth < div.childのscrollWidth`であるとき
-   `div.parent`のheightと`div.child`のscrollHeightに差があるとき
-   且つ`div.parent`のheightと`div.child`のscrollHeightの差が`div.parentのheight < div.childのscrollHeight`であるとき

簡潔に言うと、`div.child`は`div.parent`よりサイズが大きいとスクロール可能である。

ただし、たとえば`div.parentのwidth > div.childのscrollWidth`ではクラッシュやエラーが起こるわけではなく、ただスクロール機能を提供しないだけである。

#### 親コンポーネントのサイズ変更

props経由で取得可能。

#### 子コンポーネントのサイズ変更

props経由でリサイズ更新をトリガーする値を取得し、useEffect()の依存関係に含める

そのuseEffect()内で子コンポーネントをラップしているrefから最新のサイズを取得してstateを更新する

```TypeScript
interface iProps {
  //...
  onChildrenResizeEvent: any;
  children: any;
}

// ...


  /***
   * Update scrollWidth, scrollHeight in case children has been resized.
   *
   **/
  useEffect(() => {
    if (
      refScrollableElement.current !== undefined &&
      refScrollableElement.current !== null
    ) {
      const _scrollWidth = refScrollableElement.current.scrollWidth;
      const _scrollHeight = refScrollableElement.current.scrollHeight;

      if (scrollHeight !== _scrollHeight) {
        // DEBUG:
        console.log(
          `[ScrollableElement] update scrollHeight ${scrollHeight} --> ${_scrollHeight}`
        );
        setScrollHeight(_scrollHeight);
      }
      if (scrollWidth !== _scrollWidth) {
        // DEBUG:
        console.log(
          `[ScrollableElement] update scrollHeight ${scrollWidth} --> ${_scrollWidth}`
        );
        setScrollWidth(_scrollWidth);
      }
    }
  }, [onChildrenResizeEvent]);
```

## onmouseupイベントがiframeコンポーネントに吸収されてしまう可能性への対応

ScrollableElementのとなりがiframe要素の時。スクロールバーのdrag中のままiframeに入ってしまうとマウスイベントがiframeに吸収されてしまう。

ユーザの利用ケースとしてあり得るので以下のように対応する。

#### `onDragStart`, `onDragEnd`propsの追加。

`onMouseDown`と`onMouseUP`呼出時に、これら`onDragStart`, `onDragEnd`がundefinedでなければ実行することを可能とした。

これでiframeに吸収されうる場合、利用者はonDragStartの内部で一時的にiframeのmouseeventを無効化する処理を呼び出せる。

## `react-custom-scrollbars`の改造はあきらめた

## `react-custom-scrollbars`はwindowリサイズで謎の余白が発生するバグ

#### 原因

`react-customize-scrollbars`は標準のスクロールバーを使っているがうまいこと隠している。その隠すために行っている計算がwindowのリサイズ時に更新されないためwindowのリサイズを行うとスクロールバーの幅がリサイズ前のサイズのままになっている。

これは公式のデモでも確認できるバグである。（誰も直さないのかしら）

どうやらこの`react-custom-scrollbars`は、
うまいこと`div.scrollable`の`margin-right`と`margin-bottom`を計算して標準のスクロールバーを隠しているらしい。

そこでwindowのresizeを行うと、この`margin-right`と`margin-bottom`の計算結果がおかしくなって（もしくは誤差が生まれて？）隠していた標準スクロールバーが少しはみ出るのである。

```css
/* div.scrollable */
element.style {
    position: absolute;
    inset: 0px;
    overflow: scroll;
    /* こいつら */
    margin-right: -17px;
    margin-bottom: -17px;
}
```

```TypeScript

  const viewStyle = {
    ...viewStyleDefault,
    // Hide scrollbars by setting a negative margin
    marginRight: scrollbarWidth ? -scrollbarWidth : 0,
    marginBottom: scrollbarWidth ? -scrollbarWidth : 0,
  }
```

問題は、このnpmは再レンダリングを絶対に引き起こさないようにしているという点である。

すべてReactの理の外でどうにかしていようとしている。

そのため再レンダリングを起こさないため、`viewStyle`がいつまでたってもマウント時の値のままなのである。

## 親コンポーネントのリサイズに応じてscrollTopとscrollLeftを更新させる

修正済。

親コンポーネントのリサイズに応じてscrollTopとscrollLeftを修正しなくてはならない。

そうしないと、

例えば垂直方向に一番下までスクロールした状態で、

親コンポーネントがy軸方向に拡大しても、

scrollTopの値が変わらないままだと子コンポーネントがスクロールされた状態のままの不自然な状態になる。

以下を追加することで解決した。

```TypeScript
    /***
     * Always fix scrollTop and scrollLeft in case parent resized.
     * 
     * On resized horiozntally:
     * Get diff of 
     * refScrollableElement.current.getBoundingClientRect().width
     * and parent width and add it to scrollLeft.
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

```