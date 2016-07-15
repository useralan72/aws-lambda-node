'use strict';

const https = require('https');
var mysql = require ('mysql');
var authToken = '';

/**
 *  Setup the URL and options
 * Path and hostname should not be hardcoded. Also need to accept partner string from event.
 */
exports.handler = (event, context, callback) => {

    console.log ('event');
    console.log (event);

    var connection = mysql.createConnection({
        host    : 'api-test1-cluster.cluster-cmg1isu0pkid.us-west-2.rds.amazonaws.com',
        user    : 'neptune',
        password: '09Iwattfb',
        database: 'api_test1'
    });
    console.log ('site id for query = ', event.site_id);

    var siteQuery = 'select site_url from site_routing where site_id = ' + event.site_id;
    var siteUrl = '';

    connection.query (siteQuery, function (errors, rows, fields) {
        if (!errors)
        {
            console.log ('good retrieve');
            console.log (rows);

            siteUrl = rows[0].site_url;

            console.log ('parsed site url = ', siteUrl);

            console.log ('site url = ', siteUrl);

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
            console.log ('Error on retrieve');
    });

    connection.end(function(err) {
        /**
         *  End of connection
         */
    });
};
