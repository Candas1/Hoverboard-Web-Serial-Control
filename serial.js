class Serial {
  constructor(size,log,graph) {
    this.API = 'bluetooth';
    this.bluetoothName = 'BT05';
    this.bluetoothService = 0xffe0;
    this.bluetoothCharacteristic = 0xffe1;
    this.connected = false;
    this.binary = false;
    this.bufferSize = size;
    this.writeBuffer = new ArrayBuffer(this.bufferSize);
    this.writedv = new DataView(this.writeBuffer);
    this.messageSize = 18;
    this.readBuffer = new ArrayBuffer(this.messageSize);
    this.readdv = new DataView(this.readBuffer);
    this.writeOffset = 0;
    this.readOffset = 0;
    this.log = log;
    this.graph = graph;
    this.error = 0;
    this.skip = 0;
    this.success = 0;
    this.serial_start_frame = 0xABCD;
    this.serial_length = 8;
    this.ibus_length = 0x20;
    this.ibus_command = 0x40;
    this.lastStatsUpdate = Date.now();
    this.statsUpdateFrequency = 500;

    this.fieldsAscii = {1:'Input1',
                        2:'Input2',
                        3:'SpeedR',
                        4:'SpeedL',
                        5:'BatADC',
                        6:'BatVoltage',
                        7:'TempADC',
                        8:'TempDeg'
                        };
  }


  setConnected(){
    this.connected = true;
    connect_btn.innerHTML = '<ion-icon name="flash-off"></ion-icon>';
    API.disabled = baudrate.disabled = this.connected;
    send_btn.disabled = !this.connected;  
  }

  setDisconnected(){
    this.connected = false;
    connect_btn.innerHTML = '<ion-icon name="flash"></ion-icon>';
    API.disabled = baudrate.disabled = this.connected;
    send_btn.disabled = !this.connected;
  } 

  async connect() {
    if (this.connected){
      // disconnect
      if (this.API == 'bluetooth'){
        this.device.gatt.disconnect();
      }else{
        this.reader.cancel();
      }

      // Update UI
      this.setDisconnected();
      return;
    }
    
    if ( this.API == 'serial'){
      this.connectSerial();
    }else{
      this.connectBluetooth();
    } 
  }

  async connectSerial(){
    if ("serial" in navigator) {

      this.port = await navigator.serial.requestPort();
      // Open and begin reading.
      await this.port.open({
        baudRate: baudrate.value
      });
      
      // Update UI
      this.setConnected();
 
      while (this.port.readable) {
        this.inputStream = this.port.readable;
        this.reader = this.inputStream.getReader();
        
        try{
          while (true){
            const { value, done } = await this.reader.read();
            if (done) {
              log.write("Reader canceled",2);
              break;
            }
    
            //if (serial.binary) serial.sendBinary();
            this.bufferWrite(value);
            this.readLoop();
            if (!this.connected) break;
          }
        }catch (error) {
          // Handle non-fatal read error.
          console.log(error,2);
        } finally{
          
        }
        if (!this.connected) break;   
      }

      this.reader.releaseLock();
      this.port.close();
      this.setDisconnected();
    }
  }

  connectBluetooth(){
    let options = {
          //acceptAllDevices:true,
          optionalServices:[this.bluetoothService],
          filters: [{ name: [this.bluetoothName] },{services: [this.bluetoothService]}],
          };
    navigator.bluetooth.requestDevice(options)
    .then(device => {
      //console.log(device);
      this.device = device;
      device.addEventListener('gattserverdisconnected', this.onDisconnected);
      return device.gatt.connect();
    }).
    then((server) => {
      //console.log(server);

      // Update UI
      this.setConnected();
      
      this.server = server;
      return server.getPrimaryService(this.bluetoothService);
    })
    .then((service) => {
      //console.log(service);
      this.service = service;
      return service.getCharacteristic(this.bluetoothCharacteristic);
    })
    .then(characteristic => characteristic.startNotifications())
    .then((characteristic) => {
      //console.log(characteristic);
      this.characteristic = characteristic;
      this.characteristic.addEventListener('characteristicvaluechanged',this.handleCharacteristicValueChanged);
    })
    .catch(error => {
      console.log(error);
    });
  }

  handleCharacteristicValueChanged(event) {
    let chunk = new Uint8Array(event.target.value.buffer);
    serial.bufferWrite(chunk);
    serial.readLoop();
    //serial.sendBinary();
  }

  onDisconnected(event) {
    // Update UI
    serial.setDisconnected();
  }

  bufferWrite(chunk){
    // add new chunk to the buffer
    for (let i=0, strLen=chunk.length; i < strLen; i++) {       
      this.writedv.setUint8(this.address(this.writeOffset),chunk[i],true);
      this.setWriteOffset(this.writeOffset + 1);
    }
  }

  readLoop(){
    if (this.binary){
      // read as long as there is enough data in the buffer
      while ( (this.writeOffset) >= (this.readOffset + this.messageSize)){
        this.readBinary();
      }
    }else{
      // Read buffer until \n
      while ( (this.writeOffset) >= (this.readOffset)){
        if (this.writedv.getUint8(this.address(this.readOffset),true) != 0x0A){
          this.skipByte();
        }else{
          let found = this.readAscii();
          if (!found) break;
        }
      }
    }
    this.displayStats();
  }

  address(offset){
    return offset%this.bufferSize;
  }
  
  setReadOffset(offset){
    this.readOffset = offset; 
  }

  setWriteOffset(offset){
    this.writeOffset = offset;
  }

  skipByte(){
    this.setReadOffset(this.readOffset + 1); // incorrect start frame, increase read offset
    this.skip++;
  }

  displayStats(){
    if ( ( Date.now() - this.lastStatsUpdate < this.statsUpdateFrequency) || statsdiv.style.display == 'none' ) return;
      this.lastStatsUpdate = Date.now();

    read.value = this.address(this.readOffset);
    write.value = this.address(this.writeOffset);
    success.value = this.success;
    skip.value = this.skip;
    error.value = this.error;
  }

  readBinary(){
    // copy chunk to new arrayBuffer
    for (let i=0, strLen=this.messageSize; i < strLen; i++) {       
      let val = this.writedv.getUint8(this.address(this.readOffset + i),true);
      this.readdv.setUint8(i,val,true);
    }
    
    let frame = this.readdv.getUint16(0,true);
    if (frame != this.serial_start_frame){
      this.skipByte();    
      return;
    }

    let message = {};
    message.cmd1 = this.readdv.getInt16(2,true);
    message.cmd2 = this.readdv.getInt16(4,true);
    message.speedR = this.readdv.getInt16(6,true);
    message.speedL = this.readdv.getInt16(8,true);
    message.batVoltage = this.readdv.getInt16(10,true);
    message.boardTemp = this.readdv.getInt16(12,true);
    message.cmdLed = this.readdv.getUint16(14,true);
    let checksum = this.readdv.getUint16(16,true);
    let calcChecksum = frame ^ 
                       message.cmd1 ^ 
                       message.cmd2 ^ 
                       message.speedR ^ 
                       message.speedL ^ 
                       message.batVoltage ^ 
                       message.boardTemp ^ 
                       message.cmdLed;
    
    // Trick to convert calculated Checksum to unsigned
    this.readdv.setInt16(16,calcChecksum,true);
    calcChecksum = this.readdv.getUint16(16,true);
    
    if ( checksum == calcChecksum ){
      this.success++;
      this.graph.updateData(message);
    }else{  
      this.error++;  
    }

    message.checksum = checksum;
    //message.calcChecksum = calcChecksum;
    this.log.writeLog(message);
    this.setReadOffset(this.readOffset + this.messageSize); // increase read offset by message size
  }
 
  readAscii(){
    let string = '';
    let i = 1;
    let found = false;
    // read until next \n
    while (this.writeOffset >= this.readOffset + i){
      let char = this.writedv.getUint8(this.address(this.readOffset + i),true); 
      if ( char == 0x0A){
        // Save new read pointer
        this.setReadOffset(this.readOffset + i);
        found = true;
        break;  
      }else{
        string += String.fromCharCode(char);
        i++;
      }
    }
    
    // \n not found, buffer probably doesn't have enough data, exit
    if (!found){
      return false;
    }

    let words = string.split(" ");
    let message = {};
    let err = false;

    if (words[0].split(":").length == 1 ){
      // Print message, no need to parse it
      log.write(string,3);
      return true;
    }
    
    for(let j = 0; j < words.length; j++) {
      let index = words[j].split(':')[0];
      let value = words[j].split(':')[1];
      
      if (value === undefined) err = true;
      
      if (index in this.fieldsAscii){
        message[this.fieldsAscii[index]] = value;
      }else{
        message[index] = value;
      }
    }
  
    if (!err && Object.entries(message).length > 0) {
      this.success++;
      log.writeLog(message);
      graph.updateData(message);
      return true;
    }else{
      this.error++;
      log.write(string,2);
      return true;
    }
  }

  sendBinary() {
    var ab = new ArrayBuffer(protocol.value == "usart" ? this.serial_length : this.ibus_length);
    var dv = new DataView(ab);

    if (protocol.value == "usart"){
      dv.setUint16(0,this.serial_start_frame,true);
      dv.setInt16(2, control.channel[0],true);
      dv.setInt16(4, control.channel[1],true);
      dv.setUint16(6,this.serial_start_frame ^ control.channel[0] ^ control.channel[1],true);
      let bytes = new Uint8Array(ab);
      this.send(bytes);
    }else{
      // Write Ibus Start Frame
      dv.setUint8(0,this.ibus_length);
      dv.setUint8(1,this.ibus_command);
      //control.channels = [0x5DB,0x5DC,0x554,0x5DC,0x3E8,0x7D0,0x5D2,0x3E8,0x5DC,0x5DC,0x5DC,0x5DC,0x5DC,0x5DC];
      
      // Write channel values
      for (let i=0; i< control.channel.length * 2;i+=2){
        dv.setUint16(i+2, control.map(control.channel[i/2] ,-1000,1000,1000,2000) ,true);
      }

      // Calculate checksum
      let checksum = 0xFFFF;
      for (let i=0; i<30;i++){
        checksum -= dv.getUint8(i);
      }
      dv.setUint16(30,checksum,true);
      
      let bytes = new Uint8Array(ab);
      this.send(bytes);
    }
  };

  sendAscii(text) {
    let command = text + (crIn.checked ?"\r":"") + (lfIn.checked ?"\n":"");

    let encoder = new TextEncoder();
    let bytes = encoder.encode(command);
    this.send(bytes);
  };

  async send(bytes){
    if (this.API == 'serial'){
      this.outputStream = this.port.writable;
      this.writer = this.outputStream.getWriter();
      this.writer.write(bytes);
      this.writer.releaseLock();
    }else{
      let chunksize = 20;
      let sent = 0;
      while(sent < bytes.length){
        // Sent chunks of 20 bytes because of BLE limitation
        //console.log(bytes.slice(sent,sent+chunksize));
        this.characteristic.writeValueWithoutResponse(bytes.slice(sent,sent+chunksize));
        sent += chunksize;
      }
    } 
  }
}