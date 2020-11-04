class Graph {
  constructor(ctx){
    this.chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',
        data: {
          labels: []
        },
        // Configuration options go here
        options: {
            legend:{
              position:'right',
            },
            hover: {
              animationDuration:0,  
            },
            scales: {
                xAxes: [{
                    display:true,
                    color: "rgb(0, 128, 0)",
                    gridLines: {
                        drawBorder:true,
                        display:true,
                        color: "rgb(0, 128, 0)",
                        lineWidth:1,
                    }
                }],
                yAxes: [{
                    display:true,
                    color: "rgb(0, 128, 0)",
                    gridLines: {
                      drawBorder:true,
                        display:true,
                        color: "rgb(0, 128, 0)",
                        lineWidth:1,
                    }   
                }]
            },
            backgroundColor: 'rgb(0,0,0,0)',
            elements: {
                point:{
                  radius: 1
                },
                line: {
                    tension: 0 // disables bezier curves
                }
            },
            tooltip: { enabled : false},
            responsive: true,
            plugins: {
                colorschemes: {
                    scheme: 'brewer.Paired12'
                }
            }
        }
    });

    this.bufferSize = 100;
    for(let i=0; i<this.bufferSize;i++){
      this.chart.data.labels.push(i);
    }
    this.lastDisplay = 0;
    this.displayFrequency = 200;
  }  

  update(){
    //if (connected) {
      if (Date.now() - this.lastDisplay > this.displayFrequency){
        //if (pause_btn.innerHTML == 'Pause'){
          this.chart.update(0);
          this.lastDisplay = Date.now();
        //}
      }
    //}  
  }

  updateData(message){  
    for (var key in message){
      let found = false;
      this.chart.data.datasets.forEach((dataset) => {
        if (dataset.label == key){ 
          // Remove first value and add as last one
          dataset.data.shift(); 
          dataset.data.push(message[key]);
          found = true;
        }
      });

      if (!found){
        // This is a new variable/dataset
        let zeroArray = new Array(this.bufferSize).fill(0);
        zeroArray[-1] = message[key];
        this.chart.data.datasets.push({label:key ,data:zeroArray, borderWidth:1,fill:false});
        console.log(key + ' dataset created\n');
      }
    }
    this.update();
  }
}