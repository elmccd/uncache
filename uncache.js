/*
 * unCache
 * https://github.com/elmccd/gulp-uncache
 *
 * Copyright (c) 2014 Maciej Dudziński
 * Licensed under the MIT license.
 */


'use strict';

/**
 * Module dependencies
 */

var util = require('util'),
    hogan = require('hogan.js'),
    md5 = require('blueimp-md5').md5,
    fs = require('fs'),
    os = require('os'),
    path = require('path'),
    defaultConfig = {
        append: 'time',
        distDir: './',
        srcDir: './',
        rename: false,
        template: '{{path}}{{name}}_{{append}}.{{extension}}'
    },
    globalConfig = {};

require('colors');

var uncache = {
    extractBlocks: function (html) {
        var blocks = html.split(/<!--\s*enduncache\s*-->/);
        var output = [];

        blocks.forEach(function (block) {
            var pieces = block.split(/<!--\s*uncache\s*(\(.*\))?\s*-->/);
            output.push({type: 'html', content: pieces[0]});

            if (typeof pieces[2] !== 'undefined') {
                output.push({type: 'uncache', config: pieces[1], content: pieces[2]})
            }
        });
        return output;
    },

    mkdirRecursive: function (dir) {
        var dirs,
            i,
            _path;

        if (fs.existsSync(path.normalize(dir))) {
            return false;
        }

        dirs = path.normalize(dir).split(path.sep);

        for (i = 0; i < dirs.length; i += 1) {
            _path = path.normalize(dirs.slice(0, i + 1).join('/'));
            fs.existsSync(_path) || fs.mkdirSync(_path);
        }
    },

    processBlock: function (config, content) {
        var output = '';
        var tags = uncache.extractTags(content);

        globalConfig = util._extend(globalConfig, uncache.parseConfig(config));

        tags.forEach(function (link) {
            output += uncache.processTag(link);
            output += os.EOL;
        });
        output = output.slice(0, -os.EOL.length);
        return output;
    },
    copyFile: function (fileName, newFileName, config) {
        var sourceFile = path.join(config.srcDir, fileName);
        var distFile = path.join(config.distDir, newFileName);

        uncache.mkdirRecursive(path.dirname(distFile));
        fs.createReadStream(sourceFile).pipe(fs.createWriteStream(distFile));
    },
    processTag: function (tag) {
        var regexp,
            fileName,
            newFileName,
            newTag;
        if (tag.indexOf('src=') > 0) {
            regexp = /<.*\s+src=['"]([^'"]+)['"].*>/;
        } else if (tag.indexOf('href=') > 0) {
            regexp = /<.*\s+href=['"]([^'"]+)['"].*>/;
        } else {
            return tag;
        }
        fileName = tag.split(regexp)[1];
        if((globalConfig.rename === true || globalConfig.append === 'hash') && !fs.existsSync(path.join(globalConfig.srcDir, fileName))){
            console.error("[uncache] " + "Couldn't find file: ".red + fileName + ". Tag Skipped");
            return tag;
        }
        newFileName = uncache.getNewFileName(fileName, globalConfig);

        if (globalConfig.rename) {
            uncache.copyFile(fileName, newFileName, globalConfig);
        }

        newTag = tag.replace(fileName, newFileName);

        return newTag;
    },
    getNewFileName: function (fileName, config) {

        var append,
            template;
        if (config.append === 'hash') {
            append = uncache.calculateFileHash(fileName, config);
        } else if (config.append === 'time') {
            append = Math.round(+new Date() / 1000);
        } else {
            append = config.append;
        }

        var extension = path.extname(fileName);
        var dirName = path.dirname(fileName);
        dirName = dirName === '.' ? '' : dirName;
        var basename = path.basename(fileName, extension);


        if (config.rename) {
            template = hogan.compile(config.template);
            return template.render({
                name: basename,
                extension: extension.substr(1),
                path: dirName ? dirName + '/' : dirName,
                append: append
            });
        } else {
            return fileName + '?' + append;
        }
    },
    calculateFileHash: function (fileName, config) {
        var filePath = path.join(config.srcDir, fileName);
        var data;

        try {
            data = fs.readFileSync(filePath);
        } catch (e) {
            console.error("[uncache] " + "Couldn't find file: ".red + fileName);
            return false;
        }
        return md5(data.toString()).substr(0, 10);
    },
    extractTags: function (content) {
        return content.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<link [^>]*>/gm);
    },
    parseConfig: function (configString) {
        var config = {},
            parts;

        if (!configString) {
            return {};
        }

        configString.substr(1, configString.length - 2).split(/\s*,\s*/).forEach(function (element) {
            parts = element.split(':');
            config[parts[0].trim()] = parts[1].trim();
        });

        //parse string true/false to bool
        config.rename = config.rename === 'true';

        return config;
    },

    /**
     * @param html {string} HTML file content
     * @param config {object} Config object
     * @return {String} New HTML file content
     * @api public
     */
    init: function (html, config) {
        globalConfig = util._extend(defaultConfig, config);
        var output = '';


        uncache.extractBlocks(html).forEach(function (block) {
            if (block.type === 'html') {
                output += block.content;
            } else {
                output += uncache.processBlock(block.config, block.content);
            }
        });
        return output;
    }
};


/**
 * Module exports
 */

module.exports = uncache;