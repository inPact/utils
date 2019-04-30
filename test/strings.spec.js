const strings = require('../').strings;
const should = require('chai').should();

describe('strings: ', function () {
    it('smart join', async function () {
        let res = strings.smartJoin('PLUM', 'orangePLUM', 'berry', 'hum');
        res.should.equal('orangePLUMberryPLUMhum');
    });
});
