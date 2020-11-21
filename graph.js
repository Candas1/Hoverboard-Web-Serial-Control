class Graph {
  constructor(){

    this.isPaused = false;
    this.key2trace = {};
    this.traces = [];
    this.countTrace = 0;
    this.lastDataUpdate = Date.now();
    this.dataUpdateFrequency = 200;
    this.lastGraphUpdate = Date.now();
    this.graphUpdateFrequency = 500;
    this.trace = {
      x: [],
      y: [],
      name: "",
      mode: 'lines',
      line: {shape: 'spline',smoothing:1},
      type: 'scattergl',
      };
  
    let time = new Date();

    const data = [];

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
  }  

  async updateData(message){
    if ( Date.now() - this.lastDataUpdate < this.dataUpdateFrequency) return;
    this.lastDataUpdate = Date.now();

    let time = new Date();

    // Create new trace for each value
    for (let key in message){
      // New field
      if (!(key in this.key2trace)){ 
        this.key2trace[key] = this.countTrace; 
        this.trace.name = key;
        Plotly.addTraces('chart',[this.trace]);
        this.traces.push(this.countTrace);
        this.countTrace++;
 
        // Prepare empty structure
        this.initUpdateStruct();
      }else{
        this.update.x[this.key2trace[key]].push(time);
        this.update.y[this.key2trace[key]].push(message[key]);
      }
    }

    if (!this.isPaused && ( Date.now() - this.lastGraphUpdate > this.graphUpdateFrequency) ){
      // extend traces and relayout
      Plotly.extendTraces('chart', this.update, this.traces);
      this.initUpdateStruct();
      this.relayout();
      this.lastGraphUpdate = Date.now();
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