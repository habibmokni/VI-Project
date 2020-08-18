"use strict";
(function () {
  const geojsonUrl = "./data/germany.geo.json";
  const dataUrl = "./data/Fahrzeugbestand 2015-2020.csv";
  Promise.all([d3.json(geojsonUrl), d3.csv(dataUrl)]).then(
    ([germany, data]) => {
      const formatValue = d3
        .formatLocale({
          decimal: ",",
          thousands: ".",
          grouping: [3],
          currency: ["", "\u00a0€"],
        })
        .format(",d");
      // Process data
      const detailsColumns = data.columns.slice(2);
      const accessor = {
        state: (d) => d[data.columns[0]].trim(),
        year: (d) => d[data.columns[1]],
        value: (d) => +d[data.columns[data.columns.length - 1]],
        detail: (d, column) => +d[column],
      };
      const dataByYearByState = d3.rollup(
        data,
        (v) => v[0],
        accessor.year,
        accessor.state
      );
      dataByYearByState.detailsColumns = detailsColumns;
      dataByYearByState.accessor = accessor;
      dataByYearByState.formatValue = formatValue;

      // Render
      const dispatch = d3.dispatch("yearchange", "statechange");
      const years = [...dataByYearByState.keys()];
      renderYearSelect({
        el: document.querySelector("#GeoMapYearSelect"),
        years,
        dispatch,
      });
      const color = d3
        .scaleQuantize()
        .domain([0, 12e6])
        .range(["#fef0d9", "#fdcc8a", "#fc8d59", "#d7301f"]);
      const textColor = color
        .copy()
        .range(["#212529", "#212529", "#ffffff", "#ffffff"]);
      renderGeoMap({
        el: document.querySelector("#GeoMap .panel-main"),
        data: dataByYearByState,
        geojson: germany,
        color,
        textColor,
        dispatch,
      });
      renderLegend({
        el: document.querySelector("#GeoMap .panel-main"),
        title: "Insgesamt",
        color: color,
      });
      renderSideDetails({
        el: document.querySelector("#GeoMap .panel-side"),
        data: dataByYearByState,
        dispatch,
      });
      // Initialize with the latest year's data
      dispatch.call("yearchange", null, years[years.length - 1]);
    }
  );

  function renderYearSelect({ el, years, dispatch }) {
    const select = d3.select(el);
    select.on("change", function () {
      dispatch.call("yearchange", null, this.value);
    });
    select
      .selectAll("option")
      .data(years)
      .join("option")
      .attr("value", (d) => d)
      .text((d) => d);
    dispatch.on("yearchange.select", (year) => {
      select.property("value", year);
    });
  }

  function renderGeoMap({ el, data, geojson, color, textColor, dispatch }) {
    let selectedYear;

    const projection = d3.geoMercator();
    const geoPath = d3.geoPath(projection);
    // Determine the height/width ratio of the map
    const [[x1, y1], [x2, y2]] = geoPath.bounds(geojson);
    const ratio = (y2 - y1) / (x2 - x1);

    const container = d3.select(el).append("div").attr("class", "geo-map");
    const svg = container.append("svg");
    const gPaths = svg.append("g");
    const gNames = svg.append("g");

    const tooltip = container.append("div").attr("class", "chart-tooltip");
    hideTooltip();

    resize();
    d3.select(window).on("resize.geomap", resize);

    function resize() {
      const width = svg.node().clientWidth;
      const mapWidth = Math.min(width, 400); // Give the map a maximum width so it doesn't become too large
      const height = mapWidth * ratio;
      svg.attr("viewBox", [0, 0, width, height]);
      projection.fitExtent(
        [
          [0, 0],
          [width, height],
        ],
        geojson
      );
      render();
    }

    function render() {
      if (!selectedYear) return;
      const path = gPaths
        .selectAll(".state-path")
        .data(geojson.features)
        .join("path")
        .attr("class", "state-path")
        .attr("d", geoPath)
        .attr("fill", (d) => color(getStateValue(d)))
        .on("mouseenter", (d) => {
          showTooltip(d);
          name.filter((e) => e === d).attr("font-weight", "bold");
        })
        .on("mouseleave", (d) => {
          hideTooltip();
          name.filter((e) => e === d).attr("font-weight", "normal");
        })
        .on("click", (d) => {
          dispatch.call("statechange", null, d.properties.name);
        });
      const name = gNames
        .selectAll(".state-name")
        .data(geojson.features)
        .join("text")
        .attr("class", "state-name")
        .attr("transform", (d) => {
          const [x, y] = geoPath.centroid(d);
          return `translate(${x},${y + offsetY(d.properties.name)})`;
        })
        .attr("fill", (d) => textColor(getStateValue(d)));
      name
        .selectAll("tspan")
        .data((d) => splitStateName(d.properties.name))
        .join("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => `${i * 1.1}em`)
        .text((d) => d);
    }

    function showTooltip(d) {
      const value = getStateValue(d);
      tooltip.html(`
          <div class="name">${d.properties.name}</div>
          <div class="value">${data.formatValue(value)}</div>
          <div>Click to show details</div>
        `);
      const { height, width } = tooltip.node().getBoundingClientRect();
      const [x, y] = geoPath.centroid(d);
      const translateX = x - width / 2;
      const translateY = y + offsetY(d.properties.name) - height - 15;
      tooltip.style("transform", `translate(${translateX}px,${translateY}px)`);
      tooltip.transition().style("opacity", 1);
    }

    function hideTooltip() {
      tooltip.transition().style("opacity", 0);
    }

    function getStateValue(d) {
      const e = data.get(selectedYear).get(d.properties.name);
      const value = data.accessor.value(e);
      return value;
    }

    function splitStateName(name) {
      const dashIndex = name.indexOf("-");
      if (dashIndex !== -1) {
        return [name.slice(0, dashIndex + 1), name.slice(dashIndex + 1)];
      } else {
        return [name];
      }
    }

    function offsetY(name) {
      switch (name) {
        case "Brandenburg":
          return 20;
        default:
          return 0;
      }
    }

    dispatch.on("yearchange.geo-map", (year) => {
      if (selectedYear === year) return;
      selectedYear = year;
      render();
    });
  }

  // Adapted from https://observablehq.com/@d3/color-legend
  function renderLegend({ el, title, color }) {
    const tickSize = 6,
      width = 320,
      height = 44 + tickSize,
      marginTop = 18,
      marginRight = 0,
      marginBottom = 16 + tickSize,
      marginLeft = 0,
      ticks = width / 64;

    const thresholds = [0].concat(
      color
        .range()
        .map((d) => color.invertExtent(d))
        .map((d) => d[1])
    );
    const tickValues = d3.range(thresholds.length);
    const thresholdFormat = d3.format("~s");
    const tickFormat = (i) => thresholdFormat(thresholds[i], i);

    const x = d3
      .scaleLinear()
      .domain([0, color.range().length])
      .rangeRound([marginLeft, width - marginRight]);

    let tickAdjust = (g) =>
      g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);

    const container = d3
      .select(el)
      .append("div")
      .attr("class", "geo-map-legend");

    const svg = container
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .style("overflow", "visible");

    svg
      .append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i + 1) - x(i))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", (d) => d);

    svg
      .append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(ticks)
          .tickFormat(tickFormat)
          .tickSize(tickSize)
          .tickValues(tickValues)
      )
      .call(tickAdjust)
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", marginLeft)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(title)
      );
  }

  function renderSideDetails({ el, data, dispatch }) {
    let selectedState, selectedYear;
    const container = d3
      .select(el)
      .append("div")
      .attr("class", "geo-map-details");
    const name = container.append("p").attr("class", "name");
    const details = container.append("ul").attr("class", "details");

    function render() {
      if (!selectedYear || !selectedState) return;
      name.text(selectedState);
      details
        .selectAll(".detail")
        .data(data.detailsColumns)
        .join((enter) =>
          enter
            .append("li")
            .attr("class", "detail")
            .call((li) =>
              li
                .append("dt")
                .attr("class", "property")
                .text((col) => col)
            )
            .call((li) => li.append("dd").attr("class", "value"))
        )
        .select(".value")
        .text((col) =>
          data.formatValue(
            data.accessor.detail(data.get(selectedYear).get(selectedState), col)
          )
        );
    }

    dispatch.on("yearchange.geo-map-details", (year) => {
      if (selectedYear === year) return;
      selectedYear = year;
      render();
    });
    dispatch.on("statechange.geo-map-details", (state) => {
      if (selectedState === state) return;
      selectedState = state;
      render();
    });
  }
})();
