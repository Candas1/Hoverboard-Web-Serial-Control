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
var connected = false;
var speed = 0;
var steer = 0;
var binary = true;
var isListening = false;
var view = 'log';

log = new Log(document.getElementById('log'));

window.addEventListener("load", function(event) {
  if ("serial" in navigator === false) { 
    let alertMessage = 'Web Serial API not supported. Enable experimental features.<br />' +
                       'chrome://flags/#enable-experimental-web-platform-features<br />' +
                       'opera://flags/#enable-experimental-web-platform-features<br />' +
                       'edge://flags/#enable-experimental-web-platform-features<br />';
    log.write(alertMessage);
  }
});

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

graph = new Graph();
serial = new Serial(10000,log,graph);

if (annyang) {
  // Let's define a command.
  const commands = {
    'Board *command': voiceCommand
  };

  // Add our commands to annyang
  annyang.addCommands(commands);
  annyang.setLanguage('en-US');
}

setInterval(function(){
   if (connected){
    if (binary){
      serial.sendBinary();
    }
   }
},100);


//setInterval(function(){graph.updateData({cmd1:Math.random(),cmd2:Math.random(),cmd3:Math.random(),cmd4:Math.random(),cmd5:Math.random(),cmd6:Math.random()});},3000);

var port;
var reader;
var writer;

const encoder = new TextEncoderStream();
let decoder = new TextDecoderStream();

async function connect() {

 if ( connected){
  connected = false;
  connect_btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon>';
  return;
 }

 if ("serial" in navigator) {

   // The Serial API is supported.
   port = await navigator.serial.requestPort();
   // Open and begin reading.
   await port.open({
     baudRate: baud.value
   });

   connected = true;
   connect_btn.innerHTML = '<ion-icon name="flash-off-outline"></ion-icon>';
   send_btn.disabled = !connected;
   

   while (port.readable) {
     if (binary){
       inputStream = port.readable;
       reader = inputStream.getReader();
     }else{
       inputDone = port.readable.pipeTo(decoder.writable);
       inputStream = decoder.readable;
       reader = inputStream.getReader();
     }

     outputStream = port.writable;
     writer = outputStream.getWriter();

     readLoop();

     }
   }
 };

 async function voiceCommand(speech){
   let param1 = 0;
   let words = speech.split(' ');

   if (!connected) return;
   if (words.length == 0 ) return;
   let command = words[0];
   if (words.length == 2 ) param1 = parseInt(words[1]);

   switch(command){
     case 'speed':
       if ( !isNaN(param1)){ 
         if ( param1 >= -500 && param1 <= 500 ){ 
           speedIn.value = param1;
           send();
           log.write("Executing voice command:" & command & " " & param1);
         }
       }
       break;
      case 'steer':
        if ( !isNaN(param1) ){ 
          if ( param1 >= -500 && param1 <= 500 ){ 
            steerIn.value = param1;
            send();
            log.write("Executing voice command:" & command & " " & param1);
          }
        }
        break;
        case 'stop':
          steerIn.value = "";
          speedIn.value = "";
          send();
          break;

     default:
      log.write('Unknown command');       
   }

   log.write(speech);
 }

 async function readLoop(){
  while (true){
    let value, done;
    try {
      ({ value, done } = await reader.read());
    } catch (error) {
      console.log(error);
      break;
    }
    if (done) {
      console.log("Reader canceled");
      break;
    }
    
    if (binary){
      serial.write(value);
      serial.readLoop();
    }else{
      log.write(value.replaceAll(/\n/g,"<br />"));
      updateAsci(value);
    }
    if (!connected) break;
   }

   writer.releaseLock();
   reader.releaseLock();
   await port.close();

   connect_btn.innerHTML = '<ion-icon name="flash-outline"></ion-icon>';
   send_btn.disabled = !connected;

 }

 function updateAsci(value){
   if (value[0] == 1){
     words = value.replaceAll(/\n/g, "").split(" ");
     let message = {};
     for(var i = 0; i < words.length; i++) {
       if (words[i].split(':')[0] < 10) {
           message[words[i].split(':')[0]] = words[i].split(':')[1];
       }else{
         message = {};    
       }
     }
     if (Object.entries(message).length > 0) {
       graph.updateData(message);
     }
   }
 }

 
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

   function listen(){
    if (annyang) {
      if (isListening){
        // Stop listening.
        annyang.abort();
      }else{
        // Start listening.
        annyang.start();
      }
      isListening = !isListening;
      listen_btn.innerHTML = '<ion-icon name="mic' + ( (isListening) ? '-off' : '') + '-outline"></ion-icon>';
    }
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
   if (binary){
     steer = parseInt(steerIn.value);
     speed = parseInt(speedIn.value);
     serial.sendBinary();
   }else{
     writer.write(command.value);
   }
 }