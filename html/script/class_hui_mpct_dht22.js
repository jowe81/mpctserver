class Mpct_dht22 extends Mpct_device {
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
			+"<tr><td>Temperature</td></tr><tr><td>"+this.deviceRecord.data.temperature.value+this.deviceRecord.data.temperature.unit+"</td></tr>"
			+"<tr><td>Humidity</td></tr><tr><td>"+this.deviceRecord.data.humidity.value+this.deviceRecord.data.humidity.unit+"</td></tr>"
			+"</table>";
		$(this.getInfoDIVselector()+" .deviceData").html(deviceInfoHTML);
		this.updateInfoDivReadAtAndError();
	}			
	
	
	updateMonitorDiv(){
		var h="",label,statusText;
		this.deviceRecord.meta.name ? label=this.deviceRecord.meta.name : label=this.uid;
		if (this.deviceRecord.data.temperature && this.deviceRecord.data.humidity){
			statusText="<div class='monitorParamValue'>"+this.deviceRecord.data.temperature.value+this.deviceRecord.data.temperature.unit+" / "+this.deviceRecord.data.humidity.value+this.deviceRecord.data.humidity.unit+"</div>"			
		} else {
			statusText="N/A";
		}
		h="<div class='monitorParamName'>"+label+"</div>"+statusText;
		
		$(this.getMonitorDIVselector()).html(h);
		this.updateMonitorDivError(); //Parent class						
	}

	
}