class Serial {
    constructor(size,log,graph) {
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
        this.overwrite = false;
        this.error = 0;
        this.skip = 0;
        this.success = 0;
        this.serial_frame = 0xABCD;
    }

    write(chunk){
      // add new chunk to the buffer
      for (let i=0, strLen=chunk.length; i < strLen; i++) {       
        this.writedv.setUint8(this.writeOffset,chunk[i],true);
        this.setWriteOffset( this.writeOffset + 1);
      }
    }

    readLoop(){


      while ( (this.writeOffset + this.bufferSize * this.overwrite) >= (this.readOffset + this.messageSize)){  
        this.readBinary();
      }
    }

    address(offset){
      if (offset >= this.bufferSize) {
        return offset - this.bufferSize;
      }else{
        return offset;
      }
    }

    setReadOffset(offset){
      if ( this.readOffset > this.address(offset) ) this.overwrite = false;
      read.value = this.readOffset = this.address(offset); 
    }

    setWriteOffset(offset){
      if ( this.writeOffset > this.address(offset) ) this.overwrite = true;
      write.value = this.writeOffset = this.address(offset);
    }

    readBinary(){
      // copy to new buffer and continue from beginning of buffer if needed
      for (let i=0, strLen=this.messageSize; i < strLen; i++) {       
        let val = this.writedv.getUint8(this.address(this.readOffset + i),true);
        this.readdv.setUint8(i,val,true);
      }
      
      let frame = this.readdv.getUint16(0,true);
      if (frame != this.serial_frame){
        this.setReadOffset(this.readOffset + 1); // incorrect start frame, increase read offset
        skip.value = this.skip++;    
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
        success.value = this.success++;
        this.graph.updateData(message);
      }else{  
        error.value = this.error++;  
      }

      message.checksum = checksum;
      message.calcChecksum = calcChecksum;
      this.log.update(message,checksum == calcChecksum);
      this.setReadOffset(this.readOffset + this.messageSize); // increase read offset by message size
    }

    async sendBinary() {
      var ab = new ArrayBuffer(8);
      var dv = new DataView(ab);
      
      dv.setUint16(0,this.serial_frame,true);
      dv.setInt16(2, steer,true);
      dv.setInt16(4, speed,true);
      dv.setUint16(6,this.serial_frame ^ steer ^ speed,true);
    
      let view = new Uint8Array(ab);
      writer.write(view);
      
    };
}