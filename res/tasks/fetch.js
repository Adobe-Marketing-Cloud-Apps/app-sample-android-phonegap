var spawn = require('child_process').spawn
    , fetch = spawn('sh', ['res/tasks/fetch.sh'])

// FIXME need to make this run in pure node for windows, I guess
fetch.stdout.pipe(process.stdout)
fetch.stderr.pipe(process.stderr)
