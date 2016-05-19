var yf = {
	isUdf:function(x){
		if(typeof(x) == 'undefined'){
			return true;
		}
		return false;
	},
	isStr:function(x){
		if(typeof(x) == 'string'){
			return true;
		}
		return false;
	},
	isObj:function(x){
		if(typeof(x) == 'object'){
			return true;
		}
		return false;
	},
	debug:function(x){
		var txt = "debug:";
		x = JSON.stringify(x);
		txt += x;
		alert(x);
	}
}
