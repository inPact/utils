const path = require('path');
const fs = require('../').fs;
const should = require('chai').should();

describe('fs: ', function () {
    describe('loadModules: ', function () {
        it('should load only files matched by regex', async function () {
            const modules = fs.loadModules('./test/a_test_dir', { matcher: /\.me/ });
            Object.keys(modules).length.should.equal(1);
            should.exist(modules['match.me']);
        });

        it('should load only files matched by function', async function () {
            const modules = fs.loadModules('./test/a_test_dir', { matcher: mod => !!mod.happy });
            Object.keys(modules).length.should.equal(1);
            should.exist(modules['very_happy']);
        });

        it('should ignore non-js files', async function () {
            /*
            Since the loadModules method is self-protecting, this test will not fail...
            just look in the output to see there are no errors
             */
            const modules = fs.loadModules('./test/a_test_dir');
            Object.keys(modules).length.should.equal(2);
        });
    });

    describe('mapDir: ', function () {
        it('should camel-case by default', async function () {
            const modules = fs.mapDir(path.join(__dirname, './a_test_dir'));
            Object.keys(modules).length.should.equal(2);
            should.exist(modules['matchMe']);
            should.exist(modules['veryHappy']);
        });

        it('should ignore non-js files', async function () {
            const modules = fs.mapDir(path.join(__dirname, './a_test_dir'));
            Object.keys(modules).length.should.equal(2);
        });

        it('should load files in directories', async function () {
            const modules = fs.mapDir(path.join(__dirname, './nested_test_dir'), { loadDirs: true });
            Object.keys(modules).length.should.equal(2);
            should.exist(modules['matchMe']);
            should.exist(modules['veryHappy']);
        });
    });
});