var socket;
var roomEnterElm;
$(function(){
	
	var roomCreateElm = $('#room_create');
	//roomCreateElm = document.getElementById('room_create');

	roomEnterElm = $('#room_enter');

	$('#room_enter').remove();
	$('#room_create').remove();
	
	// ルーム作成ウインドウ表示
	$('a').click(function(){
		
		TINY.box.show({html:roomCreateElm.html(),boxid:'create'});

		return false;
	});

	listRoom();

	
});
// ルーム一覧取得
function listRoom() {

	var ul = $('#room_list');
	ul.empty();
	$.post('room/list', null, function(res, status){
		console.log(res);

		var roomList = res.list;
		

		for (var i in roomList) {
			
			var li = '<li class=room_'+i+'>' + roomList[i].roomName + ' : '+ roomList[i].created +'</li>';
			ul.append(li);
			
		}
		$('li').click(function(){
		
			var className = $(this).attr('class');
			var roomNo = className.split('_');
			roomNo = roomNo[1];
			roomEnterElm.find('.enter_room_name').html(roomList[roomNo].roomName);
			TINY.box.show({html:roomEnterElm.html(),boxid:'enter'});

		});
	});
}
// ルーム作成
function roomCreate(name , pass){
	var roomName = name;
	var roomPass = pass;
	$.post('room/create', {

			'name' : roomName,
			'pass' : roomPass

		} ,function(res, status){

		// エラー時
		if(res.result == false){
			
			var errors = res.errors;
			for(var i in errors){
				alert('エラー:'+errors[i]);
			}
		}else{
			$('.tmask').hide();
			$('.tbox').hide();
		
			listRoom();
		}
	});
}

function roomEnter(name, pass){
	var roomName = name;
	var roomPass = pass;
	// 入室チェック
	$.post('room/enter', {

			'name' : roomName,
			'pass' : roomPass

		} ,function(res, status){
		// エラー時
		if(res.result == false){
			
			var errors = res.errors;
			for(var i in errors){
				alert('エラー:'+errors[i]);
			}
		}else{
			
			// 入室
			$('.tmask').hide();
			$('.tbox').hide();

			location.href="/room/chat?ID="+res.id;
		}
	});
}
