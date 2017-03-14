//var twitterApiKey = MOS.getAPIKey("Twitter");
var emptyContainer;
var currentArticle = -1;
var currentTag;
var articles = [];
var playing = false;

var InstagramAPI = require('./instagram_api.js');
var instagramAPI = new InstagramAPI();

MOS.onRemoteConnect = function(){
	MOS.addRemoteAction('Hashtag search',0,REMOTE_ACTION_TYPE_INPUT);
}

MOS.onRemoteAction = function(actionId, query){
	if(actionId==0){
		loadTag(query);
	}
}

MOS.onNewQuery = function(query){
	var q = query.replace(/instagram| on | |hashtag/g, "");
	console.log(q);
	loadTag(q);
}

MOS.onLoad = function(cleanLaunch){
	emptyContainer = $("#container").clone();
	if(cleanLaunch){
		loadTag("SmartMirror");
	}
}

function loadTag(tag){
	console.log("Loading "+tag);
	currentTag = tag;
	currentArticle = 0;
	articles = [];
	instagramAPI.getTag(tag, function(tag,data){
		MOS.setTitle("#"+tag);
		if(data.length>0){
			for(var i=0;i<data.length;i++){
				var post = data[i];
				articles.push({
					image : post.display_src,
					text : post.caption,
					source : 'Instagram'
				})
			}
			console.log(articles);
			if(!playing)
				loadNextArticle();
		}
	});
}

function loadNextArticle(){
	if(articles.length>0){
		console.log(articles.length);
		playing = true;
		if(currentArticle < articles.length){
			var article = articles[currentArticle];
			var containerEl = document.querySelector("#container");
			var headlineEl = document.querySelector("#headline");
			var progressEl = document.querySelector("#progress");
			var imageEl = document.querySelector("#image");
			var descriptionEl = document.querySelector("#description");
			var sourceEl = document.querySelector("#source");
			var dateEl = document.querySelector("#date");
			descriptionEl.innerHTML = article.text;
			sourceEl.innerHTML = article.source;
			progressEl.className="animate";
			containerEl.style.transform="translateX(0%)";
			containerEl.style.opacity="1";
			if(article.image!=null){
				imageEl.style.backgroundImage = "url('"+article.image+"')";
			}else{
				$(imageEl).remove();
			}
			setTimeout(function(){
				containerEl.className="fade";
				setTimeout(function(){
					$(containerEl).remove();
					emptyContainer.clone().appendTo('body');
					setTimeout(function(){
						loadNextArticle();
					},50);
				},500);
			},11000);
			currentArticle++;
		}else{
			playing = false;
			loadTag(currentTag);
		}
	}
}

function preloadImages(articles){
  for(var i=0;i<articles.length;i++){
    var img = new Image();
    img.src = articles[i].image;
  }
}

function mergeArrays(){
  var result = [];
  var a1 = arguments[0].data;
  for(var i=0;i<a1.length;i++){
    for (var j = 0; j < arguments.length; j++) {
      var item = arguments[j].data[i];
      if(item){
        item["source"] = arguments[j].source;
        result.push(item);
      }
    }
  }
  return result;
}
