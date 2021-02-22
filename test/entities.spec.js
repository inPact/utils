const entities = require('../').entities;
const { expect } = require('chai');
const winston = require('winston');
const sinon = require('sinon');

describe('entities: ', function () {
    describe('getObjectId function:', function() {
        let loggerWarnMethod;
        before(function() {
            loggerWarnMethod = sinon.stub(winston, 'warn');
        });
        it('should warn when cannot parse', function() {
            const defaultWinstonLogger = winston.default;
            expect(defaultWinstonLogger.transports).to.be.an('array');
            expect(defaultWinstonLogger.transports).to.have.length.above(0);
            const objectId = entities.getObjectId('bla');
            expect(objectId).to.be.undefined;
            expect(loggerWarnMethod.callCount).to.equal(1);
            expect(loggerWarnMethod.firstCall.calledWithMatch(/could not be parsed/), 'Winston warning not good').to.be.true;
        });
        after(function() {
            winston.warn.restore(); // From being a stub
        });
    })
});