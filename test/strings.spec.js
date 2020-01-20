const strings = require('../').strings;
const should = require('chai').should();
const assert = require('assert');

describe('strings: ', function () {
    it('smart join', async function () {
        let res = strings.smartJoin('PLUM', 'orangePLUM', 'berry', 'hum');
        res.should.equal('orangePLUMberryPLUMhum');
    });

    it('smart split', async function () {
        let res = strings.smartSplit('hello, world', ',');
        res.should.deep.equal(['hello', 'world']);

        res = strings.smartSplit('hello, ,world', ',');
        res.should.deep.equal(['hello', 'world']);

        res = strings.smartSplit('hello, world, ,   ,');
        res.should.deep.equal(['hello', 'world']);

        res = strings.smartSplit('', ',');
        res.should.deep.equal([]);

        res = strings.smartSplit(',', ',');
        res.should.deep.equal([]);
    });

    it('smart split should not throw error when given an object', async function () {
        try {
            strings.smartSplit({ hello: 'world' }, ',');
        } catch(e) {
            assert.fail(e);
        }
    });

    it('smart split should not throw error when given undefined / null', async function () {
        try {
            strings.smartSplit(undefined);
        } catch(e) {
            assert.fail(e);
        }

        try {
            strings.smartSplit(null);
        } catch(e) {
            assert.fail(e);
        }
    });
});
