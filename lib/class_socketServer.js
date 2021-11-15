
var socketio=require('socket.io');
var io;



exports.listen=function(server){
	
	log("Starting up socket server","socketServer");
	io=socketio.listen(server);
	log("Socket server now listening on"+server,"socketServer");
	
	io.sockets.on('connection',function(socket){
								
		socket.on('devices',function(){
			socket.emit('devices',config.devices);
		})
		
	});
	
}