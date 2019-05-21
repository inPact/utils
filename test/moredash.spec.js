const moredash = require('../').moredash;
const should = require('chai').should();
const _ = require('lodash');

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

    it('included utility functions', async function () {
        let moreFuncs = {
            a(){
                return 'hi';
            }
        };

        let utils = require('../');
        utils.use(moreFuncs);
        should.exist(utils.a);
        should.exist(utils.moredash.a);
        utils.a().should.equal('hi');
        utils.moredash.a().should.equal('hi');
    });
});
