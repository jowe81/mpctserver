class Mpct_flowSensor extends Mpct_device {
	constructor(deviceRecord,config,socket){
		super(deviceRecord,config,socket);
	}

	//DeviceListDiv is jQuery object
	updateInfoDiv(deviceListDiv){		
		//Check if div exists, generate if not
		if (!$(this.getInfoDIVselector()).length){					
			//Div doesn't yet exist
			this.generateInfoDiv(deviceListDiv);
		}
		//Update
		var deviceInfoHTML=
			"<table>"
			+"<tr><td>Flow count</td></tr><tr><td>"+this.deviceRecord.data.flow.count+"</td></tr>"
			+"<tr><td>Cyc actual, nominal</td></tr><tr><td>"+this.deviceRecord.data.flow.actualCycleLength+"ms/"+this.deviceRecord.config.reportingInterval+"ms</td></tr>"
			+"</table>";
		$(this.getInfoDIVselector()+" .deviceData").html(deviceInfoHTML);
		this.updateInfoDivReadAtAndError();
	}			
	
}