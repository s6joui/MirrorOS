
var REMOTE_ACTION_TYPE_INPUT = "input";
var REMOTE_ACTION_TYPE_BUTTON = "button";
var MEDIA_HEADER_LAYOUT_FULL = 799;
var MEDIA_HEADER_LAYOUT_PLAY_PAUSE = 800;

var socket;
var currentAppIndex;
var homeAppIndex=0;

var appList = [];
		
window.onload=function(){
	var host = window.location.host;
	host = host.indexOf(":3000") > 0 ? host.replace(":3000","") + ":8888" : host + ":8888";
	console.log(host);
	connect(host);
	setupWebSpeechAPI();
	$("#mic-fab").click(function(){
		startVoiceRecognition();
	});
	
	$("#headerButton").click(function(){
		var appUrl = prompt("Install an app","App url");
		if(appUrl!=null)
			socket.emit('install-app',appUrl);
	});
	$("#closeButton").click(function(){
		closeAppView();
		socket.emit('launch-app',homeAppIndex);
	});
}

function loadApps(list){
	$("#appGrid").empty();
	appList = list;
	for(var i=0;i<list.length;i++){
		if(i!=homeAppIndex){
			var app = appList[i];
			var icon = $("<div class='appIcon'><div class='innerIcon' style='background:"+app.color+"'>"+app.name.substring(0,1)+"</div>"+app.name+"</div>");
			icon.appendTo("#appGrid");
			(function(_i,_icon,_app) {
			   _icon.click(function(){
					socket.emit('launch-app',_i);
			   });
			}(i,icon,app));
		}
	}
}

function launchApp(index,icon){
	if(index != homeAppIndex){
		currentAppIndex = index;
		var app = appList[index];
		/*var el = icon.find(".innerIcon");
		var x = el.position().left+10;
		var y = el.position().top;
		console.log(x,y);
		el.css("transform","translate(-"+x+"px,-"+y+"px) scale(8)");
		el.addClass("launchingApp");*/
		$("#appActions").empty();
		$("#appTitle").text(app.name);
		$("#appBar").css("background",app.color);
		$("#appMediaHeader").css("background-color",app.color);
		$("#headerTitle").show().text(app.name);
		$("#appView").css("background-color",app.color);
		$("#browser-color").attr("content",app.color);
		var x = icon ? icon.position().left+50 : 0;
		var y = icon ? icon.position().top : 0;
		$("#appView").css("display","block");
		$("#appView").css("-webkit-transform-origin",x+"px,"+y+"px");
		$("#appView").css("transform","scale(0)");
		setTimeout(function(){
			$("#appView").css("transform","scale(1)");
		},50);
	}
}

function closeAppView(){
	$("#appActions").empty();
	$("#appView").hide(300);
	$("#appMediaHeader").css("background-image","none");
	$("#headerTitle").text("");
	$("#browser-color").attr("content","#ffffff");
	$(".media-control").hide();
	currentAppIndex = 0;
}

function connect(host){
	localStorage.host = host;
	socket = io(host);
							
	socket.on('connect', function (){
		console.log("Connected!");
	});
	
	socket.on('app-list', function (data){
		var appList = data.apps;
		homeAppIndex = data.home_app;
		loadApps(appList);
	});
		
	socket.on('current-app', function (appIndex){
		launchApp(appIndex);
	});
	
	socket.on('app-launched', function (appIndex){
		if(appIndex == currentAppIndex){
			//TODO hide loader
			console.log("load complete");
			$("#headerTitle").fadeOut();
		}
	});
		
	socket.on('media-header-setup', function (mediaHeader){
		var appIndex = mediaHeader.appIndex;
		if(appIndex == currentAppIndex){
			$("#appMediaHeader").css("background-image","url('"+mediaHeader.uri+"')");
			$("#headerTitle").show().text(mediaHeader.title);
		}
	});
		
	socket.on('add-action', function (action){
		var appIndex = action.appIndex;
		if(appIndex == currentAppIndex){
			var actionTitle = action.title;
			var actionId = action.id;
			var actionType = action.type;
			$("#appView").css("background-color","white");
			var actionEl = $("<button class='actionButton'>"+actionTitle+"</button>");
			actionEl.click(function(){
				if(actionType == REMOTE_ACTION_TYPE_BUTTON){
					triggerAction(actionId);
				}else{
					var val = prompt(actionTitle);
					if(val){
						triggerAction(actionId,val);
					}
				}
			});
			actionEl.hide().appendTo("#appActions").fadeIn(500);
		}
	});
			
	/*socket.on('action-reset', function (actions){
		$("#remoteActions").empty();
		$("#remoteMediaHeader").empty();
	});
		
	socket.on('title', function (title){
		$("#mQuery").val(title);
	});*/
		
	socket.on('disconnect', function (){
		closeAppView();
		$("#remoteActions").empty();
		$("#remoteMediaHeader").empty();
		$("#appGrid").empty();
	});
}
function triggerAction(actionId,param){
	console.log("triggering action "+actionId);
	var data = {actionId:actionId,param:param};
	socket.emit('action-trigger-'+actionId,data);
}

function sendQuery(){
	var q = document.querySelector("#mQuery").value;
	console.log("sending "+q);
	socket.emit('query',q);
}

function inputLeft(){
	socket.emit('input',10);
}

function inputRight(){
	socket.emit('input',11);
}

var recognizing=false;
var ignore_onend;
var final_transcript;
var recognition;
var supportsSpeechApi = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);

function setupWebSpeechAPI(){
	if (!supportsSpeechApi) {
	  console.log("Speech recognition not supported");
	} else {
	  recognition = new webkitSpeechRecognition();
	  recognition.continuous = true;
	  recognition.interimResults = true;
	  
	  recognition.onstart = function() {
		recognizing = true;
		$("#mic-fab").addClass("active");
		$("#voice-input").addClass("active")
		setTimeout(function(){
			$("#voice-input").text("Listening...");
		},300);
	  };
	  
	  recognition.onerror = function(event) {
		$("#mic-fab").removeClass("active");
		$("#voice-input").removeClass("active")
		$("#voice-input").text("");
		ignore_onend = true;
	  };
	  
	  recognition.onend = function() {
		recognizing = false;
		if (ignore_onend) {
			return;
		}
		console.log(final_transcript);
		socket.emit('query',final_transcript);
		$("#mic-fab").removeClass("active");
		setTimeout(function(){
			$("#voice-input").removeClass("active")
			$("#voice-input").text("");
		},1000);
		if (!final_transcript) {
			return;
		}
	  };
	  
	  recognition.onresult = function(event) {
		var interim_transcript = '';
		for (var i = event.resultIndex; i < event.results.length; ++i) {
		  if (event.results[i].isFinal) {
			final_transcript = event.results[i][0].transcript;
		  } else {
			interim_transcript = event.results[i][0].transcript;
		  }
		}
		$("#voice-input").text(final_transcript);
	  };
	  
	}
}
function startVoiceRecognition(event) {
	if(supportsSpeechApi){
	  if (recognizing) {
		recognition.stop();
		return;
	  }
	  final_transcript = '';
	  recognition.lang = "en-GB";
	  recognition.start();
	  ignore_onend = false;
	}else{
		socket.emit('trigger-voice');
	}
}

