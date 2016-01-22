const React = require('react');
const ReactDOM = require('react-dom');

require('../node_modules/bootstrap/dist/css/bootstrap.css');

console.log('hello world')

var MainContainer = require('./app.jsx').MainContainer;

ReactDOM.render(
  <MainContainer />,
  document.getElementById('content')
);
