#!/usr/bin/env node

var shell = require('shelljs');

// remove the tmp/ directory
shell.rm('-rf', 'tmp/');
