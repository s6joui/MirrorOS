HTMLElement.prototype.addClass = function(className) {
    this.classList.add(className);
}

HTMLElement.prototype.removeClass = function(className) {
    this.classList.remove(className);
}

HTMLElement.prototype.empty = function() {
    this.innerHTML = '';
}

HTMLElement.prototype.text = function(text) {
    this.innerHTML = text;
}

HTMLElement.prototype.show = function() {
    this.style.opacity = "0";
}

HTMLElement.prototype.hide = function() {
    this.style.opacity = "1";
}

HTMLElement.prototype.fadeOut = function(ms) {
    if(this.style.display != "none" || this.style.opacity != "0"){
		this.addClass('setup-fade-out');
		this.style.opacity = "0";
		var el = this;
		setTimeout(function(){
			el.removeClass('setup-fade-out');
		},250);
	}else{
		return;
	}
}

//Classes found in style.css
HTMLElement.prototype.fadeIn = function() {
	this.addClass('setup-fade-in');
	this.style.display = 'block';
	this.style.opacity = "1";
	var el = this;
	setTimeout(function(){
		el.removeClass('setup-fade-in');
	},250);
}
