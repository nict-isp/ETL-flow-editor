/*
 * DSN記述読み込み画面用javascript
 *
 * */

/**設定**/
/* ログのストリーミング出力を行う場合はtrueを設定する。*/
var is_streeming_log = true;

/*
 * DSN記述をテキストエリアに設定する。
 * 参照ボタン押下時に使用する。
 * */
function settext(msg){
	var area = document.getElementById('dcn-textarea');
	area.value=msg;
}
/*
 * テキストエリアのDSN記述を読み込む。
 * 実行ボタン押下時に使用する。
 * */
function loadtext(){
	var area = document.getElementById('dcn-textarea');
	return area.value;
}

/*
 * 受信したログメッセージをストリーミング表示する。
 *
 * */
index_log = 0;
function logger(message){
//    var counter = 0;
//	index_log++;
//	var logarea = $("[data-name='log']").find("div");
//	while(logarea.length >= 20){
//		logarea = logarea.last().remove();
//	}
//	var msgtag = $("<div>").text(message);
//	$("[data-name='log']").prepend(msgtag);
//    console.log(message);
    var dps = [];// dataPoints

		var chart = new CanvasJS.Chart("chartContainer",{
			title :{
				text: "Live Random Data"
			},			
			data: [{
				type: "spline",
				dataPoints: dps 
			}]
		});

		var xVal = 0;
		var yVal = 100;	
		var updateInterval = 1000;
		var dataLength = 200; // number of dataPoints visible at any point

		var updateChart = function (count) {
			count = count || 1;
//            count = 1;
			// count is number of times loop runs to generate random dataPoints.
			
			for (var j = 0; j < count; j++) {	
 				yVal = yVal +  Math.round(5 + Math.random() *(-5-5));
 				dps.push({
 					x: xVal,
 					y: yVal
 				});
 				xVal++;
 			};
 			if (dps.length > dataLength)
			{
				dps.shift();				
			}
			
			chart.render();		

		};

		// generates first set of dataPoints
		updateChart(dataLength); 

		// update chart after specified time. 
		setInterval(function(){updateChart()}, updateInterval); 

}
/*
 * イベントの状態(true,false)をON,OFFの文字列に切り替える。
 *
 * */
function convert_bool_value(obj, data){
	if( data == true ){
		obj.innerHTML = "ON";
		set_on_color(obj);
	}else{
		obj.innerHTML = "OFF";
		set_off_color(obj);
	}
}

function set_on_color(obj){
	obj.style.color="red"
}
function set_off_color(obj){
	obj.style.color="lime"
}

/*
 * イベント状態のテーブルを作成する。
 *
 * */
function eventlogger(json_data){
	if( "log_data" in json_data ){
		if( "events" in json_data["log_data"]){
			var event_set = {};
			var events = json_data["log_data"]["events"];
			var eventskeys = Object.keys(events);
			var tr_class_num = 0;
			var table = document.getElementById("event_table");
			var rows_num = table.rows.length;
			for( var index=0; index < rows_num;index++ ){
				if( index != 0 ){
					table.deleteRow(1);
				 }
			}
			eventskeys.forEach( function(event,index,ary){
				if( event in event_set ){
					/* event名が登録済みの場合,statusの更新のみ行う。*/
					var pos = event_set[event];
					convert_bool_value(table.rows[pos].cells[2],events[event]);
				}else{
					/* event名が未登録の場合、event_tableに行を追加する。*/
					var rows_num = table.rows.length;
					var number = 0;
					if( table.rows[rows_num - 1].cells[0].innerHTML === "No" ){
					}else{
						number = parseInt(table.rows[rows_num-1].cells[0].innerHTML,10);
					}

					var rows = table.insertRow(-1);
					if( tr_class_num == 0){
						rows.className = "bgset1";
						tr_class_num = 1;
					}else{
						rows.className = "bgset2";
						tr_class_num = 0;
					}
					var cell = rows.insertCell(-1);
					cell.innerHTML = (number+1);
					var cell2 = rows.insertCell(-1);
					cell2.innerHTML = event;
					var cell3 = rows.insertCell(-1);
					convert_bool_value(cell3,events[event]);
					event_set[event] = table.rows.length - 1;
				}

			});
		}
	}
}

/*
 * イベント条件状態のテーブルを作成する。
 *
 * */
