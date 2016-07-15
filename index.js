'use strict';

const https = require('https');
var mysql = require ('mysql');
var AWS = require('aws-sdk');
var Q = require('q');
var _ = require('lodash');

var routings = require("./src/routings");
var inmemorycache = require('./src/inmemorycache');

//config properties
AWS.config.region = 'us-west-2';
var params = {Bucket: 'lambda-function-bucket-us-west-2-1467892012680', Key: 'routing.properties'}

var authToken = '';

var callRESTEndpoint = function(options) {
    console.log('Calling callRESTEndpoint with ', options);
    var request = https.request(options, (response) => {
        console.log('statusCode: ', res.statusCode);
        var body = '';
        response.on('data', function(d) {
            body+=chunk;
        });

        response.on('end', () => {
            var data = JSON.parse (body);
            callback (null, body);
        });
    });
    request.on('error', function(err) {
        console.log('Error in the REST call', err);
        throw new Error();
    });
    request.end();
};

var options = function(siteUrl, reqPath, httpMethod) {
    var options = {
        hostname: siteUrl,
        port: 443,
        path: reqPath,
        method: httpMethod
    };
    return options;
}

var replaceTokens = function(event) {
    //get the path
    var resourcePath = event.resource_path;
    //replace all {} values
    for(var key in event) {
        var val = event[key];
        var keyWithBrackets = '{' + key.toString() + '}';
        if(resourcePath.indexOf(keyWithBrackets) != -1){
            resourcePath = resourcePath.replace(keyWithBrackets, val);
        }
    }
    return resourcePath;
}


/**
 *  Main lambda - pseudocode is
 *  check inmemory cache for siteurl
 *  if its there use it and call REST endpoint
 */
exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
    //is there anything in the cache
    if (inmemorycache.myCache.keys().size === undefined) {
        var routes = routings.getRoutingFromS3(event.site_id);
        new Q(routes).then(function(success){
            routings.getRoutingFromAurora(event.site_id);
        }, function(error){
            console.log('Error happened in first promise call', error.stack);
            //throw new Error();
        }).then(function(success) {
            callRESTEndpoint(options(inmemorycache.myCache.get(event.site_id), replaceTokens(event), event.httpMethod));
        }, function (error) {
            console.log('Error happened in second promise call', error.stack);
            throw new Error();
        }).then( console.log('myCache keys {}:', inmemorycache.myCache.keys()));
    } else {
        callRESTEndpoint(options(inmemorycache.myCache.get(event.site_id), replaceTokens(event), event.httpMethod));
    }
};
