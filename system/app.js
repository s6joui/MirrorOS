var SYSTEM_DIR = __dirname;
var MAIN_DIR = __dirname.replace("/system","");
var APP_DIR = MAIN_DIR+"/apps/";
var appData = [];
var speechRecognizer,gestureRecognizer;
var sys_config;

var currentApp;
var home_app_index=0,assistant_app_index = -1;
var gesturesEnabled = true;
var readSensorData = false;

var socketIO;

var view;

var SpeechRecognizer = require('./core/speech-recognizer/speech-recognizer.js');
var GestureRecognizer = require('./core/gesture-recognizer/gesture-recognizer.js');
var SensorReader = require('./core/gesture-recognizer/sensor-reader.js');

window.onload = function(){
	console.log(__dirname);
	console.log(MAIN_DIR);
	
	view = new View();

	// Load config and app info
	sys_config = require('../config.json');
	console.log(sys_config);
	loadApps(sys_config).then(function(appDataList){
		appData = appDataList;
		setupSpeechRecognition();
		setupRemoteAppServer();
		launchApp(appData[home_app_index]);
		view.hideSplash();
	}).fail(function(err){
		view.showSplashWithTitle("Something went wrong.<br>Please re-start or re-install if it persists");
		console.log(err);
	});
	
	//Clock
	view.updateTime();
	setInterval(view.updateTime,1000);
	
	//IP address - internet status
	view.setStatus(getIPAddress());
	setInterval(function(){
		view.setStatus(getIPAddress());
	},30000);
}


function setupRemoteAppServer(){
	//HTML Server for remote control app
	var connect = require('connect');
	var serveStatic = require('serve-static');
	connect().use(serveStatic(MAIN_DIR+'/remote_app')).listen(3000, function(){
		console.log('Server running on 3000...');
	});
	
	//Socket server for communication between the remote app and the system
	console.log("setup socket.io");
	socketIO = require('socket.io')(8888);
	console.log("listeni¡g on port 8888");
	socketIO.on('connection', function (socket) {
		console.log("new client connected");
		view.showToast("New device connected!");
		
		socket.on('query', function (query) { 
			console.log("new query "+query);
			view.setTitle(query);
			launchAppWithQuery(query);
		});
		
		socket.on('launch-app', function (index) {
			console.log("Launching app "+index+" from remote app");
			launchApp(appData[index],null);
		});
		
		socket.on('install-app', function (url) { 
			installApp(url);
		});
		
		socket.on('trigger-voice', function () { 
			startVoiceRecognition();
		});
		
		socket.emit('app-list',{apps:appData,home_app:home_app_index});
		socket.emit('current-app',getCurrentAppIndex());
		
		var webview = document.querySelector("#mainAppView");
		if(webview){
			webview.send('remoteConnect');
		}
	});
	
	socketIO.on('disconnect',function(){
		view.showToast("Device disconnected");
	});
}

function listenToAllClients(actionTitle,callback){
	var sockets = socketIO.sockets.sockets;					
	for (var key in sockets) {
	  if (sockets.hasOwnProperty(key)) {
		sockets[key].on(actionTitle, function (data) {
			callback(data);
		});
	  }
	}
}

var titleTimeout;
function setupSpeechRecognition(){
	var apiKey = getAPIKey("Google Speech");
	speechRecognizer = new SpeechRecognizer(apiKey).start(function(){
		view.setUIMode(FULL_MODE);
		view.showSpeechButton()
		view.setSpeechButtonActive(true)
		view.setTitle("Listening...");
		if(titleTimeout){
			clearTimeout(titleTimeout);
		}
	})
	.result(function(text){
		console.log(text);
		view.setUIMode(SMALL_MODE);
		view.setSpeechButtonActive(false)
		view.setTitle(text);
		launchAppWithQuery(text);
	})
	.error(function(message){
		view.showToast(message,8000);
		setTimeout(setupSpeechRecognition,8000);
		speechRecognizer.kill();
	})
	.fail(function(){
		view.setTitle("Sorry, didn't catch that");
		titleTimeout = setTimeout(function(){
			view.setTitle("Clap to begin!");
			view.setUIMode(SMALL_MODE);
		},3000);
	});
}

function setMicrophoneEnabled(enabled){
	speechRecognizer.enabled = enabled;
	if(!enabled){
		view.showToast("Microphone disabled");
	}
}

