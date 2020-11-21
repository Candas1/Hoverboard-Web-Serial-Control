class Log {
  constructor(container) {
    this.innerHTML = '';
    this.maxLogSize = 2000;
    this.container = container;
    this.lastDisplay = 0;
    this.displayFrequency = 200;
    this.isPaused = false;
  }

  addSpan(text,success){
    if (success){
      return "<span class='success'>" + text + "</span>";
    }else{
      return "<span class='error'>" + text + "</span>";   
    }
  }

  // write to log buffer
  write(message,success){
    this.innerHTML += this.addSpan(message,success) + "<br />";
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
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
    this.container.innerHTML = this.innerHTML;
    if (!this.isPaused) this.container.scrollTop = this.container.scrollHeight;
    this.lastDisplay = Date.now();
  }

  clear(){
    this.innerHTML = '';
    this.display();
  };

}