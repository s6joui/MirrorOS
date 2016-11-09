var SpeechRecognizer = function(key) {
	
	this.startCallback;
	this.resultCallback;
	this.failCallback;
	this.errorCallback;
	
	this.enabled = true;
	this.apiKey = key;
	this.micListener;
	
	this.init = function(){
		//Listen for claps on mic
		var that = this;
		var spawn = require('child_process').spawn;
		that.micListener = spawn("python",["-u",SYSTEM_DIR+"/core/mic.py",that.apiKey]);
		that.micListener.stdout.on('data', function (data) {
			var stringData = (""+data).trim();
			if(that.enabled && stringData.length>0){
				console.log(stringData);
				if(stringData === "TRIG"){
					that.startCallback();
				}else if(stringData.startsWith("{")){
					var query = parseResponse(stringData);
					if(query != -1){
						that.resultCallback(query);
					}else{
						that.failCallback();
					}
				}else{
					that.errorCallback(stringData);
				}
			}
		});

		that.micListener.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
	};
	
	this.start = function(callback){
		this.startCallback = callback;
		return this;
	}
	
	this.result = function(callback){
		this.resultCallback = callback;
		return this;
	}
	
	this.error = function(callback){
		this.errorCallback = callback;
		return this;
	}
	
	this.fail = function(callback){
		this.failCallback = callback;
		return this;
	}
	
	this.kill = function(){
		this.micListener.kill();
	}
	
	if(key && key.length>0){
		this.init();
	}
};
module.exports = SpeechRecognizer;

function parseResponse(response){
	// Remove firs line because API returns it empty
	var response = response.replace("{\"result\":[]}","").trim();
	if(response.length > 0){
		var json = JSON.parse(response);
		//If there's a repsonse, parse result 
		if(json.result.length>0){
			var json = JSON.parse(response);
			var result = json.result[0].alternative[0].transcript;
			return result;
		}
	}
	//Return -1 if no response
	return -1;
}
