var pictureList = [];
var currentPicture = 0;
var viewerOpen = false;
var currentQuery;

var BING_KEY = MOS.getAPIKey("Bing Image Search");
var WOLFRAM_KEY = MOS.getAPIKey("WolframAlpha");
				
MOS.setGestureRecognitionEnabled(true);

MOS.onRemoteConnect = function(){
	MOS.addRemoteAction('Search',0,REMOTE_ACTION_TYPE_INPUT);
}

MOS.onNewQuery = function(query){
	hideViewer();
	loadResultsForQuery(query);
}
		
MOS.onRemoteAction = function(actionId, searchQuery){
	if(actionId==0){
		loadResultsForQuery(searchQuery);
	}else{
		if(!viewerOpen){
			showViewer(0);
		}else{
			if(actionId == MEDIA_HEADER_ACTION_NEXT){
				nextPic();
			}else if(actionId == MEDIA_HEADER_ACTION_PREVIOUS){
				prevPic();
			}
		}
	}
}
		
function loadResultsForQuery(query){
	MOS.setTitle(query)
	currentQuery = query;
	console.log(query);
	
	var container = document.getElementById('grid');
	var chatContainer = document.getElementById('chat-container');
	container.onclick = function(){
		showViewer(0);
	};
	container.style.top="100%";
	container.innerHTML = '';
	container.hide();
	chatContainer.innerHTML = '';
	chatContainer.hide();
	
	var searchingForPictures = query.indexOf("picture")>=0 || query.indexOf("photos")>=0;
	if(searchingForPictures){
		container.show();
		
		var finalQuery = query.replace(/pictures of |photos of|pictures|photos/g, "").trim();
		var params = "?q="+encodeURIComponent(finalQuery)+"&count=35&offset=0&mkt=en-us&safeSearch=Moderate";
		var url = "https://api.cognitive.microsoft.com/bing/v7.0/images/search";
		var header = {"Ocp-Apim-Subscription-Key":BING_KEY};
		console.log(BING_KEY);
		MOS.JSONGetRequest(url+params,header,function(result){
			pictureList = result.value;
			for(var i = 0;i<pictureList.length;i++){
				var item = pictureList[i];
				var picDiv = document.createElement("div");
				picDiv.className = "imageResult";
				picDiv.style.backgroundImage="url('"+item.thumbnailUrl+"')";
				container.appendChild(picDiv);
			}
			container.style.top="0%";
		});
	}else{
		chatContainer.show();
		addChatBubble(query+"?",'chat-query');
		var url = "http://api.wolframalpha.com/v2/query?input="+query+"&appid="+WOLFRAM_KEY+"&output=json";
		var loader = addChatBubble("...",'chat-loading-answer');
		MOS.JSONGetRequest(url,null,function(result){
			loader.remove();
			var data = printWolframData(result);
		});
	}
}

function printWolframData(result){
	var data = JSON.parse(result);
	console.log(data);
	var pods = data.queryresult.pods;
	var speechText = "";
	if(pods){
		var input = pods[0];
		for(var i=1;i<3;i++){
			var answer = pods[i];
			if(answer){
				var text = answer.subpods[0].plaintext.trim();
				var image = answer.subpods[0].img;
				var title = answer.title;
				if((text.length > 50 && image) || title == "Image" || text.length == 0){
					var src = unescape(image.src)
					var preload = new Image();
					preload.src = src;
					(function(_src) {
						preload.addEventListener('load',function(){
							addChatBubble("<img src='"+_src+"'>",'chat-answer');
						});
					}(src));
				}else{
					speechText = speechText.length > 0 ? speechText+". "+text : text;
					console.log(text);
					console.log(speechText);
					addChatBubble(text,'chat-answer');
				}	
			}
		}
		//TTS
		if(speechText.length > 0){
			var ttsUrl = "http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q="+speechText+"&tl=En-gb";
			var speech = new Audio(ttsUrl);
			speech.play();
		}
	}else{
		addChatBubble("Sorry, I don't know",'chat-answer');
	}
}

function addChatBubble(text,className){
	var el = document.createElement("p");
	el.className = "chat-bubble";
	el.textContent = text;
	chatContainer.insertBefore(el, chatContainer.firstChild);
	return el;
}

MOS.onGesture = function(gesture){
	if(gesture == GESTURE_SWIPE_LEFT){
		if(!viewerOpen){
			showViewer(0);
		}else{
			prevPic();
		}
	}else if(gesture == GESTURE_SWIPE_RIGHT){
		if(!viewerOpen){
			showViewer(0);
		}else{
			nextPic();
		}
	}else if(gesture == GESTURE_HOLD_LEFT){
		if(!viewerOpen){
			showViewer(0);
		}else{
			prevPic();
		}
	}else if(gesture == GESTURE_HOLD_RIGHT){
		if(!viewerOpen){
			showViewer(0);
		}else{
			nextPic();
		}
	}
}	
	
function showViewer(index){
	currentPicture = index;
	console.log(index);
	viewerOpen = true;
	var viewer = document.getElementById('viewer');
	viewer.show();
	var pic = pictureList[currentPicture];
	document.getElementById('picture').style.backgroundImage = "url('"+pic.contentUrl+"')";
	MOS.setMediaHeader(currentQuery,pic.contentUrl,"image");
}

function nextPic(){
	if(currentPicture < pictureList.length-1){
		currentPicture++;
		showViewer(currentPicture);
	}
}		

function prevPic(){
	if(currentPicture > 0){
		currentPicture--;
		showViewer(currentPicture);
	}
}		

function hideViewer(){
	currentPicture = 0;
	var viewer = document.getElementById('viewer');
	viewer.hide();
	viewerOpen = false;
}		
		
document.onkeydown = checkKey;
function checkKey(e) {
	if(viewerOpen){
		if(event.keyCode == 37){
			prevPic();
		}else if(event.keyCode == 39){
			nextPic();
		}else if(event.keyCode == 27){
			hideViewer();
		}
	}
}
		
HTMLElement.prototype.show = function() {
	this.style.opacity = "1";
}

HTMLElement.prototype.hide = function() {
	this.style.opacity = "0";
}
