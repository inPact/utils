const math = require('../').math;
const should = require('chai').should();

describe('math: ', function () {
    it('sumSafe', async function () {
        let ar = [1, 'hi', '2'];
        let res = math.sumSafe(ar);
        res.should.equal(3);
    });

    it('sumSafe with iteratee', async function () {
        let ar = [1, 'hi', '2'];
        let res = math.sumSafe(ar, x => x * 2);
        res.should.equal(6);
    });
});
