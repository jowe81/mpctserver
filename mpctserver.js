/*
 * MPCT Server
 * 
 * (C) 2018 jowe.ca
 * 
 * 
 * 
 * 
 */



var fs=require('fs');
var mqttMpct=require('./lib/class_mqttMpct.js');
var webServer=require('./lib/class_webServer.js');
var Macro=require('./lib/class_macro.js');

var _=require('lodash');
require('./tools.js')();



var config={};



process.on('SIGINT', function() {
    log("Caught CTRL-C/SIGINT, shutting down...","init");
    //config.macros={}; //Delete Macros object which is circular
    console.log(config);
    //Save only websettings to disk, not entire config object
    writeJson(config.webSettings,'./webSettings.json',function(){
        process.exit(1);    	
    });
});


function scheduleSystemTimeBroadcast(){
	var interval=3600; //Default to hourly, if not otherwise specified in config.json
	if (config.controller.systemTimeBroadcastInterval){
		//Minimum interval is one minute, otherwise use config.json
		interval=Math.max(60,config.controller.systemTimeBroadcastInterval);
	}
	log("Setting system time broadcast interval to "+interval+" seconds","mpct");
	setInterval(mqttMpct.sendTimeToControllers,interval*1000);
}

function startup(){
	log("Welcome - MPCT Server starting up...","init",false,true);	
	//Read server configuration
	config=readConfigJson();
	//Read web settings
	config.webSettings=readJson("webSettings.json",false);
	if (!config.webSettings){
		config.webSettings={};
		log("Could not load webSettings, reverting to default","fs");
	}
	//Prepare macros
	Macro.loadMacrosFromFile(config);
	for (macroId in config.macros){
		config.macros[macroId]=new Macro(macroId,config.macros[macroId],config,mqttMpct);
	}
	//Prepare webserver
	webServer.config=config;
	//Start webserver and save socketIO instance to pass to mqttClient
	var io=webServer.startWebServer(); 
	//Prepare mqttMpct
	mqttMpct.io=io;
	mqttMpct.config=config;
	//Start mqtt client, connect to broker
	mqttMpct.startMqttClient(function(){
		//Connected to MQTT broker
		//Now attach socket listeners to socket server: they need the reference to mqttMpct for publishing MQTT
		webServer.attachSocketListeners(mqttMpct);
		//Set up interval to sync controller clocks
		scheduleSystemTimeBroadcast();
	});
}

startup();

