
/*
 * GET home page.
 */

exports.index = function(req, res){

	// 	ルーム一覧取得
	

	res.render('index', { title: 'VoiceChatDemo' });
};

exports.room_create = function(req, res){

	var roomName = req.body.name;
	var roomPass = req.body.pass;
	var errors = [];
	var result = {
		result: false
	};

	if (!roomName || roomName.length === 0) {
		errors.push('ルーム名を入力してください');
	} else if (roomName.length > 20) {
		errors.push('ルーム名が長すぎます。(20文字以内)');
	}

	if (!roomPass) {
		errors.push('あいことばを入力してください');
	}

	if (roomPass && roomPass.length > 32) {
		errors.push('あいことばの文字数が長すぎます。(32文字以内)');
	}

	if (errors.length) {
		result.errors = errors;
		res.json(result);
		return;
	}
	
	var db = connectDB();
	db.Room.find({name: roomName}, function(err, docs){
		if (err) {
			console.error(err);
			return;
		}

		if (docs.length) {
			errors.push('同じルーム名は作成できません');
		}

		if (errors.length) {
			result.errors = errors;
			res.json(result);
			return;
		}

		var createRoom = function(name, pass) {
			db.Room.find({name: name}, function(err, docs){
				if (err || docs.length) {
					errors.push('同じルーム名は作成できません');
					result.errors = errors;
					res.json(result);
					return;
				}

				var room = new db.Room();
				room.name = name;
				room.password = pass;
				room.save(function(err){
					if (err) {
						console.error(err);
						return;
					}
					result.result = true;
					res.json(result);
					return;
				});
			});
		};

		createRoom(roomName, roomPass);
	});
}
exports.room_list = function(req,res){

	var db = connectDB();
	db.Room.find({}, function(err, results){
		var list = [];
		for (var i in results) {
			list.push({
				roomName: results[i].name,
				roomPass: results[i].password,
				members: results[i].members,
				created: results[i].created
			});
		}
		//list.sort('created');
		list.sort(function(a, b) {return b.created-a.created});

		res.json({list: list});
	});
}
exports.room_enter = function(req,res){

	var roomName = req.body.name;
	var roomPass = req.body.pass;
	var errors = [];
	var result = {
		result: false
	};
	
	if (!roomPass) {
		errors.push('あいことばを入力してください');
	}

	if (roomPass && roomPass.length > 32) {
		errors.push('あいことばの文字数が長すぎます。(32文字以内)');
	}

	if (errors.length) {
		result.errors = errors;
		res.json(result);
		return;
	}
	
	var db = connectDB();
	db.Room.find({name: roomName, password: roomPass}, function(err, docs){
		if (err) {
			console.error(err);
			return;
		}

		if (errors.length) {
			result.errors = errors;
			res.json(result);
			return;
		}
		
		// パスワードOK
		if(docs.length > 0){
	
			// セッション初期化
			req.session.name = null;

			// セッションに合言葉を保管
			req.session.pw = roomPass;

			result.result = true;
			result.id = docs[0]._id;
			res.json(result);

			

			return;
		}else{
			errors.push('あいことばが正しくありません！');
			result.errors = errors;
			result.result = false;
			res.json(result);
			return;
		}

	});

}

// チャット画面
exports.room_chat = function(req, res){

	
	res.render('chat', { title: 'VoiceDemo' });
};
exports.room_find = function(req, res){

	var roomId = req.body.id;
	var roomPass = req.session.pw;
	var accountName = req.session.name;
	var errors = [];
	var result = {
		result: false
	};
	
	var db = connectDB();
	db.Room.findOne({_id: roomId, password: roomPass}, function(err, docs){

		if (err) {
			console.error(err);
			return;
		}

		if (errors.length) {
			result.errors = errors;
			res.json(result);
			return;
		}

		// パスワードOK
		if(docs != null){
			var room_info;
			room_info = {
					'id' : docs._id,
					'name': docs.name,
					'members': docs.members,
					'created': docs.created
			};
			result.result = true;
			res.json({result : result, roomInfo : room_info, name : accountName});
			return;

		}else{
			errors.push('ルーム情報が取得できません');
			result.errors = errors;
			result.result = false;
			res.json(result);
			return;
		}

	});
};

exports.room_join = function(req, res){

	var roomId = req.body.id;
	var accountName = req.body.name;
	var roomPass = req.session.pw;
	var errors = [];
	var result = {
		result: false
	};
	
	var db = connectDB();
	db.Room.findOne({_id: roomId, password: roomPass}, function(err, room){
		if (err) {
			console.error(err);
			return;
		}

		if (errors.length) {
			result.errors = errors;
			res.json(result);
			return;
		}

		// パスワードOK
		if(room != null){

			var members = [];
			members = room.members;
			if(members.length > 0){
				for (var i=0;i <  members.length;i++ ) {
					if(accountName == members[i].name){
						errors.push('このアカウント名はすでに使われています。');
						result.errors = errors;
						result.result = false;
						res.json(result);
						return;
					}
				}
			}
			
			// 参加処理
			members.push({
				name : accountName
			});
			room.members = members;
			room.save(function(err){
				if (err) {
					console.error(err);
					return;
				}
				req.session.name = accountName;
				result.result = true;
				result.name = accountName;
				res.json(result);
				return;
			});

		}else{
			errors.push('ルーム情報が取得できません');
			result.errors = errors;
			result.result = false;
			res.json(result);
			return;
		}

	});
};

/**
 * チャットからの退出
 **/
exports.room_exit = function(req, res){
	var roomId = req.body.id;
	var roomPass = req.session.pw;
	var accountName = req.session.name;
	var errors = [];
	var result = {
		result: false
	};

	var db = connectDB();
	db.Room.findOne({_id: roomId, password: roomPass}, function(err, room){
		if (err) {
			console.error(err);
			return;
		}

		if (errors.length) {
			result.errors = errors;
			res.json(result);
			return;
		}

		// パスワードOK
		if(room != null){

			var members = [];
			members = room.members;
			if(members.length > 0){
				for (var i in members) {
					if(accountName == members[i].name){
						members.splice(i,1);
						req.session.name = null;
						break;
					}
				}
			}
			
			// 退出処理
			room.members = members;
			room.save(function(err){
				if (err) {
					console.error(err);
					return;
				}
				result.result = true;
				result.name = accountName;
				res.json(result);
				return;
			});

		}else{
			errors.push('ルーム情報が取得できません');
			result.errors = errors;
			result.result = false;
			res.json(result);
			return;
		}

	});

	return;
};

/**
 * MongoDB
 **/
function connectDB(){
	var mongoose = require('mongoose');

	// Default Schemaを取得
	var Schema = mongoose.Schema;

	var Account = new Schema({
		name: String,
		joined: { type: Date, default: Date.now }
	});

	var Room = new Schema({
		name: {type: String, index: true},
		password: String,
		members: [Account],
		created: { type: Date, default: Date.now }
	});

	Room.pre('save', function(next) {
		if (this.isNew) {
			this.created = new Date();
		}
		next();
	});	
	mongoose.model('Room', Room);
	mongoose.connect('mongodb://localhost/voiceChatDb');

	var Room = mongoose.model('Room');

	return {
		mongoose: mongoose,
		Room: Room
	};
	
}
