'use strict';
//cache the site urls
var NodeCache = require( "node-cache" );
var myCache = new NodeCache();

var exports = module.exports = {};
exports.myCache = myCache;
