var GestureRecognizer = function() {
	
	this.resultCallback;
	this.process;
	
	this.init = function(){
		var that = this;
		var spawn = require('child_process').spawn;
		this.process = spawn("python",["-u",SYSTEM_DIR+"/core/gesture-recognizer/gestures.py"]);
		this.process.stdout.on('data', function (data) {
			var gesture = (""+data).trim();
			if (gesture.length > 0 && !isNaN(parseInt(gesture))){	
				console.log(parseInt(gesture));
				that.resultCallback(gesture);
			}
		});

		this.process.stderr.on('data', function (data) {
			console.log('stderr: ' + data);
		});
	};
	
	this.result = function(callback){
		this.resultCallback = callback;
		return this;
	}
	
	this.kill = function(){
		this.process.kill();
	}
	
	this.init();
	
};
module.exports = GestureRecognizer;
