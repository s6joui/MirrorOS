function getIPAddress(){
	
	var localIP = "No internet";

	var os = require('os');
	var ifaces = os.networkInterfaces();

	Object.keys(ifaces).forEach(function (ifname) {
	  var alias = 0;

	  ifaces[ifname].forEach(function (iface) {
		if ('IPv4' !== iface.family || iface.internal !== false) {
		  // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
		  return;
		}

		if (alias >= 1) {
		  // this single interface has multiple ipv4 addresses
		  localIP = ifname + ':' + alias + ' ' + iface.address;
		} else {
		  // this interface has only one ipv4 adress
		  localIP = ifname + ' ' + iface.address;
		}
		++alias;
	  });
	});

	
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

