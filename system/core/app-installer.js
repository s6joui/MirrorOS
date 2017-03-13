var Q = require('q');
var fs = require("fs");
var MAIN_DIR = __dirname.replace("/system/core","");

var AppInstaller = function() {
	this.install = function(url,success,error){
		if(url==null)
			return;
			
		var filename = url.split('/').pop().split('#')[0].split('?')[0];
		var filename_no_extension = filename.split(".")[0];
		
		makeDir(MAIN_DIR+'/temp/');
		
		var temp_dir = MAIN_DIR+'/temp/'+filename_no_extension;
		var zip_dir = MAIN_DIR+'/temp/'+filename;
		
		var file = fs.createWriteStream(zip_dir);
		var manifest_file;
		console.log("downloading app from "+url);
			
		//1 - Download ZIP
		download(url,file).then(function(response){
			//2 - Create temp folder
			makeDir(temp_dir);
			console.log
			//3 - Unzip in temp folder
			return unzip(zip_dir,temp_dir);
		}).then(function(){
			//4 - Read manifest.json
			manifest_file = JSON.parse(fs.readFileSync(temp_dir+'/manifest.json', 'utf8'));
			
			//5 - Create dir in "apps" dir with manifest package name
			var new_dir = MAIN_DIR+'/apps/'+manifest_file.package;
			makeDir(new_dir);

			//6 - Copy files to that dir
			return moveDir(temp_dir,new_dir);
		}).then(function(app_dir){
			//7 - Download app dependencies (run npm install in app dir)
			return installAppDependencies(app_dir);
		}).then(function(){
			success();
			//8 - Delete temp files
			fs.unlinkSync(zip_dir);
			deleteFolderRecursive(temp_dir);
		}).fail(function (err) {
			// Handle any error from all above steps
			console.log(err);
			error(err);
		}).done();
		
	};
};
module.exports = AppInstaller;

function download(fileUrl,writeStream){
	//TODO: Implement better url validator
    var deferred = Q.defer();
    if(fileUrl.startsWith("http")){
		var request = require('request');
		request.get(fileUrl)
			.on('end', function(response) {
				deferred.resolve(response);
			})
			.on('error', function(err) {
				console.log("OnERROR");
				deferred.reject(new Error(err));
			})
			.pipe(writeStream);
	}else{
		deferred.reject(new Error("Invalid URL"));
	}
    return deferred.promise;
}

function unzip(from,to){
	var unzip = require("unzip");
	var deferred = Q.defer();
	fs.createReadStream(from).pipe(unzip.Extract({ path: to })).on('close', function () {
		deferred.resolve();
	});
	return deferred.promise;
}

function moveDir(from,to){
	var ncp = require('ncp').ncp;
	var deferred = Q.defer();
	ncp.limit = 16;
	ncp(from, to, function (err) {
		if (err) {
			return console.error(err);
			deferred.reject(new Error(err));
		}
		deferred.resolve(to);
	});
	return deferred.promise;
}

function deleteFolderRecursive(path) {
	var deferred = Q.defer();
	if(fs.existsSync(path)) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
		deferred.resolve();
	}
	return deferred.promise;
}
