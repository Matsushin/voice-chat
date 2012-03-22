var name;
var contents;
$(function(){
	
	setFlash();

	// 引数取得
	var str = location.search.split("?");
	var roomId;
	if (str.length < 2) {
		roomId = '';
	}else{
		var params = str[1].split("&");
		for (var i = 0; i < params.length; i++) {
			var keyVal = params[i].split("=");
			if (keyVal[0] == 'ID' && keyVal.length == 2) {
				roomId =  decodeURIComponent(keyVal[1]);
			}
		}
	}

	// Room情報取得
	findRoom(roomId);

	// 参加
	$('#chat_enter').click(function(){
		name = $('#account_name').val();
		$.post('/room/join', {
			'id' : roomId, 
			'name' : name
		}, function(res, status){
			
			// エラー時
			if(res.result == false){
				
				var errors = res.errors;
				for(var i in errors){
					alert('エラー:'+errors[i]);
				}
				return false;
			}else{
				$('.account_join_name').toggle();	
				$('#account_name').toggle();
				$('#chat_enter').toggle();
				$('#chat_exit').toggle();
				$('#speech').show();
				$('.account_join_name').html(res.name);

				// 入室保管
				sessionStorage.setItem('login_' + roomId, res.name);
				// 入室メッセージ処理
				chat.emit('msg', {text: '<span style="color:red;">' + res.name + '</span> さん が入室しました' });
				
				findRoom(roomId);

			}
		});
	});

	// 退出
	$('#chat_exit').click(function(){

		$.post('/room/exit', {
			'id' : roomId
		},function(res, status){
			
			// エラー時
			if(res.result == false){
				
				var errors = res.errors;
				for(var i in errors){
					alert('エラー:'+errors[i]);
				}
				return false;

			}else{
				$('.account_join_name').toggle();	
				$('#account_name').toggle();
				$('#chat_enter').toggle();
				$('#chat_exit').toggle();
				$('#speech').hide();

				// 入室セッション削除
				sessionStorage.removeItem('login_' + roomId, name);

				// 退室メッセージ処理
				chat.emit('msg', {text: '<span style="color:blue;">' + res.name + '</span> さん が退室しました' });

				findRoom(roomId);
			}
		});
	});

	// チャネル接続
	connect(roomId);

	// 送信テスト
	$('#test').click(function(){
		speechInput($('#word').val());
	});

	// セッション取得
	name = sessionStorage.getItem('login_' + roomId)? sessionStorage.getItem('login_' + roomId) : '';
	if(name != ''){
		$('.account_join_name').toggle();	
		$('#account_name').toggle();
		$('#chat_enter').toggle();
		$('#chat_exit').toggle();
		$('#speech').show();
		$('.account_join_name').html(name);

	}
	contents = sessionStorage.getItem('contents_' + roomId) ? sessionStorage.getItem('contents_' + roomId) : '';
	if(contents != ''){
		var textList = contents.split("|");
		for(var i=0;i<textList.length;i++){
			$('#chat').prepend(textList[i])
		}

		
	}
});
function findRoom(id){
	$.post('/room/find', {
			'id' : id
		} ,function(res, status){
		
			// エラー時
			if(res.result == false){
				
				var errors = res.errors;
				for(var i in errors){
					alert('エラー:'+errors[i]);
				}
				return false;
			}else{
				var roomId		= res.roomInfo.id;
				var roomName	= res.roomInfo.name;
				var roomCreated	= res.roomInfo.created;
				var roomMembers = res.roomInfo.members;
				var accountName = res.name;

				if(accountName != '' && accountName != null){
					$('.account_join_name').show();	
					$('#account_name').hide();
					$('#chat_enter').hide();
					$('#chat_exit').show();

					$('.account_join_name').html(res.name);
				}
				// ルーム名セット
				$('h2').html(roomName);

				// ルーム参加者セット
				$('.member_list').empty();
				for(var i in roomMembers){
					$('.member_list').append('<li>' + roomMembers[i].name + '</li>');
				}
			}
	});
}

var socket;
var chat;
function connect(id){
	var socket = new io.Socket(); // 3/22 add
	socket.connect(); // 3/22 add
	//socket = io.connect();
	socket.on('connect', function () {
		socket.emit('enter', {id : id});
		socket.on('chat start', function(){
			// 新しくチャット用に接続
			chatStart(id);
		});
	});
}
function speechInput(text){
	
	// 音量取得
	var swf = document.getElementById("Volume");  // attributesのidを指定する。
	var volume = swf.getVolume();
console.log(volume);
	send(text, volume + 10);
}

// 送信時
function send(text, volume){
	chat.emit('msg', {text: text, name : name, volume : volume});
}

function chatStart(id){

	// 入退室繰り返し対策

	chat = io.connect('http://localhost:3000/room/'+id);
	chat.on('connect', function () {
		
		chat.on('msg', function(msg){
			var str;
			if(msg.name != null){
				str = '<p>' + msg.name + ' さん: <span style="font-size:'+msg.volume+'px;">' + msg.text + '</span></p><hr />';
			}else{
				str = '<p>' + msg.text + '</p><hr />'
			}	
			var contents = sessionStorage.getItem('contents_' + id) ? sessionStorage.getItem('contents_' + id) : '';
			sessionStorage.setItem('contents_' + id, contents + '|' + str);
			$('#chat').prepend(str);
			//$('#chat').children('p:first').hide().fadeIn(5000);
		});
	});
}
function setFlash(){

	var flashvars = {};
	var params = {
		menu: "false",
		scale: "noScale",
		allowFullscreen: "true",
		allowScriptAccess: "always",
		bgcolor: "#FFFFFF"
		};

	var attributes = {
		id:"Volume",
		name:"Volume"
	};

	swfobject.embedSWF(
						"/common/swf/GetVolume.swf",
						"swf",
						"100%",
						"100%",
						"10.1.0",
						"/common/swf/expressInstall.swf",
						flashvars,
						params,
						attributes
					);

}
