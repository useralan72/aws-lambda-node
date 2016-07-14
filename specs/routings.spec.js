var Routings = require('../src/routings.js');

describe('When loading from the file', function () {
    var routings;

    before(function () {
        //routings = new Routings();
    });

    it('should result in three using the return style approach', function () {
        var result = routings.getRoutingFromS3();
        expect(result).notBlank();
    });
});
