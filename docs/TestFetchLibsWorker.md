# メモ

## 変更内容

package.json

```diff
{
    "dependencies": {
+       "idb-keyval": "^6.2.1"
    },
}
```

webpack.config.js

```diff
module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.tsx',
+       'fetchLibs.worker': './src/TestFetchLibsWorker/fetchLibs.worker.ts',
    },
    // ...
}
```

## わかったこと

React17 だろうが React18 だろうが、以前調査した通り関数コンポーネントでワーカーを動かすことができる！

なので、

やはり React の context Provider のコンポーネントでワーカーを呼び出すことが問題の原因の可能性が高い。

どうにかして context じゃない場所で worker を取り扱わないといかんが...
