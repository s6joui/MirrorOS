var ipc = require('electron').ipcRenderer;
var api_keys = require('../config.json').api_keys;

global.GESTURE_LEFT = 0;
global.GESTURE_RIGHT = 1;
global.GESTURE_HOLD_LEFT = 10;
global.GESTURE_HOLD_RIGHT = 11;
global.GESTURE_SWIPE_LEFT = 100;
global.GESTURE_SWIPE_RIGHT = 111;
global.GESTURE_RESET = 54;

global.MEDIA_HEADER_ACTION_PAUSE = 795;
global.MEDIA_HEADER_ACTION_PLAY = 796;
global.MEDIA_HEADER_ACTION_NEXT = 797;
global.MEDIA_HEADER_ACTION_PREVIOUS = 798;

global.MEDIA_HEADER_LAYOUT_FULL = 799;
global.MEDIA_HEADER_LAYOUT_PLAY_PAUSE = 800;

global.REMOTE_ACTION_TYPE_INPUT = "input";
global.REMOTE_ACTION_TYPE_BUTTON = "button";

global.SENSOR_DISTANCE_LEFT = 900;
global.SENSOR_DISTANCE_RIGHT = 901;

MirrorOS = function(ipc) {
    this.setTitle = function(title) {
		ipc.sendToHost('setTitle',title);
    };
    this.setMicrophoneEnabled = function(enable) {
		ipc.sendToHost('setMicrophoneEnabled',enable);
    };
    this.setGestureRecognitionEnabled = function(enable) {
		ipc.sendToHost('setGestureRecognitionEnabled',enable);
    };
    this.setSensorDataEnabled = function(enable) {
		ipc.sendToHost('setSensorDataEnabled',enable);
    };
    this.showToast = function(msg,len) {
		ipc.sendToHost('showToast',msg,len);
    };
    this.showAlert = function(title,msg,alertId) {
		ipc.sendToHost('showAlert',title,msg,alertId);
    };
	this.setMediaHeader = function(headerTitle,headerUri,headerType) {
		ipc.sendToHost('setMediaHeader',headerTitle,headerUri,headerType);
	};
	this.addRemoteAction = function(actionTitle,actionId,actionType) {
		actionType = actionType ? actionType : global.REMOTE_ACTION_TYPE_BUTTON;
		ipc.sendToHost('addRemoteAction',actionTitle,actionId,actionType);
	};
	this.getAPIKey = function(keyName) {
		if(typeof(api_keys[keyName]) !== "undefined" && api_keys[keyName].value.length > 0){
			return api_keys[keyName].value;
		}else{
			this.showToast("This app may not work as intented because it needs access to a "+keyName+" key. Add one in the config.json file",8000);
			return null;
		}
	};
	
	this.onNewQuery = function(){};
	this.onGesture = function(){};
	this.onAlertPositiveOption = function(){};
	this.onAlertNegativeOption = function(){};
	this.onRemoteAction = function(){};
	this.onRemoteConnect = function(){};
	this.onSensorData = function(){};
}

global.MOS = new MirrorOS(ipc);

ipc.on('query',(event, msg) => {
	global.MOS.onNewQuery(msg);
});

ipc.on('gesture',(event, gesture) => {
	global.MOS.onGesture(parseInt(gesture));
});

ipc.on('alertPositive',(event, alertId) => {
	global.MOS.onAlertPositiveOption(parseInt(alertId));
});

ipc.on('alertNegative',(event, alertId) => {
	global.MOS.onAlertNegativeOption(parseInt(alertId));
});

ipc.on('remoteAction',(event, actionId, param) => {
	global.MOS.onRemoteAction(actionId,param);
});

ipc.on('remoteConnect',(event, msg) => {
	global.MOS.onRemoteConnect();
});

ipc.on('sensorData',(event, data, sensorId) => {
	global.MOS.onSensorData(data,sensorId);
});
