const path = require('path')
const glob = require('glob')

module.exports = {
  entry: glob.sync(path.resolve(__dirname, '../test/**/*.ts')),
  output: {
    path: path.resolve(__dirname, '../.tmp'),
    filename: 'test.js'
  },
  resolve: {
    modulesDirectories: ['node_modules'],
    extensions: ['', '.ts', '.js']
  },
  module: {
    postLoaders: [
      { test: /\.ts$/, loader: 'webpack-espower', include: /test/ }
    ],
    loaders: [
      { test: /\.ts$/, loader: 'ts' },
      { test: /\.json$/, loader: 'json-loader' }
    ]
  },
  devtool: 'source-map'
}
