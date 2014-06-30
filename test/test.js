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
    assert.equal(uncache.init(String(getFixture(name).contents), {
            srcDir: path.join('test', 'fixtures'),
            distDir: path.join('test', 'expected')
        }),
        String(getExpected(expectedName).contents));
    done();
}

describe('extractTags', function () {
    it('should parse script and link tags', function (done) {
        var raw = '<script></script><script></script><link />'
        var tags = uncache.extractTags(raw);
        assert.equal(tags.length, 3);
        done();
    });
});

describe('get file name with append:time', function () {
    it('should return changed filename', function (done) {
        var config = {
            append: 'time',
            rename: false
        };
        var newFileName = uncache.getNewFileName('myFile.js', config);
        assert.equal(newFileName, 'myFile.js?' + Math.round(+new Date() / 1000));
        done();
    });
});

describe('parse line without src or html', function () {
    it('should return the same string', function (done) {

        var newTag = uncache.processTag('<script id="uncache"></script>');
        assert.equal(newTag, '<script id="uncache"></script>');
        done();
    });
});

describe('parsing invalid input', function () {
    it("should return false while calculateFileHash because file doesn't exist", function (done) {
        var config = {
            srcDir: './really-invalid-path'
        };
        var hash = uncache.calculateFileHash('this-is-invalid-too.js', config);
        assert.equal(hash, false);
        done();
    });

    it("should return empy object when there is no inline config", function (done) {
        assert.equal(JSON.stringify({}), JSON.stringify(uncache.parseConfig(undefined)));
        done();
    });
});



describe('mkdir recursive', function () {
    it('should create non-existent path', function (done) {
        var fileName = '.tmp-uncache-test-mkdirRecursive';
        if(fs.existsSync(fileName)) {
            fs.rmdirSync(fileName);
        }
        uncache.mkdirRecursive('.tmp-uncache-test-mkdirRecursive');

        fs.readdir(path.normalize('./'), function(err, files) {
            assert.equal(files.indexOf(fileName) !== -1, true);

            fs.rmdirSync(fileName);
            done();
        });
    });
});

//describe('uncache', function () {
//    it('should parse ', function (done) {
//        compare('basic.html', 'basic.html', done);
//    });
//});