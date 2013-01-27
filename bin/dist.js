var fs = require('fs');
var resolve = require('path').resolve;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var requirejsPath = resolve(__dirname, '..', 'node_modules', 'requirejs');
var libPath = resolve(__dirname, '..', 'lib');
var distPath = resolve(__dirname, '..', 'dist', 'h5', 'rql');

function removeDistDirectory()
{
  exec(
    (process.platform === 'win32' ? 'RMDIR /S /Q ' : 'rm -rf ') + '"' + resolve(distPath, '..', '..') + '"',
    function(err)
    {
      if (err)
      {
        console.error("Failed to remove the dist/ directory: %s", err.message);
      }
      else
      {
        convertLibDirectory();
      }
    }
  );
}

function convertLibDirectory()
{
  var child = spawn(
    process.execPath,
    [requirejsPath, '-convert', libPath, distPath]
  );

  child.on('close', function(code)
  {
    if (code !== 0)
    {
      console.error("Failed to convert lib/ directory.");
    }
    else
    {
      createMainFile();
    }
  })
}

function createMainFile()
{
  var mainFile = [
    "define(function (require, exports, module) {",
    "module.exports = require('./rql/index');",
    "});"
  ];

  fs.writeFileSync(resolve(distPath, '..', 'rql.js'), mainFile.join("\n"));
}

removeDistDirectory();
