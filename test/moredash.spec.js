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

    it('any functions added before retrieving moredash', async function () {
        let moreFuncs = {
            a(){
                return 'hi';
            }
        };

        delete require.cache[require.resolve('../')];
        let utils = require('../');
        _.assign(utils, moreFuncs);
        should.exist(utils.moredash.a);
        utils.moredash.a().should.equal('hi');
    });
});
