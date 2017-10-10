var app = require('app');
var BrowserWindow = require('browser-window');
var mainWindow = null;
var globalShortcut = require('global-shortcut');
var needToExecBat = true;
var path = require('path');
var fs = require('fs');

//var fs = require('fs');
//var logpath = path.resolve(__dirname, './log.txt');
require('crash-reporter').start();


if(needToExecBat) {
  var spawn = require('child_process').spawn;
  var bat = spawn('cmd.exe', [path.resolve(__dirname, './fingerPrint'), 'InstallOcx.bat']);
  bat.stdout.on('data', function(data) {
    console.log(data);
  });
  bat.stderr.on('data', function(data) {
    console.log(data);
  });
  bat.on('exit', function(data) {
    console.log(`Child exited with code ${code}`)
  });
}

app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});
app.commandLine.appendSwitch('ppapi-flash-path', __dirname + '/ppapi-flash-path/PepperFlash/pepflashplayer.dll');
app.commandLine.appendSwitch('ppapi-flash-version', '17.0.0.169');
app.commandLine.appendSwitch('disable-http-cache');

var crashReporter = require('crash-reporter');

/*crashReporter.start({
  productName: 'YourName',
  companyName: 'YourCompany',
  submitUrl: 'https://your-domain.com/url-to-submit',
  autoSubmit: true
});*/

app.on('ready', function() {
  var out = fs.readFileSync(path.resolve(__dirname,'./website.txt'));
  mainWindow = new BrowserWindow({ width: 800, height: 600, 'web-preferences': {'plugins': true,'nodeIntegration':false},icon: 'file://' + __dirname + '/logo.ico'});
  mainWindow.loadUrl(out.toString());

  mainWindow.maximize();
  mainWindow.openDevTools();

  mainWindow.on('closed', function() {
    mainWindow = null;
  });

  function electronLog(msg){
  	var fs,path2;
  	if(require){
  		fs = require('fs');
  		path2 = require('path');
  	} else if(nodeRequire){
  		fs = require('fs');
  		path2 = nodeRequire('path');
  	}
  	if(fs && path2){
	  	var currentPath = __dirname;
	  	var logpath = path2.resolve(currentPath.substr(0,currentPath.indexOf('resources')+9),'./app/log.txt')
	  	fs.exists(logpath,function(exists){
	  		if(!exists){
	  			fs.writeFileSync(logpath,'//app log\n');
	  		} 
	  		fs.appendFileSync(logpath,'\n'+msg+'\n');
	  	});
	  }
  }

  function registerShotCut(){
    var ret = globalShortcut.register('f5', function () {
      var win = BrowserWindow.getFocusedWindow();
      if (win) {
        var contents = win.webContents;
        contents.reload();
      }
    });
    var ret2 = globalShortcut.register('ctrl+r', function () {
      var win = BrowserWindow.getFocusedWindow();
      if (win) {
        var contents = win.webContents;
        contents.reloadIgnoringCache();
      }
    });
  }

    mainWindow.on('blur', function() {
        setTimeout(function () {
            var win = BrowserWindow.getFocusedWindow();
            if(win) return;
            globalShortcut.unregisterAll();
        },20)
    });

  mainWindow.on('focus', function() {
    registerShotCut();
  });

  registerShotCut();
  electronLog('234');
});

app.commandLine.appendSwitch('--enable-npapi');