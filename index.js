var baud = document.getElementById('baud');
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
  if ("serial" in navigator === false) {
    connect_btn.disabled = true;
    let alertMessage = 'Web Serial API not supported. Enable experimental features.<br />' +
                       'chrome://flags/#enable-experimental-web-platform-features<br />' +
                       'opera://flags/#enable-experimental-web-platform-features<br />' +
                       'edge://flags/#enable-experimental-web-platform-features<br />';
    log.write(alertMessage,2);
  }else{
    setInterval(function(){
      if (serial.connected && serial.binary){
        
      }
    },100);
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
    switch_btn.innerHTML = '<ion-icon name="pulse-outline"></ion-icon>';
    chart.style.display = "none";
    logger.style.display = "block";
    view = "log";
  }
}

function toggle(){
 serial.binary = !document.getElementById('ascii').checked;
}

async function pause(){
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