function blocklogger(json_data){
	var table = document.getElementById("condition_table");
	rows_num = table.rows.length;
	for( var index=0; index < rows_num;index++ ){
		if( index != 0 ){
			table.deleteRow(1);
		}
	}
	if( "log_data" in json_data ){
		if( "blocks" in json_data["log_data"]){
			var blocks = json_data["log_data"]["blocks"];
			var rows_index = 1;
			var tr_class_num = 0;
			blocks.forEach(function(block,index,ary){
					/*初回時は、condition_tableの値を更新する。（ログに全データが送信されることを前提としている）*/
					var rows_num = table.rows.length;
					var number = 0;
					if( table.rows[rows_num - 1].cells[0].innerHTML === "No" ){
					}else{
						number = parseInt(table.rows[rows_num-1].cells[0].innerHTML,10);
					}

					var rows = table.insertRow(-1);
					if( tr_class_num == 0){
						rows.className = "bgset1";
					}else{
						rows.className = "bgset2";
					}
					var cell = rows.insertCell(-1);
					cell.innerHTML = (number+1);
					var cell2 = rows.insertCell(-1);
					cell2.innerHTML = block.conditions;
					var cell3 = rows.insertCell(-1);
					convert_bool_value(cell3,block.is_valid);
					var links = block.links;
					is_first_link=true;
					if( links.length == 0 ){
						var cell = rows.insertCell(-1);
						cell.innerHTML = "-";
						var cell = rows.insertCell(-1);
						cell.innerHTML = "-";
						var cell = rows.insertCell(-1);
						cell.innerHTML = "-";
						var cell = rows.insertCell(-1);
						cell.innerHTML = "-";
					}else{
						links.forEach(function(link,index,ary){
							var table = document.getElementById("condition_table");
							var rows_num = table.rows.length;
							var rows;
							if(is_first_link==false){
								rows = table.insertRow(-1);
								if( tr_class_num == 0){
									rows.className = "bgset1";
								}else{
									rows.className = "bgset2";
								}
								var number = parseInt(table.rows[rows_num-1].cells[0].innerHTML,10);
								var cell = rows.insertCell(-1);
								cell.innerHTML = (number+1);
								var cell = rows.insertCell(-1);
								var cell = rows.insertCell(-1);
							}else{
								is_first_link=false;
								rows = table.rows[rows_num - 1];
							}
							var cell = rows.insertCell(-1);
							cell.innerHTML = link.scratch;
							var cell = rows.insertCell(-1);
							cell.innerHTML = link.channel;
							var cell = rows.insertCell(-1);
							cell.innerHTML = link.expected;
							var cell = rows.insertCell(-1);
							cell.innerHTML = link.actual;
							if( link.actual == link.expected ){
								set_off_color(cell);
							}else{
								set_on_color(cell);
							}
						});
					}
						if( tr_class_num == 0){
							tr_class_num = 1;
						}else{
							tr_class_num = 0;
						}
			});
		}
	}
}

/*
 * 実行ボタン押下時に送信するメッセージを作成する。
 *
 * */
var overlay_id=undefined;
function makeMessage(dsntext){
	var json_data = undefined;
	var nameid = document.getElementById('overlayname');
	if(!nameid.value){
		alert("SCN Cooperation Name not selected");
		return null;
	}
	var name = nameid.value;
	if( overlay_id===undefined ){
		json_data = {"dsn":dsntext,"overlay_name":name}
	}else{
		json_data = {"dsn":dsntext,"overlay_name":name,"overlay_id":overlay_id}
	}
	var json_str = JSON.stringify(json_data);
	return json_str;
}

/*
 * 終了時の動作
 *
 * */
function closeMessage(){
	if( overlay_id===undefined ){
		return null;
	}else{
		json_data = {"is_close":true,"overlay_id":overlay_id}
	}
	var json_str = JSON.stringify(json_data);
	return json_str;
}

/*
 * 実行ボタン押下時の初期化処理
 *
 * */
function initData(){
	var table = document.getElementById("event_table");
	var rows_num = table.rows.length;
	for( var index=0; index < rows_num;index++ ){
		if( index != 0 ){
			table.deleteRow(1);
		}
	}
	table = document.getElementById("condition_table");
	rows_num = table.rows.length;
	for( var index=0; index < rows_num;index++ ){
		if( index != 0 ){
			table.deleteRow(1);
		}
	}
}

/*
 * DSN記述ファイル選択時の処理
 *
 * */
function dsnFileSelect() {
	var dsn_file = document.getElementById('dsnfile');
	console.log("change");
	if(dsn_file.value){
		var file = document.getElementById('dsnfile').files[0];
		var reader = new FileReader();
		reader.readAsText(file);
		reader.onload = function(e){
			text = reader.result;
			settext(text);
		}
	}
}

/*
 * ドキュメント表示時のメイン処理
 *
 * */
$(document).ready(function() {
// 	var socket = new WebSocket('ws://159.149.142.35:11001/');
	var socket = new WebSocket('ws://172.18.100.3:55555/');
	/*サーバからのデータ受信時処理*/
	socket.onmessage = function(msg){
		var json_data = JSON.parse(msg.data);
		if( "overlay_id" in json_data ){
			overlay_id=json_data["overlay_id"];
		}
		if( "exception" in json_data ){
			alert(json_data["exception"]);
			return;
		}
		eventlogger(json_data);
		blocklogger(json_data);
		if( is_streeming_log == true ){
			logger(msg.data);
		}
	};
	socket.onopen = function(){
		console.log("open");
	}
	socket.onclose = function(){
		console.log("close");
	}
	socket.onerror = function(msg){
		alert("Not able to connect to SCN Service");
		console.log(msg);
	}
	/*実行ボタン押下時処理*/
	$('#senddsn').click(function() {
		var text = loadtext();
		if(!text){
			alert("Select the DSN decription file");
			return;
		}
		var sendData = makeMessage(text);
		if(sendData){
			initData();
			socket.send(sendData);
			document.getElementById('senddsn').innerHTML = "Re-submit";
		}else{
			console.log("not send data");
			return;
		}
   });

	$(window).on("unload",function(e){
		console.log("unload message");
		var sendData = closeMessage();
		if( sendData ){
			socket.send(sendData);
		}
	});
	/*画面終了時イベント*/
	/*
	$(window).on("beforeunload",function(e){
		console.log("unload");
		var sendData = closeMessage();
		if( sendData ){
			socket.send(sendData);
		}
		return "本当に終了しますか?";
	});
	*/
});
