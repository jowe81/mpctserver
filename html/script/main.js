/*
 * Script for mcpt server website
 */




//Runs after 'devices' event has been received from socket server (data only - no UI)
function updateDeviceData(msg){
	for (var deviceUid in msg){
		//Generate device object if it doesn't yet exist
		if (!config.devices[deviceUid]){
			config.devices[deviceUid]={};
			//console.log(deviceUid);
			//console.log(config.devices);
			if (msg[deviceUid].physical.type=="relay" || msg[deviceUid].physical.type=="led"){
				config.devices[deviceUid]=new Mpct_relay(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="switch"){
				config.devices[deviceUid]=new Mpct_switch(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="ds18b20"){
				config.devices[deviceUid]=new Mpct_ds18b20(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="dht22"){
				config.devices[deviceUid]=new Mpct_dht22(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="flowSensor"){
				config.devices[deviceUid]=new Mpct_flowSensor(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="projector"){
				config.devices[deviceUid]=new Mpct_projector(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="clockTimer"){
				config.devices[deviceUid]=new Mpct_clockTimer(msg[deviceUid],config,socket);
			} else if (msg[deviceUid].physical.type=="sim_switch"){
				config.devices[deviceUid]=new Mpct_switch(msg[deviceUid],config,socket);
			}
		}
		//Hopefully the device Object exists now. Update data.
		if (config.devices[deviceUid]){
			config.devices[deviceUid].updateDeviceData(msg[deviceUid]);
		}
	}
}
			
//Runs after 'controllers' event has been received from socket server
function updateControllerData(msg){
	for (var controllerId in msg){
		if (!config.controllers[controllerId]){
			//Generate controller object
			config.controllers[controllerId]=new Mpct_controller(msg[controllerId],config.hui.serverOffsetToHUI);
		} else {
			config.controllers[controllerId].updateControllerData(msg[controllerId],config.hui.serverOffsetToHUI);
		}				
	}			
}

//Runs after "macros" event has been received from socket server
function updateMacroData(msg){
	for (var macroId in msg){
		if (!config.macros[macroId]){
			//Generate macro object
			config.macros[macroId]=new Mpct_macro(msg[macroId],config,socket);			
		} else {
			//Update macro object
			//console.log("Updating macro obj");
			//console.log(config.macros[macroId].macroRecord.execIndicator,msg[macroId].execIndicator);
			config.macros[macroId].macroRecord.execIndicator=msg[macroId].execIndicator;
			//deepCopy(msg[macroId],config.macros[macroId].macroRecord);
		}
	}
}

//Runs after "webSettings" event has been received from socket server
function updateWebSettings(msg){
	if (!config.webSettings){
		config.webSettings={};
	}
	deepCopy(msg,config.webSettings);
	console.log("New websettings:"+JSON.stringify(msg));
}

//Runs after 'sync' message; calculates for all controllers their respective offset to the HUI
function updateControllerOffsets(){
	for (controllerId in config.controllers){
		config.controllers[controllerId].updateControllerOffset(config.hui.serverOffsetToHUI);
	}
}

//Check if device with deviceUid_needle exists in the current live config
function deviceExists(deviceUid_needle){
	for (deviceUid in config.devices){
		if (deviceUid_needle==deviceUid){
			//console.log(deviceUid_needle+" exists");
			return true;
		}
	}
	//console.log(deviceUid_needle+" does not exist");
	return false;
}

//Get a list of groups represented by the currently known devices
function getGroupsRepresentedInDevices(){
	var groups=[];
	for (deviceUid in config.devices){
		group=config.devices[deviceUid].getGroup();
		if (group.substr(0,1)!="_"){ //Ignore hidden groups (starting with _)
			addOnce(groups,group);
		}
	}
	groups.sort();
	return groups;
}
	
//Execute a device command (cmdString is something like turnOn or turnOff for relay)
function mqttCommandFromString(deviceUid,cmdString){
	//console.log(deviceUid,cmdString);
	if (config.devices[deviceUid]){
		commandJson=config.devices[deviceUid].getCommandJson(cmdString);
		config.devices[deviceUid].executeCommand(commandJson);
	}
}

function getReferenceTime(){
	if (!config.hui.serverOffsetToHUI){
		//Offset is undefined, assume zero
		config.hui.serverOffsetToHUI=0;
	}
	return new Date(new Date().getTime()+config.hui.serverOffsetToHUI);		
	return false;
}

//Execute a device command (cmdJson is MPCT MQTT Json)
function mqttCommand(deviceUid,cmdJson){
	//console.log("EXECUTING MQTT ",cmdJson);
	socket.emit('mpctCommand',{"deviceUid":deviceUid,cmdJson});
}

var socket;

var config={};			//Config object holds all live data
config.devices={}; 		//objects of parent class Mpct_device
config.controllers={};  //objects of class Mpct_controllers
config.macros={};		//objects of class Mpct_macros
config.hui={currentView:""}; //HUI data

$(window).on('load', function() {
	socket=io();
	
	socket.on('devices',function(msg){
		updateDeviceData(msg);
		console.log(msg);
		//If the current view (page) has passed in a updateUI function, run it
		if (config.hui.updateUI){
			config.hui.updateUI(msg,"devices");
		}
	});
	socket.on('controllers',function(msg){
		console.log(msg);
		updateControllerData(msg);
	});
	socket.on('macros',function(msg){
		updateMacroData(msg);
		//If the current view (page) has passed in a updateUI function, run it
		if (config.hui.updateUI){
			config.hui.updateUI(msg,"macros");
		}
	});
	socket.on('error',function(msg){
		console.log("ERROR",msg);
	});

	socket.on('sync',function(msg){
		//Server offset to Client HUI = server time - hui time (now)
		config.hui.serverOffsetToHUI=msg.serverTimestamp-new Date().getTime();
		updateControllerOffsets();
		//console.log("Offset: "+config.hui.serverOffsetToHUI);
	})
	
	socket.on('webSettings',function(msg){
		updateWebSettings(msg);
		//If the current view (page) has passed in a updateUI function, run it
		if (config.hui.updateUI){
			config.hui.updateUI(msg,"webSettings");
		}
	});

});

