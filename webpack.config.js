const path = require('path')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: './src/main.ts',
  target: 'node',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'lib')
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        include: [path.resolve(__dirname, 'src')],
        loader: 'swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript'
            }
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.ts']
  },
  externals: [nodeExternals()],
  plugins: [new CleanWebpackPlugin()]
}
