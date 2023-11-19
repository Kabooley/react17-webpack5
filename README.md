# 私を読んで

この環境は`React` v17 + `webpack` v5 で何か動かしたいときに使う為のスペースである。

## ルール

案件ごとの動かしたいコードは`src/`以下にそれらをまとめたディレクトリを作成して、

`src/App`へディレクトリのトップのコンポーネントを渡すことで動かすこと。

案件ごとに変更した内容は`docs/`以下へ md ファイルを作成してそこへ記すこと。

webpack.config.js, tsconfig.json, package.json の変更内容など。

## 初期状態

#### package.json

```JSON
{
    "name": "react17-webpack5",
    "version": "1.0.0",
    "description": "Playground of React v17 + webpack v5",
    "main": "index.js",
    "author": "Kabooley",
    "license": "MIT",
    "scripts": {
        "start": "node ./node_modules/webpack-dev-server/bin/webpack-dev-server.js",
        "build": "NODE_ENV='production' node ./node_modules/webpack/bin/webpack.js --progress"
    },
    "dependencies": {},
    "devDependencies": {
        "@babel/core": "^7.17.0",
        "@babel/preset-env": "^7.16.11",
        "@babel/preset-react": "^7.16.7",
        "@babel/preset-typescript": "^7.16.7",
        "@pmmmwh/react-refresh-webpack-plugin": "^0.5.4",
        "@types/react": "^17.0.39",
        "@types/react-dom": "^17.0.11",
        "babel-loader": "^8.2.3",
        "css-loader": "^5.2.7",
        "file-loader": "^6.2.0",
        "glob": "^7.2.0",
        "html-webpack-plugin": "^5.5.0",
        "react": "^17.0.2",
        "react-dom": "^17.0.2",
        "react-refresh": "^0.11.0",
        "style-loader": "^3.3.1",
        "terser-webpack-plugin": "^5.3.1",
        "ts-loader": "^9.2.6",
        "typescript": "^5.0.2",
        "webpack": "^5.76.0",
        "webpack-cli": "^4.9.2",
        "webpack-dev-server": "^4.7.4"
    }
}

```

#### tsconfig.json

```JSON
{
    "compilerOptions": {
        "sourceMap": true,
        "module": "ES2020",
        "moduleResolution": "node",
        "strict": true,
        "target": "ES6",
        "outDir": "./dist",
        "lib": [
            "dom",
            "es5",
            "es6",
            "ES2016",
            "es2015.collection",
            "es2015.promise",
            "ES2017.Object",
            "WebWorker"
        ],
        "types": [],
        "baseUrl": "./node_modules",
        "jsx": "preserve",
        "esModuleInterop": true,
        "typeRoots": ["node_modules/@types"]
    },
    "include": ["./src/**/*"],
    "exclude": ["node_modules"]
}
```

#### webpack.config.js

```JavaScript
const path = require('path');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = {
    mode: 'development',
    entry: {
        app: './src/index.tsx'
    },
    devServer: {
        hot: true,
    },
    resolve: {
        extensions: ['*', '.js', '.jsx', '.tsx', '.ts'],
    },
    output: {
        globalObject: 'self',
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx|tsx|ts)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: require.resolve('babel-loader'),
                        options: {
                            presets: [
                                '@babel/preset-env',
                                '@babel/preset-typescript',
                                '@babel/preset-react',
                            ],
                            plugins: [
                                isDevelopment &&
                                    require.resolve('react-refresh/babel'),
                            ].filter(Boolean),
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.ttf$/,
                use: ['file-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: 'src/index.html',
        }),
        isDevelopment && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
};

```
