#!/usr/bin/env node

var spawn = require('child_process').spawn
  , unpack = spawn('sh', ['res/tasks/unpack.sh']);

// FIXME need to make this run in pure node for windows
unpack.stdout.pipe(process.stdout);
unpack.stderr.pipe(process.stderr);
