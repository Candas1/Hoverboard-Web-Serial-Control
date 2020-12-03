var baudrate = document.getElementById('baudrate');
var connect_btn = document.getElementById('connect');

var switch_btn = document.getElementById('switch');
var pause_btn = document.getElementById('pause');
var listen_btn = document.getElementById('listen');

var steerIn = document.getElementById('steer');
var speedIn = document.getElementById('speed');
var send_btn = document.getElementById('send');
var write = document.getElementById('write');
var read = document.getElementById('read');
var skip = document.getElementById('skip');
var success = document.getElementById('success');
var error = document.getElementById('error');

var logger = document.getElementById('log');
var gd = document.getElementById('chart');
var view = 'log';

log = new Log(document.getElementById('log'));
graph = new Graph();
serial = new Serial(10000,log,graph);
command = new Command();
voice = new Voice();   

window.addEventListener("load", function(event) {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
    // if on Mobile phone, Web Bluetooth API should be used
    serial.API = 'bluetooth';
    baud.style.display = 'none';
    setInterval(function(){
      if (serial.connected && serial.binary){
        serial.sendBinary();
      }
    },50);
  }else{
    // if on computer, Web Serial API should be used
    serial.API = 'serial';//'serial';
    if ("serial" in navigator === false) {
      connect_btn.disabled = true;
      log.write('Web Serial API not supported. Enable experimental features.',2);
      log.write('chrome://flags/#enable-experimental-web-platform-features',2);
      log.write('opera://flags/#enable-experimental-web-platform-features',2);
      log.write('edge://flags/#enable-experimental-web-platform-features',2);
    }else{
      setInterval(function(){
        if (serial.connected && serial.binary){
          serial.sendBinary();
        }
      },50);
    }
  }
  
});

window.onbeforeunload = function(event){ serial.connected = false;};

// Execute a function when the user releases a key on the keyboard
steerIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    send();
  }
});
speedIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    send();
  }
});
 
function switchView(){
  if (view == "log"){
    switch_btn.innerHTML = '<ion-icon name="reader-outline"></ion-icon>';
    chart.style.display = "block";
    logger.style.display = "none";
    view = "chart";
    graph.relayout();
  }else{
    switch_btn.innerHTML = '<ion-icon name="analytics-outline"></ion-icon>';
    chart.style.display = "none";
    logger.style.display = "block";
    view = "log";
  }
}

function deleteData(){
  if (view == "log"){
    log.clear();
  }else{
    graph.clear();
  }
}

function toggle(){
 serial.binary = document.getElementById('mode').value == "binary";
}

function pauseUpdate(){
  if (log.isPaused){
    pause_btn.innerHTML = '<ion-icon name="pause-outline"></ion-icon>';
  }else{
    pause_btn.innerHTML = '<ion-icon name="play-outline"></ion-icon>';
  }
  log.isPaused = !log.isPaused;
  graph.isPaused = !graph.isPaused;
}

function send() {
  command.setSpeed(parseInt(steerIn.value),parseInt(speedIn.value));
}