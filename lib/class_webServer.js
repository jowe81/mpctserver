/*
 * Webserver and Socket server for HUI browser clients
 * 
 * Class not instantiated - use static methods
 */


var config;
var mqttMpct; //Handle to mqttMpct server instance
var io;

function webServer(config){
	this.config=config; 
}

//This gets called from the main app once the mqtt connection is up
webServer.attachSocketListeners=function(mqttMpct){
	var config=this.config;
	this.mqttMpct=mqttMpct;
	log("Attaching socket listeners","webServer");
	this.io.on('connection',function(socket){
		log("A HUI user connected from "+socket.handshake.address,"socketServer");
		
		//Send full live records of both, devices and controllers, to newly connected HUI
		socket.emit('devices',config.live.devices);
		socket.emit('controllers',config.live.controllers);
		
		//Send macros
		socket.emit('macros',extractMacroRecords(config.macros));
		
		//Send clock sync message (with slight delay)
		setTimeout(function(){
			socket.emit('sync',{"serverTimestamp":new Date().getTime()});
			log("Syncing HUI","socketServer");
		},500);
		
		//Send webSettings
		socket.emit('webSettings',config.webSettings);

		
		//---------------------------------------------------------------
		
		//HUI request for a re-send of device live data
		socket.on('devices',function(req,res){
			socket.emit('devices',config.live.devices);
		});
		
		//HUI request for a re-send of controller live data
		socket.on('controllers',function(req,res){
			socket.emit('controllers',config.live.controllers);
		});			

		//HUI requeste for a re-send of webSettings
		socket.on('webSettings',function(req,res){
			socket.emit('webSettings',config.webSettings);
		});
		
		//HUI device command -> translate into mqttMpct command
		socket.on('mpctCommand',function(req,res){
			var cmdBody="";
			log("HUI issued command: "+JSON.stringify(req),"webServer");
			if (req.data){
				cmdBody='{ "data":'+JSON.stringify(req.data)+'}';				
			} else if (req.meta){
				cmdBody='{ "meta":'+JSON.stringify(req.meta)+'}';				
			} else if (req.config){
				cmdBody='{ "config":'+JSON.stringify(req.config)+'}';				
			} else if (req.deleteMeta){
				if (jsonSafe(req.deleteMeta).length>0){
					cmdBody='{ "deleteMeta":"'+req.deleteMeta+'"}';
				}
			}
			if (cmdBody!=""){
				mqttMpct.publish("command/"+req.deviceUid,cmdBody);
			}
			
		})
		
		//HUI request to trigger a macro
		socket.on('executeMacro',function(req,res){
			config.macros[req].execute();
		});
		
		//HUI request to update a session parameter
		socket.on('updateSessionSetting',function(req,res){
			p=JSON.parse(req);
			if (p.paramName){
				config.webSettings[p.paramName]=p.paramValue;
				console.log(config.webSettings);
				log("Session setting updated: "+p.paramName+" is now "+p.paramValue,"webServer");				
				//Push settings to HUI cleints
				log("Pushing webSettings to HUI clients","webServer");				
				socket.broadcast.emit('webSettings',config.webSettings); //Goes everywhere except sender
				socket.emit('webSettings',config.webSettings);
			} else {
				log("Invalid session setting update request: "+req,"webServer",true);								
			}
		});
	});
}

webServer.startWebServer=function(){
	log("Starting up webserver and socket.io","webServer");			
	var port=this.config.controller.httpServerPort;
	var config=this.config;
	
	var express = require('express');  
	var bodyParser=require('body-parser');
	//var cookieParser=require('cookie-parser');
	var app = express();  
	var server = require('http').createServer(app);  
	var io = require('socket.io')(server);
	this.io=io;
	var mqttMpct=this.mqttMpct;
	
	var session = require('express-session')
	var mongoose = require('mongoose');
	var MongoStore = require('connect-mongodb-session')(session);

	/*
	var store = new MongoStore({
	  uri: 'mongodb://localhost:27017/mpctServer',
	  collection: 'sessions'
	});
		 
	store.on('connected', function() {
	  store.client; // The underlying MongoClient object from the MongoDB driver
	  log("Connected to MongoDB session store","webServer");
	});
	*/
	//Templating engine init
	var mustacheExpress = require('mustache-express');
	//app.engine("mustache", mustacheExpress());//npm The installation of mustache does not provide a template engine. If you do not register the template engine, you will report the wrong Error: Module "mustache" does not provide a view engine..
	//app.engine('mst', mustache(VIEWS_PATH + '/partials', '.mst'));
	//app.set('views', './views/');
	var vDir=getParentDirectory(__dirname)+'/views';
	app.set('view engine', 'mustache');
	app.engine('html', mustacheExpress(getParentDirectory(__dirname)+'/html','.html'));
	app.set('views',getParentDirectory(__dirname)+'/html');
	
	app.use(bodyParser.json())
	app.use(bodyParser.urlencoded({ extended: true }))

	app.use(require('express-session')({
		  secret: 'TheSecret',
		  cookie: {
		    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
		  },
		  resave: true,
		  saveUninitialized: true
	}));
	
	app.get('/favicon.ico' , function(req , res){
        res.sendFile(getParentDirectory(__dirname) + '/html/favicon.ico');
	});

	
	//If login page requested, serve it
	app.route('/login')
    .get((req, res) => {
        res.sendFile(getParentDirectory(__dirname) + '/html/login.html');
    })
    .post((req, res, next) => {
        if (req.body.password=='foh' || req.body.password=='ppoint'){
        	//OK
        	if (req.body.password=='foh'){
        		req.session.user="td";
        	} else {
        		req.session.user="media";
        	}        	
        	log("Login okay from "+req.connection.remoteAddress,"webServer");
        	req.session.loggedIn=true;

        	res.redirect('/');
        } else {
        	log("Failed login attempt from "+req.connection.remoteAddress,"webServer");
            res.sendFile(getParentDirectory(__dirname) + '/html/login.html');        	
        }
    });
	
	//Check auth for all other requests
	app.use(function(req, res, next) {
		if (req.url!="/login" && !req.url.match(/tally/) ){
			//Requested protected page
			if (!req.session.loggedIn){
				//Not logged in: go to login page
				res.redirect("/login");
			} else {
				//All good, serve protected page
				next();
			}			
		} else {
			//Go to login or tally page
			next();			
		}
	});

	//Handle ajax request
	app.use('/ajax',function(req,res){
		if (req.query.a=="getDeviceUids"){
			res.setHeader('Content-Type', 'application/json');
		    res.send(JSON.stringify(getDeviceUids(config.live.devices)));
		}
	});
	
	//Handle logout request
	app.route('/logout').get(function(req,res){
		req.session.loggedIn=false;
		res.redirect('/login');
	});

	//Serve static files 
	app.use('/script',express.static('html/script'));
	app.use('/css',express.static('html/css'));

	//Serve files in root level with mustache with session object available to template
	app.use('/', function (req, res) {
		//Determine view path (file name of file requested, without path or GET parameters)
		viewPath=req.url.substr(1);
		if (req.url.indexOf("?")>-1){
			viewPath=viewPath.substr(0,req.url.indexOf("?")-1);
		}
		if (viewPath=="") viewPath="monitor.html";
		res.render(viewPath,{session:req.session,query:req.query});
	});
		
	server.listen(port,function(){
		log("Web server now listening on port "+port,"webServer");				
	});
	
	return io;
	
}

module.exports=webServer;
