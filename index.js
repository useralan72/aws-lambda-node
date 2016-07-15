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
AWS.config.update({accessKeyId: 'AKIAJR7BJZ7VWPNCZYKA', secretAccessKey: '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'})
var params = {Bucket: 'lambda-function-bucket-us-west-2-1467892012680', Key: 'routing.properties'}

var authToken = '';

var callRESTEndpoint = function(options) {
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
        console.log('Error happened', err);
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
 *  Setup the URL and options
 * Path and hostname should not be hardcoded. Also need to accept partner string from event.
 */
exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
    //is there anything in the cache
    if (inmemorycache.myCache.keys().size === undefined) {
        Q.nfcall(routings.getRoutingFromS3()).then(function(success){
            routings.getRoutingFromAurora(CACHE, event.site_id);
        }, function(error){
            console.log('Error happened', error);
            throw new Error();
        }).then(callRESTEndpoint()).then( console.log('myCache keys {}:', inmemorycache.myCache.keys()));
    } else {
        callRESTEndpoint(options(CACHE.get(event.site_id), replaceTokens(event), event.httpMethod));
    }
};
