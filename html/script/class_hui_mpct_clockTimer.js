class Mpct_clockTimer extends Mpct_device {
	constructor(deviceRecord,config,socket){
		super(deviceRecord,config,socket);
	}
		
	getCommandJson(cmdString){
		//return {"deviceUid":this.uid,"data":{"status":{"value":!value}}};		
	}
	
	
	setTimer(duration,indLength,maxOver){
		if (duration>0){
			if (!indLength){
				var indLength=0;
			}
			if (!maxOver){
				var maxOver=0;
			}
			var commandJson={"deviceUid":this.uid,"data":{"setTimer":{"duration":duration,"indLength":indLength,"maxOver":maxOver}}};
			this.executeCommand(commandJson);					
		}
	}
	
	setDefaultTimer(){
		var a=this.deviceRecord.config.defaultTimer.split(",");
		if (a.length==2){
			//maxOver parameter missing
			this.setTimer(a[0],a[1],0);			
		} else if (a.length>2){
			//All parameter present
			this.setTimer(a[0],a[1],a[2]);
		}
	}
	
	adjustTimer(s){
		var commandJson={"deviceUid":this.uid,"data":{"adjustTimer":s}};
		this.executeCommand(commandJson);					
	}
	
	clearTimer(){
		var commandJson={"deviceUid":this.uid,"data":{"clearTimer":true}};
		this.executeCommand(commandJson);				
	}

	unpauseTimer(duration,indLength){
		var commandJson={"deviceUid":this.uid,"data":{"unpauseTimer":true}};
		this.executeCommand(commandJson);		
	}
		
	pauseTimer(){
		var commandJson={"deviceUid":this.uid,"data":{"pauseTimer":true}};
		this.executeCommand(commandJson);		
	}
	
	timerActive(){
		return this.deviceRecord.data.remaining!==false;
	}


	twoDigits(n){
		n=Math.abs(n);
		if (n<10){
			return "0"+n;
		} else {
			return n;
		}
	}
	
	formattedMinutes(){
		return this.twoDigits(this.deviceRecord.data.m);
	}

	formattedSeconds(){
		return this.twoDigits(this.deviceRecord.data.s);
	}
	
	//Depending on device config get hours for 24h-time or ampm
	formattedHour(h){
		if (this.deviceRecord.config.ampm>0){
			if (h>12){
				return h-12; //13:00-23:59 -> 1:00pm-11:59pm
			}
			if (h==0){
				return 12;	//00:00-0:59 -> 12:00-12:59am
			}
		}
		return h;
	}
	
	formattedClockTime(withSeconds,force24h){
		var h=this.deviceRecord.data.h;
		if (!force24h){
			//Flag not set: format to ampm if so configured
			h=this.formattedHour(h);
		}
		var r=h+":"+this.formattedMinutes(this.deviceRecord.data.m);
		if (withSeconds){
			r+=":"+this.formattedSeconds(this.deviceRecord.data.s);
		}
		return r;
	}
	
	formattedRemainingTime(){
		var negative=this.deviceRecord.data.remaining<0;
		var result=Math.floor(Math.abs(this.deviceRecord.data.remaining/60))+":"+this.twoDigits(this.deviceRecord.data.remaining%60);
		if (negative){
			result="-"+result;
		}
		return result;
	}
	
	formattedDisplayTime(clockTimeWithSeconds){
		var r=this.formattedClockTime(clockTimeWithSeconds);
		if (this.timerActive()){
			r=this.formattedRemainingTime();
		}
		return r;
	}
	
	defaultTimerLabel(){
		var r="";
		var a=this.deviceRecord.config.defaultTimer.split(",");
		var m=Math.floor(a[0]/60);
		var s=a[0]%60;
		if(m>0 || s>0){
			r=Math.floor(a[0]/60);			
			if (s>0){
				r+=":"+this.twoDigits(s);
			} else {
				r+="m";
			}						
		}
		return r;
	}
	
	//Gets called after a device data update (from parent class)
	//Set interval to count seconds in between minutely updates from device
	/*
	postUpdateProcessing(){
		this.rtcOffset=new Date().getTime();
		this.rtcReferenceSec=this.deviceRecord.data.s;		
		clearInterval(this.intervalHandler);
		var ths=this;
		this.intervalHandler=setInterval(function(){
			//Calculate current second from offset set at last update
			var elapsedMs=new Date().getTime()-ths.rtcOffset;
			var newS=ths.rtcReferenceSec+Math.floor(elapsedMs/1000);
			if (newS<60){
				ths.deviceRecord.data.s=newS;
			}
			ths.updateMonitorDiv();
		},200);
	}
	*/
	
	monitorDivInitialized(){
		return ($(this.getMonitorDIVselector()).html()!="");
	}
	
	initializeMonitorDiv(){
		var thisDevice=this;
		var label,h,clockText,rtcText;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;
		
		h="<div class='monitorParamName'>"+label+"</div>"
			+"<div class='monitorParamValue ssegDisplay'></div>"			
			+"<div class='monitorParamValue rtc'>RTC: <span class='rtcText'></span></div>"
			+"<div class='noPadding noMargin timerCtrlButtons'>"
			+"<div class='monitorParamValue noPadding'><div class='monitorHalfButtonL setBtn' style='width:100%'></div></div>"
			+"<div class='monitorParamValue noPadding'><div class='monitorHalfButtonL addMinute'>+1m</div><div class='monitorHalfButtonR subtractMinute'>-1m</div></div>"
			+"</div>";
		$(this.getMonitorDIVselector()).html(h);

		//Show or hide buttons depending on whether this is a slave
		if (this.deviceRecord.config.master!=""){
			$(this.getMonitorDIVselector()).find(".timerCtrlButtons").hide();
		} else {
			$(this.getMonitorDIVselector()).find(".timerCtrlButtons").show();			
		}
		
		//Attach event listeners
		$(this.getMonitorDIVselector()).find(".setBtn").click(function(e){
			e.preventDefault();
			if (thisDevice.timerActive()){
				thisDevice.clearTimer();
				console.log("clear timer");
			} else {
				thisDevice.setDefaultTimer();
				console.log("set default timer");
			}			
		});
		$(this.getMonitorDIVselector()).find(".addMinute").click(function(e){
			e.preventDefault();
			thisDevice.adjustTimer(60);
		});
		$(this.getMonitorDIVselector()).find(".subtractMinute").click(function(e){
			e.preventDefault();
			thisDevice.adjustTimer(-60);
		});

	}
	
	updateMonitorDiv(){
		var thisDevice=this;
		var monDiv=$(this.getMonitorDIVselector());
		var indicators=this.deviceRecord.data.ind;
		var colorClass="green"; //for timer sseg
		if (!this.monitorDivInitialized()){
			//Generate entire DIV (first call)
			this.initializeMonitorDiv();					
		}
		//Update display data
		//For timer: Orange on single indicator (like matrix)
		if (indicators==1){
			colorClass="orange";
		}
		//Red if remaining<=0
		if (this.deviceRecord.data.remaining<=0){
			colorClass="red";
		}
		$(monDiv).find(".ssegDisplay").html(this.formattedDisplayTime(false)).removeClass("grey red orange green").addClass(colorClass);
		$(monDiv).find(".rtcText").html(this.formattedClockTime(false,true));
		if (this.timerActive()){
			$(monDiv.find(".setBtn")).html("Clear timer");
		} else {
			$(monDiv.find(".setBtn")).html("Set timer: "+this.defaultTimerLabel());
			colorClass="grey";
		}					
		//Check if this happens to be the master timer, and do HUI updates accordingly
		if (this.config.webSettings && this.config.webSettings.masterTimer==this.uid){
			//This device is master timer - update master timer sseg
			$("#masterTimerSsegDisplay").html(this.formattedRemainingTime(false));
			$("#masterTimerSsegDisplay").removeClass("grey grey red orange green").addClass(colorClass);
			if (this.timerActive()){
				$("#masterTimerControls").find(".setBtn").html("Clear timer");
			} else {
				$("#masterTimerControls").find(".setBtn").html("Set timer: "+this.defaultTimerLabel());				
			}					
		}
	}
	
	
	
}