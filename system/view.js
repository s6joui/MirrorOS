var View = function() {
	
	var titleEl = document.querySelector("#resultText");
	var subtitleEl = document.querySelector("#appNameText");
	var clockEl = document.querySelector("#clock");
	var statusEl = document.querySelector("#info1");
	var toastEl = document.querySelector("#toast");
	var splashEl = document.querySelector("#splash");
	var splashTitleEl = document.querySelector("#splashTitle");
	var leftSensorEl = document.querySelector("#leftSensorIndicator");
	var rightSensorEl = document.querySelector("#rightSensorIndicator");
	var infoBarEl = document.querySelector("#infoBar");
	var speechButtonEl = document.querySelector("#speechButton");
	
	var notificationAudio = new Audio("sounds/noti.mp3");
	
	this.updateTime = function(){
		var prevTime = clockEl.innerHTML;
		var date = new Date();
		var minutes = (""+date.getMinutes()).length>1 ? date.getMinutes() : "0"+date.getMinutes();
		var timeString = date.getHours()+":"+minutes;
		if(timeString!=prevTime){
			clockEl.innerHTML = timeString;
		}
	}
	
	this.showToast = function(message,length){
		toastEl.innerHTML = message;
		toastEl.fadeIn();
		notificationAudio.play();
		var time = length ? length : 2400;
		setTimeout(function(){
			toastEl.fadeOut();
		},time);
	}
	
	this.setUIMode = function(mode){
		if(mode == FULL_MODE){
			infoBarEl.removeClass("smallbar");
			titleEl.removeClass("smallbarText");
			subtitleEl.removeClass("smallbarText");
			subtitleEl.removeClass("leftBorder");
			speechButtonEl.addClass("hidden");
		}else if(mode == SMALL_MODE){
			infoBarEl.addClass("smallbar");
			titleEl.addClass("smallbarText");
			subtitleEl.addClass("smallbarText");
			subtitleEl.addClass("leftBorder");
			speechButtonEl.addClass("hidden");
		}
	}
	
	var animationPause = 0,stopTime = 0,prevGesture;
	this.showSensorIndicators = function(gesture){
		var currentMillis = new Date().getTime();
		if(currentMillis - stopTime >= animationPause){
			leftSensorEl.removeClass("fail");
			rightSensorEl.removeClass("fail");
			leftSensorEl.removeClass("success");
			rightSensorEl.removeClass("success");
			if(gesture == 0){
				leftSensorEl.addClass("animate");
			}else if(gesture == 1){
				rightSensorEl.addClass("animate");
			}else if(gesture == 54 && prevGesture == 0 || prevGesture == 1){
				leftSensorEl.removeClass("animate");
				rightSensorEl.removeClass("animate");
				leftSensorEl.addClass("fail");
				rightSensorEl.addClass("fail");
			}else if(gesture == 10){
				leftSensorEl.removeClass("animate");
				leftSensorEl.addClass("success");
				animationPause = 300;
			}else if(gesture == 11){
				rightSensorEl.removeClass("animate");
				rightSensorEl.addClass("success");
				animationPause = 300;
			}else{
				leftSensorEl.removeClass("animate");
				rightSensorEl.removeClass("animate");
			}
			if(gesture == 10 || gesture == 11){
				animationPause = 300;
				stopTime = new Date().getTime();
				notificationAudio.play();
			}else{
				animationPause = 0;
				stopTime = 0;
			}
			prevGesture = gesture;
		}
	}
	
	this.showSpeechButton = function(){
		speechButtonEl.removeClass("hidden");
	}
	
	this.hideSpeechButton = function(){
		speechButtonEl.addClass("hidden");
	}
	
	this.setSpeechButtonActive = function(active){
		if(active){
			speechButtonEl.addClass("active");
		}else{
			speechButtonEl.removeClass("active");
		}
	}
	
	this.showSplashWithTitle = function(title){
		splashTitleEl.text(title);
		splashEl.fadeIn();
	}
	
	this.hideSplash = function(){
		splashEl.fadeOut();
	}
		
	this.setTitle = function(title){
		titleEl.innerHTML = title;
	}
	
	this.getTitle = function(){
		return titleEl.innerHTML;
	}
	
	this.setSubtitle = function(subtitle){
		subtitleEl.innerHTML = subtitle;
	}
	
	this.getSubtitle = function(){
		return subtitleEl.innerHTML;
	}	
	
	this.setStatus = function(subtitle){
		statusEl.innerHTML = subtitle;
	}
	
	this.getStatus = function(){
		return statusEl.innerHTML;
	}
}
