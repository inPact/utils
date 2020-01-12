const arrays = require('../').arrays;
const should = require('chai').should();

describe('arrays should: ', function () {
    it('replaceElement', async function () {
        let array = [
            { id: 1, val: 10 },
            { id: 2, val: 20 },
            { id: 3, val: 30 },
        ];

        let replacement = { id: 2, val: 2000 };
        arrays.replaceElement(array, replacement, x => x.id === replacement.id);
        array[1].val.should.equal(2000);
    });

    it('replaceElementBy', async function () {
        let array = [
            { id: 1, val: 10 },
            { id: 2, val: 20 },
            { id: 3, val: 30 },
        ];

        let replacement = { id: 2, val: 2000 };
        arrays.replaceElementBy(array, replacement, 'id');
        array[1].val.should.equal(2000);
    });
});
