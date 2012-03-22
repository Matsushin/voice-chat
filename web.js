
/**
 * Module dependencies.
 */

var express = require('express'),
	routes = require('./routes'),
	app = module.exports = express.createServer(),
	io = require('socket.io');

io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});
// Configuration
app.configure(function(){
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser());
	app.use(express.session({ secret: "sld9LwjONSo39vlieJ" }));
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/room/chat', routes.room_chat);
app.post('/room/create', routes.room_create);
app.post('/room/list', routes.room_list);
app.post('/room/enter', routes.room_enter);
app.post('/room/find', routes.room_find);
app.post('/room/join', routes.room_join);
app.post('/room/exit', routes.room_exit);

var port = process.env.PORT || 3000;

app.listen(port);

var room = {};

io = io.listen(app);
io.sockets.on('connection', function(socket){
var address = socket.handshake.address;
 console.log("New connection from " + address.address + ":" + address.port);

	
	socket.on('enter', function(req){
		io.sockets.emit('chat start');
		chatStart(req.id);
	});
	socket.on('disconnect',function(){
		console.log('disconnect a');
		
		// 退出処理要！！
		io.sockets.emit('msg', {text: 'a exit'});
	});


});


function chatStart(id){

	if(room[id] == true){
		return;
	}
	var chat = io
		.of('/room/' + id)
		.on('connection', function (socket) {
			room[id] = true;
			var address = socket.handshake.address;
			console.log("room : " + id + " New connection from " + address.address + ":" + address.port);

			socket.on('msg', function(msg){
				chat.emit('msg', {text: msg.text , name : msg.name, volume : msg.volume});
			});
			socket.on('disconnect',function(){
				console.log('disconnect b');
				chat.emit('msg', {text: 'b exit'});
			});

	  });

}

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
