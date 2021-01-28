class Graph {
  constructor(){
    this.isPaused = false;
    this.key2trace = {};
    this.traces = [];
    this.countTrace = 0;
    this.visibleTrace = 0;
    this.autoScroll = true;
    this.newDatapoints = 0;
    this.subplotview = false;
    this.lastDataUpdate = Date.now();
    this.dataUpdateFrequency = 50;
    this.lastGraphUpdate = Date.now();
    this.graphUpdateFrequency = 400;
    this.trace = {
      x: [],
      y: [],
      name: "",
      legendgroup : "",
      mode: 'lines',
      line: {width:2}, //,shape: 'spline',smoothing:1.3},
      type: 'scattergl',
      };

    const color = 'lemonchiffon'; 
    const width = 1; 
    this.yaxis = {
      domain:[0,1],
      visible: true,
      autorange: true,
      autoscale: true,
      autoticks:true,
      mirror:true,
      
      showline: true,
      linecolor: color,
      lineWidth: width,
      
      tickcolor: color,
      tickwidth: width,
      
      showgrid: false,
      gridcolor: color,
      gridwidth: width,
      
      //zeroline:true,
      //zerolinecolor: color,
      //zerolinewidth: width,
    };

    this.xaxis = {
      type: 'date',
      domain:[0,1],
      autorange: false,
      autoscale: false,
      autoticks: false,
      mirror:true,
      
      //showline: true,
      //linecolor: color,
      //lineWidth: width,

      showticklabels: false,
      ticks: "",
      tickcolor: color,
      tickwidth: width,
      
      showgrid: false,
      gridcolor: color,
      gridwidth: width,

      zeroline:false,
      zerolinecolor: color,
      zerolinewidth: width,
    };

    this.layout = {
      grid:{ rows:1, columns:1, pattern:'independent' , roworder:'top to bottom'},
      margin: {l:50, r:0, t:30, b:10},
      paper_bgcolor: 'rgb(0,0,0)',
      plot_bgcolor: 'rgb(0,0,0)',
      dragmode: 'pan',
      legend:{
        y: 0.95,
        itemclick:'toggle',
        itemdoubleclick:'toggleothers',
        tracegroupgap:5,
        title:{
          text:"Channels",
          font:{
            color: '#FFF',
          },
        },
        font:{
          color: '#FFF',
        },
      },
      autosize: true,
      yaxis: JSON.parse(JSON.stringify(this.yaxis)),
      xaxis: JSON.parse(JSON.stringify(this.xaxis)),
    };
    
    this.config = {
      responsive: true,
      displayModeBar: true,
      modeBarButtonsToRemove: ['lasso2d','plotlylogo'],
    }

    Plotly.newPlot(chartdiv, [] , this.layout, this.config);
    chartdiv.on('plotly_legendclick', this.legendClick.bind(this) ); 
    chartdiv.on('plotly_relayout', function(data){
      if (!this.autoScroll && !this.isPaused) { 
        this.isPaused = false; // will be inverted in next function 
        pauseUpdate();
      }else{
        this.autoScroll = false;
      }
    }.bind(this));
  }

  legendClick(data){
    if (this.subplotview){
      // if subplotview is active, toggle the visibility of the selected axis
      let yaxis = 'yaxis' + ( data.curveNumber==0?'':(data.curveNumber+1)); 
      this.layout[yaxis].visible = !this.layout[yaxis].visible;
      
      // Adjust number of visible traces
      if (!this.layout[yaxis].visible){
        this.visibleTrace--;
      }else{
        this.visibleTrace++;
      }
      this.autoScroll = true;
      Plotly.relayout(chartdiv, this.layout);
      this.subplot(true);
    }
  }

  async updateData(message){
    if ( Date.now() - this.lastDataUpdate < this.dataUpdateFrequency) return;
    this.lastDataUpdate = Date.now();

    let time = new Date();

    // Create new trace for each value
    for (let key in message){
      if (key == "frame" || key == "checksum" || key == "cmdLed") continue;

      // New field
      if (!(key in this.key2trace)){ 
        this.key2trace[key] = this.countTrace; 
        this.trace.name = key; 
        Plotly.addTraces(chartdiv,[this.trace]);
        this.traces.push(this.countTrace);
        
        // Add axis for subplot
        let yaxis = 'yaxis' + ( this.countTrace==0?'':(this.countTrace+1));
        this.layout[yaxis] = JSON.parse(JSON.stringify(this.yaxis));

        this.countTrace++;
        this.visibleTrace++; 
        // Prepare empty structure
        this.initUpdateStruct();
        // Adjust subplot if needed
        if (this.subplotview) this.subplot(true);
      }else{
        this.update.x[this.key2trace[key]].push(time);
        this.update.y[this.key2trace[key]].push(message[key]);
        this.newDatapoints++;
      }
    }
  }

  updateGraph(){
    if ( (!this.isPaused) && (view=='chart') && 
         ( Date.now() - this.lastGraphUpdate > this.graphUpdateFrequency)
       ){
       if (this.newDatapoints > 0){
        // extend traces and relayout
        Plotly.extendTraces(chartdiv, this.update, this.traces);
        this.initUpdateStruct();
        this.newDatapoints = 0;
      }
      this.relayout();
      this.lastGraphUpdate = Date.now();
    }
  }

  clear(){
    // Delete additional axis for subplot
    for(let i=0;i<this.countTrace;i++){
      if (i>0){
        let yaxis = 'yaxis' + (i+1);
        delete this.layout[yaxis];
      }
    }

    this.newDatapoints = this.visibleTrace = this.countTrace = 0;
    this.traces = [];
    this.key2trace = {};   
    Plotly.newPlot(chartdiv, [] , this.layout, this.config);
  }

  subplot(param){
    this.subplotview = param;
    let update = {yaxis:[]};
    let count = 0;
    for(let i=0;i<this.countTrace;i++){
      let yaxis = 'yaxis' + ( i==0?'':(i+1));
      update.yaxis.push("y" + (!param ? "" : (i+1)) );
      if (!param) {
        this.layout[yaxis].visible = true;
        this.layout[yaxis]['domain'] = [0,1];
      }else{
        // If subplot if visible, adjust domain
        if (this.layout[yaxis].visible){
          this.layout[yaxis]['domain'] = this.getDomain(count);
          count++;
        }
      }
    }

    Plotly.update(chartdiv, update,this.layout);
  }

  getDomain(i) {
    var N = this.visibleTrace;
    var spacing = 0.05;
    
    return [
      (1 / N) * i + (i === 0 ? 0 : spacing / 2),
      (1 / N) * (i + 1) - (i === (N - 1) ? 0 : spacing / 2)
    ]
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
    this.autoScroll = true;
    let time = new Date(this.lastDataUpdate);
    var olderTime = time.setSeconds(time.getSeconds() - 10);	
    var futureTime = time.setSeconds(time.getSeconds() + 10);
    
    this.layout.xaxis.range = [olderTime,futureTime];
    this.layout.xaxis.autorange = false;
    this.layout.xaxis.autoscale = true;
    Plotly.relayout(chartdiv, this.layout);
  }
}