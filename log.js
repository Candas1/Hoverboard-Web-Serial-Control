class Log {
  constructor(container) {
    this.innerHTML = '';
    this.maxLogSize = 2000;
    this.container = container;
    this.lastDisplay = 0;
    this.displayFrequency = 100;
    this.isPaused = false;
  }

  addSpan(text,type){
    switch (type){
      case 1:
        return "<span class='success'>" + text + "</span>";
      case 2:
        return "<span class='error'>" + text + "</span>";   
      case 3:
        return "<span class='info'>" + text + "</span>";
      case 4:
        return "<span class='field'>" + text + "</span>";
      case 5:
        return "<span class='value'>" + text + "</span>";
    }
  }

  // write to log buffer
  async write(message,type){
    this.innerHTML += ( (type == 0 ) ? message : this.addSpan(message,type) ) + "<br />";
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
  }

  async writeLog(message){
    this.write(Object.keys( message ).map( 
      function(key){ 
        return log.addSpan(key + ":" ,4) + log.addSpan(message[key],5) 
      }).join(" "),0);
  }

  // Truncate to only keep maximum number of lines in the log
  truncate(){
    let lines = this.innerHTML.split('<br />');
    if (lines.length > this.maxLogSize){
      this.innerHTML = lines.splice(- this.maxLogSize).join('<br />');
    }
  }

  // refresh log div 
  async display(){
    if (!this.isPaused) this.truncate();
    if (view!='log') return; 
    this.container.innerHTML = this.innerHTML;
    if (!this.isPaused) this.container.scrollTop = this.container.scrollHeight;
    this.lastDisplay = Date.now();
    //console.log("Log Updated");
  }

  clear(){
    this.innerHTML = '';
    this.display();
  };

}