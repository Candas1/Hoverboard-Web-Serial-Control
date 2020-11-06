class Log {
  constructor(container) {
    this.innerHTML = '';
    this.maxLogSize = 100;
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

  async update(message,success){
    this.innerHTML = this.innerHTML + this.addSpan(JSON.stringify(message),success) + "<br />";
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
  }

  write(message){
    this.innerHTML += message + "<br />";
    if (Date.now() - this.lastDisplay > this.displayFrequency) this.display();
  }

  truncate(){
    let lines = this.innerHTML.split('<br />');
    if (lines.length > this.maxLogSize){
      this.innerHTML = lines.splice(- this.maxLogSize).join('<br />');
    }
  }

  display(){
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