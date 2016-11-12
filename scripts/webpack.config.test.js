const path = require('path')
const glob = require('glob')

module.exports = {
  entry: ['es6-promise/auto'].concat(glob.sync(path.resolve(__dirname, '../test/**/*.ts'))),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      { enforce: 'post', test: /\.ts$/, loader: 'webpack-espower', include: /test/ },
      { test: /\.ts$/, loader: 'ts' },
      { test: /\.txt$/, loader: 'raw' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  devtool: 'source-map'
}
