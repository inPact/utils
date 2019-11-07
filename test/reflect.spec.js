const reflect = require('../').reflect;
const should = require('chai').should();

describe('reflect: ', function () {
    it('get function argument names', async function () {
        let func = function(x, y, z) {};
        let argumentNames = reflect.getFunctionArguments(func);

        argumentNames[0].should.equal('x');
        argumentNames[1].should.equal('y');
        argumentNames[2].should.equal('z');
    });
});
