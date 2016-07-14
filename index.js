'use strict';

const https = require('https');
var mysql = require ('mysql');
var AWS = require('aws-sdk');
var Q = require('q');

var routings = require("./src/routings.js");

//config properties
AWS.config.region = 'us-west-2';
var params = {Bucket: 'lambda-function-bucket-us-west-2-1467892012680', Key: 'routing.properties'}

var authToken = '';

//cache the site urls
var CACHE = new Map();

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


/**
 *  Setup the URL and options
 * Path and hostname should not be hardcoded. Also need to accept partner string from event.
 */
exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

    if (CACHE.size == 0) {
        var routes = routings.getRoutingFromS3(CACHE);
        new Q(routes).then(function(success){
            routings.getRoutingFromAurora(CACHE, event.site_id);
        }, function(error){
            console.log('Error happened', error);
            throw new Error();
        }).then(callRESTEndpoint());
    }
    console.log('CACHE {}:', JSON.stringify(CACHE, null, 2));
};
