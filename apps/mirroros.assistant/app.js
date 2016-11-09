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
	
	var container = $('#grid');
	var chatContainer = $('#chat-container');
	container.click(function(){
		showViewer(0);
	});
	container.css("top","100%");
	container.empty();
	container.hide();
	chatContainer.empty();
	chatContainer.hide();
	
	var searchingForPictures = query.indexOf("picture")>=0 || query.indexOf("photos")>=0;
	if(searchingForPictures){
		container.show();
		var params = {
			// Request parameters
			"q": query,
			"count": "35",
			"offset": "0",
			"mkt": "en-us",
			"safeSearch": "Moderate",
		};

		$.ajax({
			url: "https://api.cognitive.microsoft.com/bing/v5.0/images/search?" + $.param(params),
			beforeSend: function(xhrObj){
				// Request headers
				xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key",BING_KEY);
			},
			type: "GET"
		}).done(function(result) {
			pictureList = result.value;
			for(var i = 0;i<pictureList.length;i++){
				var item = pictureList[i];
				var picDiv = $("<div class='imageResult' style=\"background-image:url('"+item.thumbnailUrl+"')\"/>");
				picDiv.appendTo(container);
			}
			container.css("top","0%");
		});
	}else{
		chatContainer.show();
		addChatBubble(query+"?",'chat-query');
		var url = "http://api.wolframalpha.com/v2/query?input="+query+"&appid="+WOLFRAM_KEY+"&output=json";
		var loader = addChatBubble("...",'chat-loading-answer');
		$.get(url,function(result){
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
	var el = $("<p class='chat-bubble "+className+"'>"+text+"</p>");
	$("#chat-container").prepend(el);
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
	var viewer = $('#viewer');
	viewer.show();
	var pic = pictureList[currentPicture];
	$('#picture').css("background-image","url('"+pic.contentUrl+"')");
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
	$("#viewer").hide();
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
