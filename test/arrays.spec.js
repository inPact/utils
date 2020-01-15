const arrays = require('../').arrays;
const should = require('chai').should();

describe('arrays should: ', function () {
    it('replaceElementBy function', async function () {
        let array = [
            { id: 1, val: 10 },
            { id: 2, val: 20 },
            { id: 3, val: 30 },
        ];

        let replacement = { id: 2, val: 2000 };
        arrays.replaceElementBy(array, replacement, x => x.id === replacement.id);
        array[1].val.should.equal(2000);
    });

    it('replaceElementBy property', async function () {
        let array = [
            { id: 1, val: 10 },
            { id: 2, val: 20 },
            { id: 3, val: 30 },
        ];

        let replacement = { id: 2, val: 2000 };
        arrays.replaceElementBy(array, replacement, 'id');
        array[1].val.should.equal(2000);
    });

    it('replaceOrAddBy', async function () {
        let array = [
            { id: 1, val: 10 },
            { id: 2, val: 20 },
            { id: 3, val: 30 },
        ];

        arrays.replaceOrAddBy(array, { id: 2, val: 2000 }, 'id');
        arrays.replaceOrAddBy(array, { id: 4, val: 4000 }, 'id');
        array.should.deep.equal([
            { id: 1, val: 10 },
            { id: 2, val: 2000 },
            { id: 3, val: 30 },
            { id: 4, val: 4000 },
        ])
    });

    it('addToSet empty set', async function () {
        let array = [];

        arrays.addToSet(array, 1);
        arrays.addToSet(array, 2);
        array.should.deep.equal([1, 2])
    });

    it('addToSet primitives', async function () {
        let array = [1, 3, 5];

        arrays.addToSet(array, 1);
        arrays.addToSet(array, 2);
        arrays.addToSet(array, 3);
        arrays.addToSet(array, 4);
        arrays.addToSet(array, 5);
        array.should.deep.equal([1, 3, 5, 2, 4])
    });

    it('addToSet objects', async function () {
        let array = [{ a: 1 }, { b: 2 }];

        arrays.addToSet(array, { a: 1 });
        arrays.addToSet(array, { b: 1 });
        arrays.addToSet(array, { b: 2 });
        arrays.addToSet(array, { b: 2, c: 2 });
        array.should.deep.equal([{ a: 1 }, { b: 2 }, { b: 1 }, { b: 2, c: 2 }])
    });
});
