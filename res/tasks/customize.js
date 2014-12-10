#!/usr/bin/env node

var prompt = require('prompt');

var schema = {
    properties: {
        brandName: {
            description: "Brand Name",
            required: true
        },
        appName: {
            description: "App Name",
            required: true
        }
    }
};

function onErr(err) {
    console.log(err);
    return 1;
}

prompt.start();

prompt.get(schema, function (err, result) {
    if (err) { return onErr(err); }
    console.log('Command-line input received:');
    console.log('  Brand Name: ' + result.brandName);
    console.log('  App Name: ' + result.appName);

    var spawn = require('child_process').spawn
        , customize = spawn('sh', ['res/tasks/unpack.sh', result.brandName, result.appName]);

    customize.stdout.pipe(process.stdout);
    customize.stderr.pipe(process.stderr);

});

