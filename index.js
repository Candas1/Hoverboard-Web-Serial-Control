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


var serialdiv  = document.getElementById('serialdiv');
var statsdiv   = document.getElementById('statsdiv');
var loggerdiv  = document.getElementById('loggerdiv');
var chartdiv   = document.getElementById('chartdiv');
var controldiv = document.getElementById('controldiv');
var view = 'log';

log = new Log(loggerdiv);
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
  controldiv.addEventListener(evt, 
    function(event){
      let rect = controldiv.getBoundingClientRect();
      let steer = map(event.clientX,rect.left,rect.right,-1000,1000);
      let speed = map(event.clientY,rect.bottom,rect.top,-1000,1000);
      control.innerHTML = "Steer: " + steer + "<br>" + "Speed: " + speed;
      command.setSpeed(Math.round(steer),Math.round(speed));
    }
  , false));


['touchstart','touchmove'].forEach( evt => 
  controldiv.addEventListener(evt, 
    function(event){
      let rect = controldiv.getBoundingClientRect();
      let steer = map(event.touches[0].clientX,rect.left,rect.right,-1000,1000);
      let speed = map(event.touches[0].clientY,rect.bottom,rect.top,-1000,1000);
      control.innerHTML = "Steer: " + steer + "<br>" + "Speed: " + speed;
      command.setSpeed(Math.round(steer),Math.round(speed));
    }
  , false));

['mouseup','touchend'].forEach( evt => 
  controldiv.addEventListener(evt, 
    function(event){
      controldiv.innerHTML = "Steer: " + 0 + "<br>" + "Speed: " + 0;
      command.setSpeed(0,0);
    }
  , false));

function map(x, in_min, in_max, out_min, out_max) {
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

function switchView(newView){
  
  switch (newView){
    case 'log':
      chartdiv.style.display = "none";
      loggerdiv.style.display = "block";
      controldiv.style.display = "none";
      break;
    case 'chart':
      chartdiv.style.display = "block";
      loggerdiv.style.display = "none";
      controldiv.style.display = "none";
      graph.relayout();
      break; 
    case 'control':
      chartdiv.style.display = "none";
      loggerdiv.style.display = "none";
      controldiv.style.display = "block";
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
    pause_btn.innerHTML = '<ion-icon name="pause"></ion-icon>';
  }else{
    pause_btn.innerHTML = '<ion-icon name="play"></ion-icon>';
  }
  log.isPaused = !log.isPaused;
  graph.isPaused = !graph.isPaused;
}

function sendData() {
  command.setSpeed(parseInt(steerIn.value),parseInt(speedIn.value));
}