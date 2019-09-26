<?php
$fileName = "../data/chat.log";
$showMaxLog = 30;

/*
// load
if($_POST['mode'] == 'load'){
	$chatLog = file_get_contents($fileName);
	echo $chatLog;
	//echo htmlspecialchars($inputValue, ENT_QUOTES, "utf-8");	
}
*/

// load
if($_POST['mode'] == 'load'){
	loadLog();
}

// write
if($_POST['mode'] == 'write'){
	$message = $_POST['message'];
	$speed = $_POST['speed'];
	$color = $_POST['color'];
	writeLog($message, $speed, $color);
	loadLog();
//	$chatLog = file_get_contents($fileName);
//	echo $chatLog;
}


function loadLog(){
	global $fileName;
	global $showMaxLog;

	$lines = file($fileName);
	$chatLogArray = array();

	// 配列に格納
	$lineCount = 0;
	foreach($lines as $line){
		$data = explode(',', $line);
		for($i = 0; $i < 7; $i++){
			array_push($chatLogArray, $data[$i]);
		}
//		$chatLogArray[$lineCount] = $data[0];
//		$chatLogArray[$lineCount + 1] = $data[1];
		$lineCount++;
		if($lineCount >= $showMaxLog) break;
	}

	// 配列を出力（php -> html）
	for($i = count($chatLogArray) - 1; $i >= 0; $i -= 7){
		echo '<div class="timeLineContent" id="id'.$chatLogArray[$i - 6].'">';
		echo '<p>',$chatLogArray[$i - 5], '</p>';
		echo '<span class="time">';
		echo fixDateAndTime($chatLogArray[$i - 4]);
		echo '</span>';
		echo '<span class="speed">';
		echo $chatLogArray[$i - 3];
		echo '</span>';
		echo '<span class="color">';
		echo $chatLogArray[$i - 2].','.$chatLogArray[$i - 1].','.$chatLogArray[$i];
		echo '</span>';
		echo '<span class="logId" id="id'.$chatLogArray[$i - 6].'">';
		echo $chatLogArray[$i - 6];
		echo '</span>';
		echo '<div class="timeLineRailWay"></div>';
		echo '</div>';
		echo '<div class="timeLineMargin"></div>';
	}	
}

function writeLog($message, $speed, $color){
	global $fileName;
	global $logMax;
	$logData = file($fileName);
	$fp = fopen($fileName, "w");
	flock($fp, LOCK_EX);

	$line = count($logData).",".$message.",".date('Y/m/d H:i:s').",".$speed.",".$color."\n";
	fputs($fp,$line);
	for($i = 0; $i < count($logData); $i++){
		fputs($fp, $logData[$i]);
	}

	flock($fp, LOCK_UN); 
	fclose($fp);
}

function fixDateAndTime($timeStr){
	$time = strtotime($timeStr);
	$now = time();
	$diffSec   = $now - $time;

	if($diffSec < 60){
		$time = $diffSec;
		$unit = " 秒前";
	}elseif($diffSec < 3600){
		$time = $diffSec / 60;
		$unit = " 分前";
	}elseif($diffSec < 86400){
		$time = $diffSec / 3600;
		$unit = " 時間前";
	}elseif($diffSec < 2764800){
		$time = $diffSec / 86400;
		$unit = " 日前";
	}else{
		$time = 1;
		$unit = " ヶ月以上前";
	}
	return (int)$time .$unit;
}