function setGestureRecognitionEnabled(enabled,webview){
	if(sys_config.motion_sensors == false)
		return;
	
	gesturesEnabled = enabled
	if(enabled){
		gestureRecognizer = new GestureRecognizer().result(function(gesture){
			if(gesturesEnabled){
				view.showSensorIndicators(gesture);
				webview.send('gesture',gesture);
			}else{
				this.kill();
			}
		});
	}else if(gestureRecognizer){
		gestureRecognizer.kill();
	}
}

function setSensorDataEnabled(enabled,webview){
	if(sys_config.motion_sensors == false)
		return;
		
	readSensorData = enabled;
	if(enabled){
		var leftSensorReader = new SensorReader("sensors_raw_left").result(function(data){
			if(readSensorData){
				webview.send('sensorData',data,900);
			}else{
				this.kill();
			}
		});
		var rightSensorReader = new SensorReader("sensors_raw_left").result(function(data){
			if(readSensorData){
				webview.send('sensorData',data,901);
			}else{
				this.kill();
			}
		});
	}
}

function launchAppWithQuery(q){
	var query = q.toLowerCase();
	var appToLaunch = findAppToLaunchWithQuery(query);
	if(appToLaunch!=-1){
		launchApp(appToLaunch,query);
	}
}

function launchApp(app,query){
	var connectedDevices = socketIO.engine.clientsCount;
	console.log("Connected devices: "+connectedDevices);
	if(app == currentApp){
		//If app is already open send query
		var webview = document.querySelector("#mainAppView");
		if(query){
			webview.send('query',query);
			console.log("Sent query '"+query+"' to app "+app.name);
		}
		socketIO.emit('current-app',getCurrentAppIndex());
		socketIO.emit('app-launched',getCurrentAppIndex());
		if(connectedDevices > 0){
			webview.send('remoteConnect');
		}
	}else{		
		//If app is not open, open it with query
		var title = query ? query : "";
		view.setSubtitle("");
		view.setTitle(title);
		view.setUIMode(FULL_MODE)
		var label = app == appData[home_app_index] ? "" : app.name;
		if(label!=""){
			view.showSplashWithTitle(label);
		}
		
		currentApp = app;
		console.log("Launching app "+app.name);
		
		setMicrophoneEnabled(true);
		
		readSensorData = false;
			
		setGestureRecognitionEnabled(false);

		var container = document.querySelector('#content');
		container.empty();
		
		var app_url = APP_DIR+app.package+"/index.html";

		var webview = document.createElement('webview');
		webview.addClass('appView');
		webview.id = "mainAppView";
		webview.preload = "mirror-ipc.js";
		webview.setAttribute('nodeintegration', true);
		webview.src = app_url;
		container.appendChild(webview)
				
		webview.addEventListener("did-startloading",function(){
			console.log("started loading");
		});
		
		socketIO.emit('current-app',getCurrentAppIndex());
		
		var loaded = false;
		webview.addEventListener("did-stop-loading",function(){
			if(!loaded){
				console.log("App loaded");
				
				view.setSubtitle(app.name);
				view.hideSplash();
				
				if(query){
					webview.send('query',query);
				}
				
				socketIO.emit('app-launched',getCurrentAppIndex());
				if(connectedDevices > 0){
					webview.send('remoteConnect');
				}
				
				//webview.openDevTools();
				loaded = true;
			}
		});
		
		webview.addEventListener('console-message', function(e) {
			console.log(app.name+':', e.message);
		});
		
		setupAPI(webview);
	}
}

