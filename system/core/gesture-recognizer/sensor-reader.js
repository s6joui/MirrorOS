var SensorReader = function(sensor) {
	
	this.sensor = sensor;
	this.resultCallback;
	this.process;
	
	this.init = function(){
		var that = this;
		var spawn = require('child_process').spawn;
		this.process = spawn("python",["-u",SYSTEM_DIR+"/core/gesture-recognizer/"+this.sensor+".py"]);

		this.process.stdout.on('data', function (data) {
			var distance = (""+data).trim();
			if (distance.length>0 && !isNaN(parseFloat(distance))){	
				that.resultCallback(distance);
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
module.exports = SensorReader;
