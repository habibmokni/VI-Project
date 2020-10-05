const svg = d3
  .select(".canvas")
  .append("svg")
  .attr("width", 600)
  .attr("height", 600);

// create margins and dimensions
const margin = { top: 20, right: 20, bottom: 100, left: 100 };
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const graph = svg
  .append("g")
  .attr("width", graphWidth)
  .attr("height", graphHeight)
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xAxisGroup = graph
  .append("g")
  .attr("transform", `translate(0, ${graphHeight})`);
const yAxisGroup = graph.append("g");

d3.json("./data/electrocars.json").then((data) => {
  const min = d3.min(data, (d) => d.totalEcars);
  const max = d3.max(data, (d) => d.totalEcars);
  const extent = d3.extent(data, (d) => d.totalEcars);
  //console.log(min, max, extent);

  const y = d3.scaleLinear().domain([0, max]).range([graphHeight, 0]);
  const x = d3
    .scaleBand()
    .domain(data.map((item) => item.year))
    .range([0, 500])
    .paddingInner(0.2)
    .paddingOuter(0.2);

  //console.log(data.map((item) => item.year));
  //   console.log(x("2015"));
  //   console.log(x("2016"));
  //   console.log(x.bandwidth());

  //join the data to rects
  const rects = graph.selectAll("rect").data(data);

  rects
    .attr("width", x.bandwidth)
    .attr("height", (d) => graphHeight - y(d.totalEcars))
    .attr("fill", "#9BC234")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d.totalEcars));

  //append the enter selection to the DOM
  rects
    .enter()
    .append("rect")
    .attr("width", x.bandwidth)
    .attr("height", (d) => graphHeight - y(d.totalEcars))
    .attr("fill", "#9BC234")
    .attr("x", (d) => x(d.year))
    .attr("y", (d) => y(d.totalEcars))
    .on("mouseenter", function () {
      d3.select(this).attr("fill", "#7c9b29");
    })
    .on("mouseleave", function () {
      d3.select(this).attr("fill", "#9BC234");
    });
  // create and call the axes

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);
  //.tickFormat((d) => d + " T");

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  xAxisGroup.selectAll("text").attr("font-weight", "bold");
  yAxisGroup.selectAll("text").attr("font-weight", "bold");
});
