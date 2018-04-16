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
				if(json.graphql.hashtag.edge_hashtag_to_media){
					if(json.graphql.hashtag.edge_hashtag_to_media.length>0){
						callback(tag,json.graphql.hashtag.edge_hashtag_to_media.edges);
					}else if(json.graphql.hashtag.edge_hashtag_to_top_posts){
						callback(tag,json.graphql.hashtag.edge_hashtag_to_top_posts.edges);
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
