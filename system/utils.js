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

