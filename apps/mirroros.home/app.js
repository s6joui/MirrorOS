var clockEl;
var dateEl;
var weatherEl;
var feedEl;

window.onload = function(){
	MOS.setTitle("Welcome! Clap to begin");

	var notesString = localStorage.getItem("notes");
	var notes = notesString ? JSON.parse(notesString) : [];
		
	weatherEl = document.getElementById("weather");
	dateEl = document.getElementById("date");
	clockEl = document.getElementById("clock");
	feedEl = document.getElementById("feed");
		
	setTime();
	setInterval(setTime,1000);
	
	for(var i=0;i<notes.length;i++){
		console.log(notes[i]);
		drawNote(notes[i]);
	}
	
	var apiKey = MOS.getAPIKey("Forecast.io");
	if(apiKey){
		MOS.JSONGetRequest("https://maps.googleapis.com/maps/api/browserlocation/json?browser=chromium&sensor=true",function(result){
			console.log(result);
			MOS.JSONGetRequest("https://api.forecast.io/forecast/"+apiKey+"/"+result.location.lat+","+result.location.lng+"?units=si",function(result){
				var weather = result;
				var temp = weather.currently.temperature;
				var summary = weather.currently.summary;
				weatherEl.textContent = temp.toFixed(1)+"°C | "+summary;
				drawIcon(weather.currently.icon);
			});
		});
	}else{
		weatherEl.textContent = "Missing API key for weather";
	}
}

function drawIcon(icon){
  var skycons = new Skycons({"color": "white"});
  // you can add a canvas by it's ID...
  skycons.add("weatherIcon", icon);
  // start animation!
  skycons.play();
}

function setTime(){
	var dt = new Date();
	var minutes = (""+dt.getMinutes()).length>1 ? dt.getMinutes() : "0"+dt.getMinutes();
	var time = dt.getHours() + ":" + minutes;
	clockEl.textContent = time;
	dateEl.textContent = dt.toDateString();
}

MOS.onNewQuery = function(query){
	if(query.indexOf("note")>=0){
		var noteText = query.replace("note to","");
		drawNote(noteText);
		notes.push(noteText);
		localStorage.setItem("notes",JSON.stringify(notes));
	}else if(query.indexOf("clear")>=0){
		clearNotes();
	}else if(query.indexOf("remind")>=0){
		parseReminder(query);
	}
}

function parseReminder(query){
	var removeIndex = query.indexOf("remove")+1;
	var inIndex = query.indexOf(" in ")+1;
	var toIndex = query.indexOf(" to ")+1;
	if(removeIndex>0){
		localStorage.setItem("notes","[]");
		feedEl.innerHTML = '';
	}else if(inIndex > 0){
		var time = query.substring(inIndex+3,query.length);
		var text = query.substring(toIndex+3,inIndex-1);
		var tval = parseInt(time.replace(/[^\/\d]/g,""));
		console.log(time);
		console.log(text);
		console.log(tval);
		if(time.indexOf("hour")>0){
			createReminder(text,tval*3600000);
		}else if(time.indexOf("sec")>0){
			createReminder(text,tval*1000);
		}else{
			createReminder(text,tval*60000);
		}
	}else{
		var text = query;
		if(query.indexOf("remind me to ")>=0){
			text = query.replace("remind me to ","");
		}
		drawNote(text);
		notes.push(text);
		localStorage.setItem("notes",JSON.stringify(notes));
	}
}

function createReminder(text,time){
	/*console.log(time);
	console.log(text);
	var am = time.indexOf("a.m")>=0;
	var hour = time.replace(/[^\/\d]/g,"");
	console.log(hour);*/
	console.log("starting "+time+"ms timer");
	MOS.showToast("The reminder was added successfully");
	setTimeout(function(){drawNote(text,true);},time);
	
}

function drawNote(noteText,isReminder){
	
	var noteDiv = document.createElement("div");
	noteDiv.className = "note";
	feed.insertBefore(noteDiv, feed.firstChild);

	if(isReminder){
		setTimeout(function(){
			noteDiv.addClass("reminder");
		},1000);
	}
}

function clearNotes(){
	localStorage.removeItem("notes");
	feedEl.innerHTML = '';
}

/*MOS.showAlert("Hello","Hold right",10);

function onAlertPositiveOption(alertId){
	if(alertId == 10){
		
	}
}*/
