class Graph {
  constructor(){

    this.first = true;
    this.isPaused = false;
    this.traces = [];
    this.countTrace = 0;
    this.lastUpdate = Date.now();
    this.updateFrequency = 200;
    this.update ={};
  
    let time = new Date();

    const data = [
      //{x:time,y:0}
    ];

    const layout = {
      //grid:{ rows:6, columns:1, pattern: 'independent'},
      paper_bgcolor: 'rgb(0,0,0)',
      plot_bgcolor: 'rgb(0,0,0)',
      autosize: true,
      yaxis: {
        mirror: true,
        automargin: true,
        
        linecolor: 'green',
        lineWidth: 1,
        
        tickcolor: "green",
        tickwidth: 1,
        
        gridcolor: "green",
        gridwidth: 1,
        
        zerolinecolor: "green",
        zerolinewidth: 1,
      },
      xaxis: {
        mirror: true,
        automargin: true,

        linecolor: 'green',
        lineWidth: 1,

        tickcolor: "green",
        tickwidth: 1,
        
        gridcolor: "green",
        gridwidth: 1,

        zerolinecolor: "green",
        zerolinewidth: 1,  
      }
    };

    const config = {
      responsive: true
    }

    Plotly.newPlot('chart', data , layout, config);
    //Plotly.deleteTraces('chart',[0]);
  }  

  async updateData(message){
    if ( Date.now() - this.lastUpdate < this.updateFrequency) return;
    this.lastUpdate = Date.now();

    let time = new Date();
    if (this.first){
      // Create new trace for each value
      for (let key in message){
        let update = {
          x: [time],
          y: [message[key]],
          name: key,
          mode: 'lines',
          line: {shape: 'spline'},
          type: 'scatter',
          }; 
        Plotly.addTraces('chart',[update]);
        this.traces.push(this.countTrace);
        this.countTrace++;
      }
      // Prepare empty structure
      this.initUpdateStruct();
      this.first = false;
    }else{
      let countTrace = 0;
      // Add each value to the traces
      for (let key in message){
        this.update.x[countTrace].push(time);
        this.update.y[countTrace].push(message[key]);
        countTrace++;
      }

      if (!this.isPaused){
        // extend traces and relayout
        Plotly.extendTraces('chart', this.update, this.traces);
        this.initUpdateStruct();
        this.relayout();
      }
    } 
  }

  
  initUpdateStruct(){
    // Initialise empty structure for appending traces
    this.update = {x:[],y:[]};
    for( let i= 0; i<this.countTrace;i++){
      this.update.x.push([]);
      this.update.y.push([]);
    }
  }

  relayout(){
    let time = new Date();  
    var olderTime = time.setMinutes(time.getMinutes() - 1);
    var futureTime = time.setMinutes(time.getMinutes() + 1);

    var minuteView = {
          xaxis: {
            type: 'date',
            range: [olderTime,futureTime]
          }
        };

    Plotly.relayout('chart', minuteView);
  }
}