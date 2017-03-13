function getIPAddress(){
	//set IP
	var wlanAddress = require('os').networkInterfaces().wlan0;
	var ethAddress = require('os').networkInterfaces().eth0;
	var localIP = "No internet";
	if(wlanAddress){
		localIP = wlanAddress[0].address
	}else if(ethAddress){
		localIP = ethAddress[0].address;
	}
	return localIP;
}

function getCurrentAppIndex(){
	return appData.indexOf(currentApp);
}

function makeDir(dir){
	if (!fs.existsSync(dir)){
		fs.mkdirSync(dir);
	}	
}

function installAppDependencies(cwd){
	var Q = require('q');
	var spawn = require("child_process").spawn;
	var deferred = Q.defer();
	var command = "npm";
	var args = ["install"];

    console.log("Executing ",command, args.join(" "), "# in", cwd);

    var proc = spawn(command, args, {
        cwd: cwd,
    });
    proc.on("error", function (error) {
        deferred.reject(new Error(command + " " + args.join(" ") + " in " + cwd + " encountered error " + error.message));
    });
    proc.on("exit", function(code) {
		console.log(code);
        if (code !== 0) {
            deferred.reject(new Error(command + " " + args.join(" ") + " in " + cwd + " exited with code " + code));
        } else {
            deferred.resolve();
        }
    });
	return deferred.promise;
}
