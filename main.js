var cs  = document.getElementById('mainCanvas');
var ctx = cs.getContext('2d');
var rectArray = new Array();
var minimumSpeed = 3;
var currentSpeed = 0;

$(function(){
	initCanvasSize();
	initTalkField();
	setTimeout(prepareRectArray, 2000);

	loadLog();
	setTimeout(renderLoop, 2200);

	$('#inputMessage').keypress(function(e){
		if($('#inputMessage').val() != ""){
			if($('#inputMessage').val().length <= 150){
				if(e.which == 13){
					if(checkEnoughMinimumSpeed()){
						writeLog();
						loadLog();
					}else{
						alert('速度が足りていません。');
					}
				}
			}else{
				alert('150文字を超えています。（入力された文字数: ' +
					$('#inputMessage').val().length + ')');
			}
		}
	});

	var timer = false;
	$(window).resize(function() {
		if (timer !== false) {
			clearTimeout(timer);
		}
		timer = setTimeout(function() {
			console.log('window resized');
			initCanvasSize();
		}, 200);
	});

	var position_options = {
		enableHighAccuracy: true,    // 高精度を要求する
		timeout: 60000,              // 最大待ち時間（ミリ秒）
		maximumAge: 0                // キャッシュ有効期間（ミリ秒）
	};

	navigator.geolocation.watchPosition(function(position){
		currentSpeed = fixSpeed(position.coords.speed);
	}, function(){
		alert('GPSの利用が許可されていません。');
	}, position_options);

	// スピードを設定（debug用）
	$('#title').click(function(){
		var value = prompt('速度を入力してください（テスト用）', 10);
		if(isNaN(value) || value == null){
			alert('数値を入力してください');
		}else{
			currentSpeed = parseInt(value);
			if(currentSpeed < 0) currentSpeed = 0;
			if(currentSpeed > 40) currentSpeed = 40;
		}
	});
});

function writeLog(){
	console.log(
		'data send: '+
		$('#inputMessage').val() +', ' +
		currentSpeed);

	$.ajax({
		type: 'POST',
		url: './lib/php/chat.php',
		data: {
			'mode': 'write',
			'message': $('#inputMessage').val(),
			'speed': currentSpeed,
			'color': getRandomColor()
		},
		success: function(data){
			$('#talkField').html(data);
			$('#inputMessage').val('');
			createRects(1);
			//window.scroll(0,$(document).height());
			scrollBottom();
		}
	});
}

function loadLog(){
	setTimeout(function(){
		var existingLastLogId = parseInt($('#talkField').text().slice(-2));
		$.ajax({
			type: 'POST',
			url: './lib/php/chat.php',
			data: {
				'mode': 'load'
			},
			success: function(data){
				var lastLogId = 
					parseInt(data.replace(/<("[^"]*"|'[^']*'|[^'">])*>/g,'').slice(-2));
				// htmlを変更する前に自動スクロールのチェックをしておく
				var isScroll = checkScroll();
				// ログに変更が無かった場合でも更新はする
				// .time の更新のため
				$('#talkField').html(data);
				if((lastLogId - existingLastLogId) > 0){
					var updateLogCount = lastLogId - existingLastLogId;
					console.log('talk field update (' + updateLogCount + ')');
					// ログの差分Rectをインスタンス化
					createRects(updateLogCount);
					// ページの下の方にいた場合、自動スクロール
					if(isScroll){
						scrollBottom();
					}
				}
			}
		});
		loadLog();
	}, 1000);
}

function createRects(createNum){
	var tlcCount = $('.timeLineContent').length;
	for(var i = createNum; i > 0; i--){
		rectArray.push(new Rect($('.timeLineContent').eq(tlcCount - i)));
	}
	while(rectArray.length > 30){
		rectArray.shift();
	}
}

function initTalkField(){
	$.ajax({
		type: 'POST',
		url: './lib/php/chat.php',
		data: {
			'mode': 'load'
		},
		success: function(data){
			$('#talkField').html(data);
		}
	});
}

function renderLoop(){
	setInterval(function(){
		ctx.clearRect(0, 0, cs.width, cs.height);
		for(var i = 0; i < rectArray.length; i++){
			rectArray[i].update();
			rectArray[i].render();
		};
		if(checkEnoughMinimumSpeed()){
			$('#inputMessage').css('border', 'solid 6px #5AAC00');
		}else{
			$('#inputMessage').css('border', 'solid 6px #aaaaaa');			
		}
	}, 33);
}

class Rect{
	constructor(_element){
		this.elementId = _element.attr('id');
		this.x = getRandom(_element.offset().left, cs.width - 100);
		this.y = _element.offset().top + _element.height();
		this.speed = (parseInt(_element.find('.speed').html()) / 2);
		this.color = getRandomColor();
		this.xMem = new Array(7);
	}

	update(){
		for(var i = this.xMem.length - 1; i > 0; i--){
			this.xMem[i] = this.xMem[i - 1];
		}
		this.xMem[0] = this.x;
		this.x += this.speed;
		if(this.x >= cs.width - 110){
			this.x = 30;
		}
		var element = $('#' + this.elementId);
		this.y = element.offset().top + element.height() - 20;
	}

	render(){
		var showY = this.y - window.pageYOffset;
		var width = 20;
		var height = 7;
		ctx.lineWidth = 0.5;
		ctx.lineJoin = 'round';
		for(var i = 0; i < this.xMem.length; i++){
			ctx.fillStyle = 'rgba(' + this.color + ',' + (0.7 - (i * 0.15)) + ')';
			ctx.fillRect(this.xMem[i], showY, width, height);
		}
		//ctx.fillStyle = 'rgb(' + this.color + ')';
		//ctx.fillRect(this.x, showY, 30, height);
		//ctx.strokeRect(this.x, showY, 30, height);
	}
}

function fixSpeed(tmpSpeed){
	if(tmpSpeed == null){
		return 0;
	}
	return parseInt(tmpSpeed);
}

function getRandom(min, max) {
  return parseInt(Math.random() * (max - min) + min);
}

function getRandomColor(){
	return getRandom(200, 255) + ',' +
		getRandom(200, 255) + ',' +
		getRandom(200, 255);
}

function prepareRectArray(){
	console.log('prepareRectArray');
	$('.timeLineContent').each(function(i){
		rectArray.push(new Rect($('.timeLineContent').eq(i)));
	});
}

function initCanvasSize(){
	var winWidth = window.innerWidth;
	var winHeight = window.innerHeight;
	cs.setAttribute("width", winWidth.toString());
	cs.setAttribute("height", winHeight.toString());
	console.log('set canvas size: ' + winWidth + '*' + winHeight);
}

function checkEnoughMinimumSpeed(){
	if(currentSpeed >= minimumSpeed){
		return true;
	}
	return false;
}

function scrollBottom(){
	console.log('scroll');
	$('html,body').animate(
		{scrollTop:$(document).height()},
		{ duration: 'slow', easing: 'swing', });
}

function checkScroll(){
	var t = $('#bottom').offset().top;
	var p = t - $(window).height();
	if($(window).scrollTop() > p){
		return true;
	}
	return false;
}