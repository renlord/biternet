var path = require('path');
var webpack = require('webpack');

module.exports = {
      entry: './src/main.js',
      output: { path: __dirname, filename: 'bundle.js' },
      module: {
            loaders: [
                {
                    test: /.jsx?$/,
                    loader: 'babel-loader',
                    exclude: /node_modules/,
                    query: {
                        presets: ['es2015', 'react']
                    }
                },
                {
                    test: /\.json?$/,
                    loader: 'json-loader'
                },
                {
                    test: /\.css$/, 
                    loader: 'style-loader!css-loader'
                },
                { 
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
                    loader: "url-loader?limit=10000&minetype=application/font-woff" 
                },
                { 
                    test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
                    loader: "file-loader" 
                }      
            ]
     }
};
