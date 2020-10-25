
// Daten darstellen
var data1 = [
    {ser1: 2015, ser2: 29837614},
    {ser1: 2016, ser2: 29825223},
    {ser1: 2017, ser2: 29978635},
    {ser1: 2018, ser2: 30451268},
    {ser1: 2019, ser2: 31031021},
    {ser1: 2020, ser2: 31464680}
 ];
 
var data2 = [
    {ser1: 2015, ser2: 13861404},
    {ser1: 2016, ser2: 14532426},
    {ser1: 2017, ser2: 15089392},
    {ser1: 2018, ser2: 15225296},
    {ser1: 2019, ser2: 15153364},
    {ser1: 2020, ser2: 15111382}
 ];
 
var data3 = [
    {ser1: 2015, ser2: 494148},
    {ser1: 2016, ser2: 475711},
    {ser1: 2017, ser2: 448025},
    {ser1: 2018, ser2: 421283},
    {ser1: 2019, ser2: 395592},
    {ser1: 2020, ser2: 371472}
 ];
 
var data4 = [
    {ser1: 2015, ser2: 81423},
    {ser1: 2016, ser2: 80300},
    {ser1: 2017, ser2: 77187},
    {ser1: 2018, ser2: 75459},
    {ser1: 2019, ser2: 80776},
    {ser1: 2020, ser2: 82198}
 ];
 
var data5 = [
    {ser1: 2015, ser2: 107754},
    {ser1: 2016, ser2: 130365},
    {ser1: 2017, ser2: 186380},
    {ser1: 2018, ser2: 281129},
    {ser1: 2019, ser2: 408408},
    {ser1: 2020, ser2: 641558}
 ];
 
var data6 = [
    {ser1: 2015, ser2: 18948},
    {ser1: 2016, ser2: 25502},
    {ser1: 2017, ser2: 34022},
    {ser1: 2018, ser2: 53861},
    {ser1: 2019, ser2: 83175},
    {ser1: 2020, ser2: 136617}
 ];
 

var margin = {top: 10, right: 30, bottom: 30, left: 80},
     width = 700 - margin.left - margin.right,
     height = 400 - margin.top - margin.bottom;
 
 // svg erstellen und mit obene margin einstellen
var svg = d3.select("#my_dataviz")
   .append("svg")
     .attr("width", width + margin.left + margin.right)
     .attr("height", height + margin.top + margin.bottom)
   .append("g")
     .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
 
 // X und X axis erstellen:
var x = d3.scaleLinear()
    .range([0,width]);

var xAxis = d3.axisBottom().scale(x)
    .ticks(7);
 
svg.append("g")
   .attr("transform", "translate(0," + height + ")")
   .attr("class","myXaxis")
 
 // Y und Y axis erstellen:
var y = d3.scaleLinear()
    .range([height, 0]);
 
var yAxis = d3.axisLeft().scale(y);

svg.append("g")
   .attr("class","myYaxis")
 
 // Create a UpDate function :
function update(data) {
          
    // data von 2014 bod 2020 in X axis reinfügen und X axis aufrufen:
    x.domain([2014, d3.max(data, function(d) { return d.ser1 }) ]);
    svg.selectAll(".myXaxis").transition()
       .duration(3000)
       .call(xAxis);
 
   // data in Y axis reinfügen und Y axis aufrufen:
    y.domain([0, d3.max(data, function(d) { return d.ser2  }) ]);
    svg.selectAll(".myYaxis")
       .transition()
       .duration(3000)
       .call(yAxis);
 
   // UpDate nach jeder auf Buttom Klicken mit neuen Daten:
   var u = svg.selectAll(".lineTest")
     .data([data], function(d){ return d.ser1 });
 
   // Updata the line durch änderung Y Axis in jeder Art:
   u
     .enter()
     .append("path")
     .attr("class","lineTest")
     .merge(u)
     .transition()
     .duration(3000)
     .attr("d", d3.line()
       .x(function(d) { return x(d.ser1); })
       .y(function(d) { return y(d.ser2); }))
       .attr("fill", "none")
       .attr("stroke", "#000000")
       .attr("stroke-width", 2.5)
 }
 
 // für jede erste aufruf die Seite oder Refrech:
 update(data1)
 