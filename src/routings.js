'use strict';

var AWS = require('aws-sdk');
var mysql = require ('mysql');
var q = require('q');
const readline = require('readline');

var params = {Bucket: 'lambda-function-bucket-us-west-2-1467892012680', Key: 'routing.properties'}

var exports = module.exports = {};

exports.getRoutingFromS3 = function(map) {
    console.log('CALLING getRoutingFromS3');
    var defer = q.defer();
    var s3 = new AWS.S3();
    //read the file from s3
    const rl = readline.createInterface({
        input: s3.getObject(params).createReadStream()
    });
    rl.on('line', function(line) {
        console.log('Line reading ' + line);
        var routingsArray = line.split('=');
        map.set(routingsArray[0].toString(), routingsArray[1]);
    }).on('close', function() {
        console.log('Finished reading the file');
        defer.resolve(map);
    });
    console.log('Returning the getRoutingFromS3 promise');
    return defer.promise;
};

exports.getRoutingFromAurora = function (map, site_id) {
    console.log('CALLING getRoutingFromAurora with map and site_id', map, site_id);
    if (map.contains(site_id)) {
        return;
    }
    var connection = mysql.createConnection({
        host    : 'api-test1-cluster.cluster-cmg1isu0pkid.us-west-2.rds.amazonaws.com',
        user    : 'neptune',
        password: '09Iwattfb',
        database: 'api_test1'
    });

    var siteQuery = 'select site_url from site_routing where site_id = ' + site_id;
    console.log ('SQL query = ', siteQuery);
    var siteUrl = '';

    connection.query(siteQuery, function (errors, rows, fields) {
        if (!errors) {
            console.log('Received rows :', JSON.stringify(rows, null, 2));
            siteUrl = rows[0].site_url;
            map.put(site_id, siteUrl);
        } else {
            return new Error(errors);
        }
    });

};
