'use strict';

const https = require('https');
var mysql = require ('mysql');
var AWS = require('aws-sdk');
const readline = require('readline');

//config properties
AWS.config.region = 'us-west-2';
AWS.config.update({accessKeyId: 'AKIAJR7BJZ7VWPNCZYKA', secretAccessKey: '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'})
var params = {Bucket: 'lambda-function-bucket-us-west-2-1467892012680', Key: 'routing.properties'}

var authToken = '';

var CACHE = {};


/**
 *  Setup the URL and options
 * Path and hostname should not be hardcoded. Also need to accept partner string from event.
 */
exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

    var s3 = new AWS.S3();
    //read the file from s3
    const rl = readline.createInterface({
        input: s3.getObject(params).createReadStream()
    });
    rl.on('line', function(line) {
        console.log(line);
    }).on('end', function() {
    });

    if (CACHE[event.site_id]) {
        siteUrl = CACHE[event.site_id];
    } else {

    }

  var connection = mysql.createConnection({
          host    : 'api-test1-cluster.cluster-cmg1isu0pkid.us-west-2.rds.amazonaws.com',
          user    : 'neptune',
          password: '09Iwattfb',
          database: 'api_test1'
  });

  var siteQuery = 'select site_url from site_routing where site_id = ' + event.site_id;
  console.log ('SQL query = ', siteQuery);
  var siteUrl = '';

  connection.query(siteQuery, function (errors, rows, fields) {
    if (!errors) {
        console.log('Received rows :', JSON.stringify(rows, null, 2));

        siteUrl = rows[0].site_url;

        //add to the cache
        CACHE[event.site_id] = siteUrl;

        console.log ('Parsed site url (Placed in Cache) : ', siteUrl);


        /**
         * Build the path from what was passed in from context.
         * Need to add utility back in and put partner back on the end.
         * The params will need to be more generic to work best.
         * Possibly move them to the body and pass in as one object instead of calling them out?
         */
        var reqPath = '';
        reqPath = event.resource_path.replace ("{utility}", event.utility) + '?partner=' + event.partner;

        console.log ("reqPath = ", reqPath);

        var options = {
          hostname: siteUrl,
          port: 443,
          path: reqPath,
          //path: '/' + event.utility + '/v1/services/token?partner=' + event.partner,
          //path: '/sqa1api/v1/services/token?partner=' + event.partner,
          method: event.httpMethod
        };

        console.log ('options = ', options);

        console.log ('about to execute request');
        //console.log (event.partner);
        //console.log (siteUrl);

        /**
         * Setup the request and execute it
         */
        var req = https.request(options, (res) => {
          console.log('statusCode: ', res.statusCode);
          console.log('headers: ', res.headers);

          console.log ('in request');
          /**
           * Get back chunks of data and append them
           */
          var body = '';

          /**
           * Triggered as data comes in
           */
          res.on('data', (chunk) => {
            body+=chunk;
            console.log ('in data');
          });

          /**
           * At the end of the data, parse it and continue
           */
          res.on('end', () => {
            /**
             * Need to make sure it's JSON before parsing
             * Only parsing json for testing
             */

            var data = JSON.parse (body);
            console.log ('in end');

            /**
             * Need to add check to make sure JSON parse worked.
             */

            /**
             * Data is parsed, store the token
             */
            authToken = data.token;
            console.log ("after parse= ", authToken);

            /**
             * Returning back success and the token if we get this far
             */
            callback (null, body);
          });
        });

        /**
         * Close the request
         */
        req.end();

        /**
         * Look for errors in the request and dump them out if they happen
         */
        req.on('error', (e) => {
          console.error(e);
        });
      }

    else
      console.log ('Error on retrieve' + errors.toString());
  });

  connection.end(function(err) {
    /**
     *  End of connection
     */
  });
};
