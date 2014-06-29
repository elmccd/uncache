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

var through = require('through2'),
    gutil = require('gulp-util'),
    util = require('util'),
    hogan = require('hogan.js'),
    md5 = require('blueimp-md5').md5,
    fs = require('fs'),
    path = require('path'),
    PluginError = gutil.PluginError,
    alreadyBeeped = false,
    changed = 0,
    skipped = 0,
    defaultConfig = {
        append: 'time',
        distDir: './',
        srcDir: './',
        rename: false,
        template: '{{path}}{{name}}_{{append}}.{{extension}}'
    },
    globalConfig = {};

/**
 * Module exports
 */

module.exports = unCache;

function extractBlocks(html) {
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
}

function processBlock(config, content) {
    globalConfig = util._extend(globalConfig, parseConfig(config));

    console.log(content);
    return content;
}

function parseConfig(configString) {
    var config = {},
        parts;

    if(!configString) {
        return {};
    }

    configString.substr(1, configString.length - 2).split(/\s*,\s*/).forEach(function(element) {
        parts = element.split(':');
        config[parts[0].trim()] = parts[1].trim();
    });

    return config;
}

/**
 * @param html {string} HTML file content
 * @param config {object} Config object
 * @return {String} New HTML file content
 * @api public
 */
function unCache(html, config) {
    globalConfig = util._extend(defaultConfig, config);
    var output = '';


    extractBlocks(html).forEach(function (block) {
        if (block.type === 'html') {
            output += block.content;
        } else if (block.type === 'uncache') {
            output += processBlock(block.config, block.content);
        }
    });
    return output;
}
