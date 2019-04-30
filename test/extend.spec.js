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
});
