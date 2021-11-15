/*
 * MQTT/mpct server
 * 
 * Class not instantiated - use static methods
 */


var mqtt=require('mqtt');

var mqttClient,config,io;

//Class gets never instantialized, but constructor appears necessary 
function mqttMpct(config,io){
	/*this.config=config; //Main live data object: config.live
	this.io=io; //socketio instance on web server*/
}
//Subscribe and log
mqttMpct.subscribe=function(topic,options,callback){
	var fullTopic="#";
	if (topic){
		var fullTopic=this.config.controller.mqttNamespace+topic;
	}
	this.mqttClient.subscribe(fullTopic,options,function(err,granted){
		if (err) {
			log("Subscription to "+fullTopic+" failed","mqtt",true);
		} else {
			log("Subscribed successfully to "+granted[0].topic+" with QOS "+granted[0].qos,"mqtt");
		}
		//After logging, call original callback if exists
		if (callback) callback(err,granted);
	});
}

//Publish and log
mqttMpct.publish=function(topic,message){
	var fullTopic=this.config.controller.mqttNamespace+topic;
	this.mqttClient.publish(fullTopic,message,function(err){
		if (err) {
			log("Publishing to "+fullTopic+" failed","mqtt",true);
		} else {
			log("Published to "+fullTopic+": "+message,"mqtt"); 
		}
	});
}

//Ask controllers to set their clocks
mqttMpct.sendTimeToControllers=function(){
	var d=new Date(new Date().getTime()+1000); 
	var msg="";
	msg='{"data":{"setTime":{"hours":"'+d.getHours()+'","minutes":"'+d.getMinutes()+'","seconds":"'+d.getSeconds()+'","year":"'+d.getFullYear()+'","month":"'+d.getMonth()+'","day":"'+d.getDate()+'","ts":"'+d.getTime()+'"}}}';
	var msToNextRollOver=1000-d.getTime()%1000;
	setTimeout(function(){
		log("Broadcasting system time","mpct");					
		mqttMpct.publish("command/controllers",msg);		
	},msToNextRollOver);
}

mqttMpct.startMqttClient=function(callbackOnConnect){
	var io=this.io; //Socket IO handle
	var mqttMpct=this;	
	var controller=this.config.controller;	
	log("Attempting MQTT connection to broker @ "+controller.mqttBrokerAddress,"mqtt");
	this.mqttClient=mqtt.connect(controller.mqttBrokerAddress);

	this.mqttClient.on('connect', function () {
		controller.controllerIP=myIP();
		log("Connected to "+controller.mqttBrokerAddress,"mqtt");
		//Subscribe to device data and controller update channel
		mqttMpct.subscribe("update/#");
		//Subscribe to server command channel (for info/time requests)
		mqttMpct.subscribe("command/server");
		//Trigger status update from controllers
		mqttMpct.publish("command/controllers",'{"data":{"publishFullStatus":{"forceHardwareRead":false}}}');
		//Call callback function if present
		if (callbackOnConnect) callbackOnConnect();
		//Send time sync message (with a bit of delay)
		setTimeout(mqttMpct.sendTimeToControllers,5000);
	});
 
	this.mqttClient.on('message', function (topic, message) {
		var command={}; //Will be JSON from message
		var change=false; //Flag whether or not the new data was different from previously received data
		try {
			command=JSON.parse(message.toString());
			//log("Message @ "+topic+": "+message.toString(),"mqtt");
		} catch(err) {
			log("Received invalid MPCT or MQTT message (JSON syntax error): "+message.toString(),"mqtt",true);
			return;
		}
		
		if (topic==controller.mqttNamespace+"update/controllers"){
			//Caught controller update
			controllerId=command.controllerId;
			//If controller doesn't exist here yet, create record
			if (!mqttMpct.config.live.controllers[controllerId]){
				mqttMpct.config.live.controllers[controllerId]={};
			}
			/*
			 * Add/replace the live data in the message in the controller record
			 */
			change=deepCopy(command,mqttMpct.config.live.controllers[controllerId]);

			//Store timestamp for this update
			mqttMpct.config.live.controllers[controllerId].updatedAt=new Date().getTime();
			if (mqttMpct.config.live.controllers[controllerId].localTimestamp){
				//Use localTimestamp property in update record to store offset of this controller against mpct server
				//Offset from controller to server: controller time (localTimestamp) - server time (now)
				mqttMpct.config.live.controllers[controllerId].offsetToServer=mqttMpct.config.live.controllers[controllerId].localTimestamp-new Date().getTime();
			}
			
			if (change){
				//Controller data has been updated. Push update to connected HUIs.
				var updatedControllerData={};
				updatedControllerData[controllerId]=mqttMpct.config.live.controllers[controllerId];			
				io.emit('controllers',updatedControllerData);				
			}
		} else if (isChildTopicOf(controller.mqttNamespace+"update/",topic)){
			//Caught device update
			deviceUid=extractMqttPath(topic);
			//If device doesn't exist here yet, create record
			if (!mqttMpct.config.live.devices[deviceUid]){
				mqttMpct.config.live.devices[deviceUid]={};
			}
			//If this is a full update, discard old data completely
			if (command._isFullUpdate){
				log("Received full status update -> discard current record for "+deviceUid,"mpct");
				mqttMpct.config.live.devices[deviceUid]={};
			} else {
				mqttMpct.config.live.devices[deviceUid]._isFullUpdate=false;
				//console.log("Partial update for "+deviceUid,command);
			}
			/*
			 * Add/replace the live data in the message in the device record
			 */
			change=deepCopy(command,mqttMpct.config.live.devices[deviceUid]);
			/*
			 * Store timestamp for this update: this is when the mpct server has received the data from the controller,
			 * 	not necessarily the time of reading from the device 
			 */ 
			mqttMpct.config.live.devices[deviceUid]._dataReceivedAt=new Date().getTime();
			//Device data has been updated. Push update to connected HUIs.
			if (change){
				var updatedDeviceData={};
				updatedDeviceData[deviceUid]=mqttMpct.config.live.devices[deviceUid];			
				io.emit('devices',updatedDeviceData);
			}
			//Check if this is a trigger switch for an active macro
			for (macroId in mqttMpct.config.macros){
				if (mqttMpct.config.macros[macroId].macroRecord.triggerSwitches.includes(deviceUid)){
					switchDefault=mqttMpct.config.live.devices[deviceUid].physical.default;
					switchState=mqttMpct.config.live.devices[deviceUid].data.status;
					switchChanged=mqttMpct.config.live.devices[deviceUid].data.changed;
					if (switchState!=switchDefault && switchChanged){
						//Button is pushed and actually has just been triggered ("changed" flag)
						log("Macro "+macroId+" triggered by "+deviceUid,"mpct");
						mqttMpct.config.macros[macroId].execute();
					}
				}
				//log(mqttMpct.config.macros[macroId].macroRecord.triggerSwitches);
			}
			
		} else if (topic==controller.mqttNamespace+"command/server"){
			if (command.data=="getTime"){
				log("Received request for system time","mpct");				
				mqttMpct.sendTimeToControllers();
			}
		}
		
	});
}

module.exports=mqttMpct;
