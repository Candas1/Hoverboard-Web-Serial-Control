var API = document.getElementById('API');
var baudrate = document.getElementById('baudrate');
var sendin = document.getElementById('sendin');
var recin = document.getElementById('recin');
var statsIn = document.getElementById('stats');
var subplotIn = document.getElementById('subplot');
var mixerIn = document.getElementById('mixer');
var viewIn = document.getElementById('view');

var send_btn = document.getElementById('send');
var connect_btn = document.getElementById('connect');
var pause_btn = document.getElementById('pause');
var trash_btn = document.getElementById('trash');

var commandIn = document.getElementById('command');
var crIn = document.getElementById('cr');
var lfIn = document.getElementById('lf');
var write = document.getElementById('write');
var read = document.getElementById('read');
var skip = document.getElementById('skip');
var success = document.getElementById('success');
var error = document.getElementById('error');

var serialdiv  = document.getElementById('serialdiv');
var statsindiv = document.getElementById('statsindiv');
var chartindiv = document.getElementById('chartindiv');
var ctrlindiv  = document.getElementById('ctrlindiv');
var commanddiv = document.getElementById('commanddiv');
var statsdiv   = document.getElementById('statsdiv');
var recdiv     = document.getElementById('recdiv');
var senddiv    = document.getElementById('senddiv');
var outputdiv  = document.getElementById('outputdiv');
var loggerdiv  = document.getElementById('loggerdiv');
var chartdiv   = document.getElementById('chartdiv');
var controlcnv = document.getElementById('controlcnv');
var speedocnv  = document.getElementById('speedocnv');
var bauddiv    = document.getElementById('bauddiv');
var buttondiv  = document.getElementById('buttondiv');
var view = 'log';

log = new Log(loggerdiv);
graph = new Graph();
control = new Control(controlcnv);
speedo = new Speedo(speedocnv);
serial = new Serial(10000);

window.addEventListener("load", function(event) {
  
  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    // if on Mobile phone, only Web Bluetooth API is available
    API.remove(API.selectedIndex);
    bauddiv.style.display = "none";
  }else{
    // if on computer,remove Web Serial API if not available
    if ("serial" in navigator === false) {
      API.remove(API.selectedIndex);
      log.write('Web Serial API not supported. Enable experimental features.',2);
      log.write('chrome://flags/#enable-experimental-web-platform-features',2);
      log.write('opera://flags/#enable-experimental-web-platform-features',2);
      log.write('edge://flags/#enable-experimental-web-platform-features',2);  
    }
  }
  toggleMode();
  toggleAPI();
  toggleStats();
  toggleMixer();
  toggleSubplot();

  serial.setDisconnected()
  if (typeof(Worker)!=="undefined"){
    // Use webworker for interval to work even if tab is unfocused
    w = new Worker("js/timer.js");
    // Run Update
    w.onmessage = function (event) {
      update();
    };
  } else {
    // Web workers are not supported by your browser
    setInterval(update,50);
  }
});


window.addEventListener("resize", function() {
  control.initCanvas();
  speedo.initCanvas();
});

window.addEventListener("orientationchange", function(event) {
  control.initCanvas();
  speedo.initCanvas();
});

window.onbeforeunload = function(event){ serial.connected = false;};

// Execute a function when the user releases a key on the keyboard
commandIn.addEventListener("keyup", function(event) {
  if (event.keyCode === 13) {
    event.preventDefault();
    if (serial.connected) serial.sendAscii(commandIn.value);
  }
});

speedocnv.addEventListener('dblclick', function (e) {
  e.preventDefault();
  speedo.runDemo();
});

function update(){
  // Send Commands
  if (serial.connected){
    if (serial.protocol != "ascii") serial.sendBinary();
  }
  graph.updateGraph();
  log.updateLog();
  control.updateScreen();
  speedo.update();
}

function switchView(newView){
  view = newView;
  switch (view){
    case "log":
      commanddiv.style.display = (sendin.value == "ascii") ? "block" : "none";
      statsdiv.style.display   = (statsIn.checked) ? "block" : "none";
      
      chartindiv.style.display = "none";
      ctrlindiv.style.display  = "none";
      statsindiv.style.display = "block";
      recdiv.style.display     = "block";
      senddiv.style.display    = "block"; 

      chartdiv.style.display   = "none";
      controlcnv.style.display = "none";
      speedocnv.style.display = "none";
      loggerdiv.style.display  = "block";
      buttondiv.style.display  = "block";
      break;
    case "chart":
      statsindiv.style.display = "none";
      ctrlindiv.style.display  = "none";
      chartindiv.style.display = "block";
      recdiv.style.display     = "block";
      senddiv.style.display    = "none"; 

      controlcnv.style.display = "none";
      speedocnv.style.display = "none";
      loggerdiv.style.display  = "none";
      statsdiv.style.display   = "none";
      commanddiv.style.display = "none";
      chartdiv.style.display   = "block";
      buttondiv.style.display  = "block";
      graph.updateGraph();
      break;
    case "control":
      statsindiv.style.display = "none";
      chartindiv.style.display = "none";  
      ctrlindiv.style.display  = "block";
      recdiv.style.display     = "block";
      senddiv.style.display    = "block"; 
      
      loggerdiv.style.display  = "none";
      chartdiv.style.display   = "none";
      statsdiv.style.display   = "none";
      commanddiv.style.display = "none";
      speedocnv.style.display  = "none";
      buttondiv.style.display  = "none";
      controlcnv.style.display = "block";
      control.initCanvas();
      break;
    case "speedo":
      statsindiv.style.display = "none";
      chartindiv.style.display = "none";  
      ctrlindiv.style.display  = "none";
      recdiv.style.display     = "block";
      senddiv.style.display    = "none"; 
      
      loggerdiv.style.display  = "none";
      chartdiv.style.display   = "none";
      statsdiv.style.display   = "none";
      commanddiv.style.display = "none";
      controlcnv.style.display = "none";
      buttondiv.style.display  = "none";
      speedocnv.style.display  = "block";
      speedo.initCanvas();
      break;
  }
}

function toggleAPI(){
  serial.API = API.value;
  baudrate.disabled = (serial.API == "bluetooth");
}

function toggleMode(){
  serial.binaryReceive = (recin.value == "binary");
  serial.protocol = sendin.value;
  switchView(view);
 }

function toggleStats(){
  switchView(view);
}

function toggleMixer(){
  control.mixer = mixerIn.value;
}

function toggleSubplot(){
  graph.subplot(subplotIn.value == "yes");
}

function deleteData(){
  if (view == "log"){
    log.clear();
  }else{
    graph.clear();
  }
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

function sendCommand() {
  serial.sendAscii(commandIn.value);
}