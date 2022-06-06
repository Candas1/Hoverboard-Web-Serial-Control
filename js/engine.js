  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var source1 = null;
  var source2 = null;
  var rate1 = {min: 0.8, max: 2.2};
  var rate2 = {min: 0.5, max: 2.2};
  var xhr1 = new XMLHttpRequest();
  var xhr2 = new XMLHttpRequest();
  var intervalId1 = null;
  var intervalId2 = null;


  function start(){
    xhr1.open("GET", "https://candas1.github.io/Hoverboard-Web-Serial-Control/sounds/motorcycle-start.mp3", true);
    xhr1.responseType = "arraybuffer";
    xhr1.onload = function(e){
      var audioData = this.response;
      source1 = audioCtx.createBufferSource();
      audioCtx.decodeAudioData(audioData, function(buffer) {
        source1.buffer = buffer;
        source1.connect(audioCtx.destination);

        // Start from 0, and loop from 1.5 to 3.5 forever
        source1.loopStart = 1.5;
        source1.loopEnd = 3.5;
        source1.loop = true;
        source1.start(audioCtx.currentTime,0);             
      });
      intervalId1 = setInterval(function(){
        source1.playbackRate.value = speedo.map(telemetry.cmd2,1000,3000,rate1.min,rate1.max);
      }, 50);
    };
    xhr1.send(); 

    xhr2.open("GET", "https://candas1.github.io/Hoverboard-Web-Serial-Control/sounds/motorcycle-ride.mp3", true);
    xhr2.responseType = "arraybuffer";
    xhr2.onload = function(e){
      var audioData = this.response;
      source2 = audioCtx.createBufferSource();
      audioCtx.decodeAudioData(audioData, function(buffer) {
        source2.buffer = buffer;
        source2.connect(audioCtx.destination);

        source2.loop = true;
        source2.start(audioCtx.currentTime + 1.1,0);             
      });
      intervalId2 = setInterval(function(){
        // Map the throttle speedometer value to the playback rate
        source2.playbackRate.value = Math.abs(speedo.map(speedo.speedometer.cmd2.value,speedo.speedometer.cmd2.min,speedo.speedometer.cmd2.max,rate2.min,rate2.max));
      }, 50);
    };
    xhr2.send(); 
  }
   
  function stop(){
    // Cancel loop
    source1.loop = false;
    source2.loop = false;
    // Wait for 5 seconds to play the remaining of the audio
    setTimeout(
      function(){
        if (source1) {
          source1.stop();
          source1 = null;
          clearInterval(intervalId1);
        }
        if (source2) {
          source2.stop();
          source2 = null;
          clearInterval(intervalId2);
        }
    },5000);
  }
