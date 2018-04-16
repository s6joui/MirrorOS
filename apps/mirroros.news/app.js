var apiKey = MOS.getAPIKey("News API");
var emptyContainer;
var currentArticle = -1;
var articles;

window.onload = function(){
	emptyContainer = document.getElementById("container").cloneNode(true);
	MOS.JSONGetRequest("https://newsapi.org/v1/articles?source=engadget&sortBy=latest&apiKey="+apiKey,null, function(data1) {
		MOS.JSONGetRequest("https://newsapi.org/v1/articles?source=bbc-sport&sortBy=top&apiKey="+apiKey,null, function(data2) {
			MOS.JSONGetRequest("https://newsapi.org/v1/articles?source=associated-press&sortBy=latest&apiKey="+apiKey,null, function(data3) {
				articles = mergeArrays({source:"Engadget",data:data1.articles},{source:"BBC Sport",data:data2.articles},{source:"Associated Press",data:data3.articles});
				preloadImages(articles);
				loadNextArticle();
			});
		});
	});
}

function loadNextArticle(){
	if(currentArticle < articles.length-1){
		currentArticle++;
	}else{
		currentArticle = 0;
	}
	var article = articles[currentArticle];
	var containerEl = document.querySelector("#container");
	var headlineEl = document.querySelector("#headline");
	var progressEl = document.querySelector("#progress");
	var imageEl = document.querySelector("#image");
	var descriptionEl = document.querySelector("#description");
	var sourceEl = document.querySelector("#source");
	var dateEl = document.querySelector("#date");
	headlineEl.innerHTML = article.title;
	descriptionEl.innerHTML = article.description;
	sourceEl.innerHTML = article.source;
	dateEl.innerHTML = new Date(article.publishedAt).toDateString();
	progressEl.className="animate";
	containerEl.style.transform="translateX(0%)";
	containerEl.style.opacity="1";
	if(article.urlToImage!=null){
		imageEl.style.backgroundImage = "url('"+article.urlToImage+"')";
	}else{
		imageEl.remove();
	}
	setTimeout(function(){
		containerEl.className="fade";
		setTimeout(function(){
			containerEl.remove();
			emptyContainer.clone().appendTo('body');
			setTimeout(function(){
				loadNextArticle();
			},50);
		},500);
	},11000)
}

function preloadImages(articles){
  for(var i=0;i<articles.length;i++){
    var img = new Image();
    img.src = articles[i].urlToImage;
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

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}