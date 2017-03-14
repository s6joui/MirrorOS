var IntagramAPI = function() {
	this.getTag = function(tag,callback){
		var http = require('follow-redirects').http;
        var options = {
          host: 'www.instagram.com',
          path: "/explore/tags/"+tag+"/?__a=1"
        };

        http.get(options, function (http_res) {
            var data = "";
            http_res.on("data", function (chunk) {
                data += chunk;
            });
            http_res.on("end", function () {
				var json = JSON.parse(data);
				if(json.tag.media.nodes){
					if(json.tag.media.nodes.length>0){
						callback(tag,json.tag.media.nodes);
					}else if(json.tag.top_posts){
						callback(tag,json.tag.top_posts.nodes);
					}else{
						console.log("No data found");
						callback(tag,[]);
					}
				}
            });
        });
    }
};
module.exports = IntagramAPI;
