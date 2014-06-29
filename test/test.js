var assert = require('chai').assert;
var uncache = require('../uncache.js');
var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');

var fixtures = [];

function getFile(filePath) {
    return new gutil.File({
        path: filePath,
        base: path.dirname(filePath),
        contents: fs.readFileSync(filePath)
    });
}

function getFixture(filePath) {
    return getFile(path.join('test', 'fixtures', filePath));
}

function getExpected(filePath) {
    return getFile(path.join('test', 'expected', filePath));
}

function compare(name, expectedName, done) {
    assert.equal(uncache(String(getFixture(name).contents), {
            srcDir: path.join('test', 'fixtures'),
            distDir: path.join('test', 'expected')
        }),
        String(getExpected(expectedName).contents));
    done();


}

describe('uncache', function () {
    it('should parse ', function (done) {
        compare('basic.html', 'basic.html', done);
    });
});