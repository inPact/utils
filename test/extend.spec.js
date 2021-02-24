const extend = require('../').extend;
const should = require('chai').should();

describe('extend: ', function () {
    it('gitFirst', async function () {
        let obj = {
            a: { b: { c: 3 } },
            x: { y: { z: 4 } }
        };

        let res = extend.getFirst(obj, 'a.b.missing', 'a.b.c', 'x.y.z');
        res.should.equal(3);

        res = extend.getFirst(obj, 'x.y.z');
        res.should.equal(4);

        res = extend.getFirst(obj, 'x.y.missing', 'missing');
        should.not.exist(res);

        res = extend.getFirst(obj);
        should.not.exist(res);
    });

    it('flattenObject should flatten nested objects but not modify arrays', async function () {
        let obj = {
            a: { b: { c: 3 } },
            x: ['y', 'z']
        };

        let res = extend.flattenObject(obj);
        res.should.deep.equal({
            'a.b.c': 3,
            x: ['y', 'z']
        })
    });

    it('diff should return diff as object', async function () {
        let obj1 = {
            a: { b: { c: 3 }, r: 1 },
            x: ['y', 'z']
        };

        let obj2 = {
            a: { b: { d: 4 }, r: 1 },
            x: ['y', 'q']
        };

        let res = extend.diff(obj1, obj2);
        res.should.deep.equal({
            a: { b: { c: 3 } },
            x: { 1: 'z' }
        });
    });

    it('isTrue should return boolean', async function () {
        extend.isTrue(1).should.equal(true);
        extend.isTrue(true).should.equal(true);
        extend.isTrue('true').should.equal(true);

        extend.isTrue(0).should.equal(false);
        extend.isTrue(false).should.equal(false);
        extend.isTrue('false').should.equal(false);

        extend.isTrue(null).should.equal(false);
        extend.isTrue().should.equal(false);
    });

    it('isFalse should return boolean', async function () {
        extend.isFalse(1).should.equal(false);
        extend.isFalse(true).should.equal(false);
        extend.isFalse('true').should.equal(false);

        extend.isFalse(0).should.equal(true);
        extend.isFalse(false).should.equal(true);
        extend.isFalse('false').should.equal(true);

        extend.isFalse(null).should.equal(false);
        extend.isFalse().should.equal(false);
    });

    it('isFalseOrEmpty should return true for undefined and null', async function () {
        extend.isFalseOrEmpty(1).should.equal(false);
        extend.isFalseOrEmpty(true).should.equal(false);
        extend.isFalseOrEmpty('true').should.equal(false);

        extend.isFalseOrEmpty(0).should.equal(true);
        extend.isFalseOrEmpty(false).should.equal(true);
        extend.isFalseOrEmpty('false').should.equal(true);

        extend.isFalseOrEmpty(null).should.equal(true);
        extend.isFalseOrEmpty().should.equal(true);
    });

});
