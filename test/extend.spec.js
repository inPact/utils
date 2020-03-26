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

    it('diff should return the second object if the first is undefined', async function () {

        let obj1;
        let obj2 = {
            a: { b: { d: 4 }, r: 1 },
            x: ['y', 'q']
        };

        let res = extend.diff(obj1, obj2);
        res.should.deep.equal(obj2);
    });

    it('hasDiff should return true if 2 objects is different', async function () {
        let obj1 = {
            a: { b: { c: 3 }, r: 1 },
            x: ['y', 'z']
        };

        let obj2 = {
            a: { b: { d: 4 }, r: 1 },
            x: ['y', 'q']
        };

        let res = extend.hasDiff(obj1, obj2);
        res.should.equal(true);
    });

    it('hasDiff should return false if 2 objects is equals', async function () {
        let obj1 = {
            a: { b: { c: 3 }, r: 1 },
            x: ['y', 'q']
        };

        let obj2 = {
            a: { b: { c: 3 }, r: 1 },
            x: ['y', 'q']
        };

        let res = extend.hasDiff(obj1, obj2);
        res.should.equal(false);
    });
});
