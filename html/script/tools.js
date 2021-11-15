	//Create a deep copy from src to dst without abandoning properties preexistant in dst but missing from src
	//Return whether or not the copy updated or created any values or created values
	deepCopy=function(src,dst){
		var change=false;
		for (var p in src){
		    if (src.hasOwnProperty(p)){
	    		if (src[p] instanceof Object){
	    			//Descend 
	    			if (!dst[p]){
	    				//Object didn't exist in dst yet
	    				dst[p]={};
	    				change=true;
	    				this.deepCopy(src[p],dst[p]);
	    			} else
	    				change=this.deepCopy(src[p],dst[p]);
	    		} else {
	    			//Plain value -> assign
	    			if (dst[p]!=src[p]){
	    				change=true;
	    			}
	    			dst[p]=src[p];
	    		}
		    }
		}
		return change;
	}

	printObject=function(obj){
		var r="";
		for (var p in obj){
		    if (obj.hasOwnProperty(p)){
	    		if (obj[p] instanceof Object){
	    			//Descend 
    				r+=p+": { ";
    				r+=this.printObject(obj[p]);
	    		} else {
	    			//Plain value -> print
	    			r+=" "+p+": "+obj[p];
	    		}
		    }
		}
		r+="}, ";
		return r;
	}
	
	
	ago=function(tsRef,offset){
		var r="";
		var now=new Date().getTime();
		var ms=Math.abs(now-offset-tsRef);
		if (ms<60000){
			r=Math.floor(ms/1000)+"s";
		} else if (ms<60000*60){ //Less than 60 minutes
			r=Math.floor(ms/1000/60)+"m";
		} else if (ms<60000*60*24){ //Less than 24 hours
			r=Math.floor(ms/1000/60/60)+"h";
		} else {
			r=dateTime(tsRef);
		}
		return r;
	}
	
	dateTime=function(mstimestamp){

		function twoDigits(x){
			if (x<10) x="0"+x;
			return x;
		}

		var d;
		if (mstimestamp)
			d=new Date(mstimestamp)
		else 
			d=new Date();
		var year=d.getFullYear();
		var month=twoDigits(d.getMonth()+1);
		var day=twoDigits(d.getDate());
		var h=twoDigits(d.getHours());
		var m=twoDigits(d.getMinutes());
		var s=twoDigits(d.getSeconds());
	
		return year+"-"+month+"-"+day+" "+h+":"+m+":"+s;
	}
	
	twoDigits=function(n){
		n=Math.abs(n);
		if (n<10){
			return "0"+n;
		} else {
			return n;
		}
	}
	
	
	extractControllerId=function(deviceUid){
		return deviceUid.substr(0,1);
	}
	
	//Make string JSON safe by deleting unsafe characters
	jsonSafe=function(str,makeVarNameCompliant){
		var regex;
		makeVarNameCompliant ? regex=/[^a-zA-Z\d]/g : regex=/"/g; //first regex: all non-alphanumeric characters 
		str=str.replace(regex,"");
		return str;
	}
	
	//Add value to array ar in case it doesn't exist yet
	addOnce=function(ar,value){
		if (!ar.includes(value)){
			ar.push(value);
		}
	}


	