// TBD: https://github.com/freshdesk/freshapps_devportal/issues/893

var fs = require('fs-extra');
var scss = require(__dirname + "/scss");
var eh = require(__dirname + '/err');

var cwd = process.cwd();

var tmpFilePath = cwd + "/work/tmp.scss";
var cssFilePath = cwd + "/work/app.css";
var JSContent = "";
var CSSContent = "";
var HTMLContent = "";

function readFile(file, callback) { // TBD: fs.readFile('/etc/passwd', 'utf8', callback);
  fs.readFile(file, (err, data) => { // read encoding from manifest.
    if (err) { 
      eh.error(new Error("Error while reading " + file), 1);
    }
      callback(data);
  });
}

function appendStyleTag(input) {
  return "<style>\n" + input + "\n</style>\n";
}

function appendScriptTag(input) {
  return "<script>\n" + input + "\n</script>";
}

function appendFreshappRunTag(input) {
  return "Freshapp.run(function() { \n var {{app_id}} = " + input + "\n{{app_id}}.initialize(); \n});\n";
}

function appendAppIDTagForScss(input) {
  return "#__app_id__ {\n" + input + "\n}\n";
}

function appendAppIDTagForHtml(input) {
  return '<div id="{{app_id}}">\n' + input + '\n</div>\n';
}

function replaceAppID(input) {
  return input.replace(/__app_id__/g, '{{app_id}}')
}

function getHtmlContent(callback) {
  readFile(cwd + "/app/template.html", function(data) {
    return callback(data.toString());
  });
}

function getScssContent(callback) {
  readFile(cwd + "/app/style.scss", function(data) {
    callback(data.toString());
    return;
  });
}

function getJsContent(callback) {
  readFile(cwd + "/app/app.js", function(data) {
    callback(data.toString());
    return;
  });
}

function getCssContent(callback) {
  readFile(cssFilePath, function(data) {
    callback(data.toString());
    return;
  });
}

function compileCss(callback) {
  fs.ensureFile(cssFilePath, function(err) {
    try{
      scss.compile(tmpFilePath, cssFilePath);
      return callback(null)
    }
    catch(err){
      return callback(err)
    }
    callback();
  });
}

function execute(callback) {
  fs.ensureFile(tmpFilePath, function (err) {
    if (err) { 
      eh.error(new Error("Error while creating temp file."), 1);
    }
    getScssContent(function(data) {
      var toWrite = appendAppIDTagForScss(data);
      fs.writeFile(tmpFilePath, toWrite, function(err){
        if(err) { 
          eh.error(new Error("Error while writing tmp file"), 1);
        }
        compileCss(function(err){
          if(err) { 
            eh.error(new Error("Error while compiling SCSS"), 1);
          }
          getHtmlContent(function(data){
            HTMLContent = appendAppIDTagForHtml(data);
            getCssContent(function(data){
              CSSContent = appendStyleTag(replaceAppID(data));
              getJsContent(function(data){
                JSContent = appendScriptTag(appendFreshappRunTag(data));
                return callback(CSSContent + HTMLContent + JSContent);
              });
            });
          });
        });
      });
    });
  });
}

exports.unify = function(callback) {
  execute(function(data){
    return callback(data);
  });
}