function setupAPI(webview){
	webview.addEventListener('ipc-message', function(event) {
		if(event.channel == 'setTitle'){
			var title = event.args[0];
			view.setTitle(title);
		}else if(event.channel == 'setMicrophoneEnabled'){
			var enabled = event.args[0];
			setMicrophoneEnabled(enabled);
		}else if(event.channel == 'setGestureRecognitionEnabled'){
			var enabled = event.args[0];
			setGestureRecognitionEnabled(enabled,webview);
		}else if(event.channel == 'setSensorDataEnabled'){
			var enabled = event.args[0];
			setSensorDataEnabled(enabled,webview);
		}else if(event.channel == 'showToast'){
			var message = event.args[0];
			var length = event.args[1];
			view.showToast(message,length);
		}else if(event.channel == 'showAlert'){
			var title = event.args[0];
			var message = event.args[1];
			var alertId = event.args[2];
			showAlert(title,message,webview,alertId);
		}else if(event.channel == 'setMediaHeader'){
			var title = event.args[0];
			var uri = event.args[1];
			var type = event.args[2];
			var mediaHeader = {title:title,uri:uri,type:type,appIndex:getCurrentAppIndex()};
			if(socketIO){
				socketIO.emit('media-header-setup',mediaHeader);
			}
		}else if(event.channel == 'addRemoteAction'){
			var actionTitle = event.args[0];
			var actionId = event.args[1];
			var type = event.args[2];
			if(socketIO){
				socketIO.emit('add-action',{title:actionTitle,id:actionId,type:type,appIndex:getCurrentAppIndex()});
				listenToAllClients('action-trigger-'+actionId,function(data){
					webview.send('remoteAction',data.actionId,data.param);
				});
			}
		}
	});
}

function installApp(url){
	var AppInstaller = require('./core/app-installer.js');
	view.showToast("Installing app from "+url);
	var installer = new AppInstaller();
	installer.install(url,function(){
		view.showToast("App installed successfully!");
		loadApps(sys_config).then(function(list){
			appData = list;
			socketIO.emit('app-list',{apps:appData,home_app:home_app_index});
		});
	},function(error){
		view.showToast(error);
	});
}

function loadApps(sys_config){
	var fs = require('fs');
	var Q = require('q');
	var path = require('path');
	
	appData=[];
	
	function getDirectories(srcpath) {
	  return fs.readdirSync(srcpath).filter(function(file) {
		return fs.statSync(path.join(srcpath, file)).isDirectory();
	  });
	}
	
	function readManifest(path){
		var readFile = Q.denodeify(fs.readFile);
		var deferred = Q.defer();
		readFile(path).then(function(data){
			deferred.resolve(data);
		}).fail(function(){
			deferred.resolve();
		});
		return deferred.promise;
	}
	
	var appList = getDirectories(APP_DIR);
	console.log(appList);
		
	var deferred = Q.defer();
	var promises = [];
	for(var i=0;i<appList.length;i++){
		var appDirName = appList[i];
		console.log(appDirName);
		promises.push(readManifest(APP_DIR+appDirName+"/manifest.json"));
	}
	Q.all(promises).then(function(appDataList){
		var resultList = [];
		var homeApp;
		for(var i=0;i<appDataList.length;i++){
			//TODO: Check for parse errors
			var raw = appDataList[i];
			if(raw != undefined && raw.length>0){
				var data = JSON.parse(appDataList[i]);
				console.log(data);
				resultList.push(data);
				if(data.package == sys_config.home_app){
					home_app_index = i;
					console.log("Home app:"+data.package);
				}else if(data.package == sys_config.assistant_app){
					assistant_app_index = i;
					console.log("Assistant app:"+data.package);
				}
			}
		}
		deferred.resolve(resultList);
	}).fail(function(error){
		console.log(error);
	}).done();
	return deferred.promise;
}

// Goes through all the installed apps keyword's and finds the matching app
// TODO: Improve to handle the case where more than one app has the same keyword 
function findAppToLaunchWithQuery(query){
	for(var i=0;i<appData.length;i++){
		var app = appData[i];
		var commands = app.keywords;
		
		// Find command
		var j = 0;
		var commandMatch = commands[j].toLowerCase();
		while(j<commands.length-1 && query.indexOf(commandMatch)<0){
			j++;
			commandMatch = commands[j];
		}
		
		if(query.indexOf(commandMatch)>=0){
			console.log(commandMatch);
			return app;
		}
	}
	if(assistant_app_index > -1){
		return appData[assistant_app_index];
	}
	return -1;
}

function clearConfigCache(){
	delete require.cache[require.resolve('../config.json')]
}

function getAPIKey(keyName){
	var api_keys = sys_config.api_keys;
	if(typeof(api_keys[keyName]) !== "undefined" && api_keys[keyName].value.length > 0){
		return api_keys[keyName].value;
	}else{
		view.showToast("This app may not work as intented because it needs access to a "+keyName+" key. Add one in the config.json file",8000);
		return null;
	}
}

window.onbeforeunload = function () {
	if(gestureRecognizer){
		gestureRecognizer.kill();
	}
	if(speechRecognizer){
		speechRecognizer.kill();
	}
};
