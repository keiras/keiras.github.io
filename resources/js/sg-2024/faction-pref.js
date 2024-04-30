(function() {

const margin = { top: 30, right: 100, bottom: 30, left: 0 };
const width = 500 - margin.left - margin.right;
const height = 150 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#viz-faction-preference")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const xScale = d3.scaleLinear()
  .range([0, width])
  .domain([0, 1]);


// const colorPallette = ['#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d53e4f'];
// const colorPallette = ['#4682B4', '#4682B4', '#e0e0e0', '#f46d43', '#d53e4f'];
//     const colorPallette = ['#3288bd', '#abdda4', '#ffffbf', '#d53e4f', '#d53e4f'];
const colorPallette = ['#4682B4', '#b4cde2', '#e0e0e0', '#f0b3a5', '#D64523'];
const color = d3.scaleOrdinal(colorPallette);





Promise.all([
  d3.csv('resources/data/sg-2024/pop_faction_pref_all.csv'),
  d3.csv('resources/data/sg-2024/pop_faction_pref_top100.csv'),
  d3.csv('resources/data/sg-2024/pop_faction_pref_nextfest.csv'),
]).then(([dataAll, dataTop100, dataNextFest]) => {
    let total = d3.sum(dataAll, d => d.c)
    DataStore.factionPrefAll = dataAll.map(d => ({
        group: +d.gr,
        c: +d.c,
        perc: d.c / total
    }));

    total = d3.sum(dataTop100, d => d.c)
    DataStore.factionPrefTop100 = dataTop100.map(d => ({
        group: +d.gr,
        c: +d.c,
        perc: d.c / total
    }));

    total = d3.sum(dataNextFest, d => d.c)
    DataStore.factionPrefNextFest = dataNextFest.map(d => ({
        group: +d.gr,
        c: +d.c,
        perc: d.c / total
    }));


    const stackData = [
        transformToStackData(DataStore.factionPrefTop100),
        transformToStackData(DataStore.factionPrefNextFest),
        transformToStackData(DataStore.factionPrefAll),
    ];

    const keys = ["q1", "q2", "q3", "q4", "q5"];
    const stack = d3.stack().keys(keys);
    const seriesAll = stack(stackData.map(data => data));


    drawCharts(seriesAll);
});


function transformToStackData(data) {
    return {
        q1: data.find(d => d.group === 0).perc,
        q2: data.find(d => d.group === 0.2).perc,
        q3: data.find(d => d.group === 0.4).perc,
        q4: data.find(d => d.group === 0.6).perc,
        q5: data.find(d => d.group === 0.8).perc,
    };
}


function drawCharts(series){
    const legendHeight = 15;  // Height of the legend bar
    const legendYOffset = -20; // Offset to position the legend above the main charts
    const legendLabels = ["VG mostly", "VG pref", "both", "pref Inf", "mostly Inf"];
    const barLabels = ["Top 100", "NextFest players", "All players"];

    const legend = svg.append("g")
        .attr("transform", `translate(0, ${legendYOffset})`);

    legend.selectAll("rect")
        .data(legendLabels)
        .enter().append("rect")
        .attr("x", (d, i) => i * (width * 0.20))
        .attr("y", 0)
        .attr("width", width * 0.20)
        .attr("height", legendHeight)
        .attr("fill", (d, i) => color(i));

    // Add text labels above each rectangle
    legend.selectAll("text")
        .data(legendLabels)
        .enter().append("text")
        .attr("x", (d, i) => i * (width * 0.20) + (width * 0.10)) // Centered on each segment
        .attr("y", 10) // Position above the rectangles
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text(d => d);

    const yScale = d3.scaleBand()
        .domain(d3.range(series[0].length)) // Assuming each layer has the same number of segments
        .range([0, height])
        .padding(0.2);

    svg.selectAll(".layer")
        .data(series)
        .enter().append("g")
        .attr("class", "layer")
        .attr("fill", (d, i) => color(i))
        .selectAll("rect")
        .data(d => d)
        .enter().append("rect")
        .attr("x", d => xScale(d[0]))
        .attr("width", d => xScale(d[1]) - xScale(d[0]))
        .attr("y", (d, i) => yScale(i))
        .attr("height", yScale.bandwidth());

    svg.selectAll(".barLabel")
        .data(barLabels)
        .enter().append("text")
        .attr("class", "barLabel")
        .attr("x", width + 5) // Offset by 5 pixels from the end of the bar
        .attr("y", (d, i) => yScale(i) + yScale.bandwidth() / 2) // Vertically center
        .attr("dy", ".35em") // Additional fine-tuning
        .text(d => d) // Use the labels array
        .style("font-size", "12px")
        .attr("text-anchor", "start"); // Align text to start at the x-position
}

})();