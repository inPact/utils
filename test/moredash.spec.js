const moredash = require('../').moredash;
const should = require('chai').should();

describe('should include: ', function () {
    it('attached modules', async function () {
        should.exist(moredash.trace);
        should.exist(moredash.lock);
        should.exist(moredash.time);
    });

    it('lodash function', async function () {
        should.exist(moredash.get);
        should.exist(moredash.set);
    });

    it('lodash chaining', async function () {
        [2,3,4].should.include.ordered.members(moredash([1,2,3]).map(x => x+1).value());
    });
});
