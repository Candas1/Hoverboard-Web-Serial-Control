var baudrate = document.getElementById('baudrate');
var connect_btn = document.getElementById('connect');

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
var chart = document.getElementById('chart');
var control = document.getElementById('control');
var controlPar = control.parentNode;
var view = 'log';

log = new Log(document.getElementById('log'));
graph = new Graph();
serial = new Serial(10000,log,graph);
command = new Command();
voice = new Voice();   

window.addEventListener("load", function(event) {
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // if on Mobile phone, Web Bluetooth API should be used
    serial.API = 'bluetooth';
    baudrate.style.display = 'none';
    setInterval(function(){
      if (serial.connected && serial.binary){
        serial.sendBinary();
      }
    },50);
  }else{
    // if on computer, Web Serial API should be used
    serial.API = 'bluetooth';
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
      },80);
    }
  }
});

window.onbeforeunload = function(event){ serial.connected = false;};

// Execute a function when the user releases a key on the keyboard
steerIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    sendData();
  }
});
speedIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    sendData();
  }
});


['mousedown'].forEach( evt => 
  control.addEventListener(evt, 
    function(event){
      let rect = control.getBoundingClientRect();
      let steer = map(event.clientX,rect.left,rect.right,-1000,1000);
      let speed = map(event.clientY,rect.bottom,rect.top,-1000,1000);
      control.innerHTML = "Steer: " + steer + "<br>" + "Speed: " + speed;
      command.setSpeed(Math.round(steer),Math.round(speed));
    }
  , false));


['touchstart','touchmove'].forEach( evt => 
  control.addEventListener(evt, 
    function(event){
      let rect = control.getBoundingClientRect();
      let steer = map(event.touches[0].clientX,rect.left,rect.right,-1000,1000);
      let speed = map(event.touches[0].clientY,rect.bottom,rect.top,-1000,1000);
      control.innerHTML = "Steer: " + steer + "<br>" + "Speed: " + speed;
      command.setSpeed(Math.round(steer),Math.round(speed));
    }
  , false));

['mouseup','touchend'].forEach( evt => 
  control.addEventListener(evt, 
    function(event){
      control.innerHTML = "Steer: " + 0 + "<br>" + "Speed: " + 0;
      command.setSpeed(0,0);
    }
  , false));

function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function switchView(newView){
  
  switch (newView){
    case 'log':
      chart.style.display = "none";
      logger.style.display = "block";
      control.style.display = "none";
      break;
    case 'chart':
      chart.style.display = "block";
      logger.style.display = "none";
      control.style.display = "none";
      graph.relayout();
      break; 
    case 'control':
      chart.style.display = "none";
      logger.style.display = "none";
      control.style.display = "block";
      break;  
  }
  view = newView;

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

function sendData() {
  command.setSpeed(parseInt(steerIn.value),parseInt(speedIn.value));
}