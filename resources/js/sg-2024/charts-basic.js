(function() {

const colorBase = "#ccc";


const margin = { top: 25, right: 30, bottom: 35, left: 30 };
const width = 500 - margin.left - margin.right;
const height = 150 - margin.top - margin.bottom;

const widthHor = 300 - margin.left - margin.right;
const heightHor = 300 - margin.top - margin.bottom;

// // Create SVG container
// const svg = d3.select("#viz-faction-preference")
//     .attr("width", width + margin.left + margin.right)
//     .attr("height", height + margin.top + margin.bottom)
//   .append("g")
//     .attr("transform", `translate(${margin.left},${margin.top})`);

const svgConvergence = d3.select("#viz-games-before-mmr-convergence")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
const svgDaysActive = d3.select("#viz-active-days-histo")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
const svgDegree = d3.select("#viz-degree-separation")
    .attr("width", widthHor + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);
const svgServers = d3.select("#viz-servers-histo")
    .attr("width", widthHor + margin.left + margin.right)
    .attr("height", heightHor + margin.top + margin.bottom);



Promise.all([
  d3.csv('resources/data/sg-2024/pop_days_active.csv'),
  d3.csv('resources/data/sg-2024/pop_games_before_mmr_convergence.csv'),
  d3.csv('resources/data/sg-2024/top100_pair_degrees.csv'),
  d3.csv('resources/data/sg-2024/top100_servers_visited_agg.csv')
]).then(([popDaysActive, gamesBeforeMmrConvergence, top100Degree, top100Servers]) => {
    DataStore.popDaysActive = popDaysActive.map(d => ({
        days: +d.days,
        c: +d.c,
    }));
    DataStore.gamesBeforeMmrConvergence = gamesBeforeMmrConvergence.map(d => ({
        matches: +d.FirstMatchBelowThreshold,
        c: +d.c,
    }));
    DataStore.top100Degree = top100Degree.map(d => ({
        degree: +d.degree,
        c: +d.pairs,
    }));
    DataStore.top100Servers = top100Servers.map(d => ({
        servers: +d.servers,
        c: +d.c,
    }));

    drawConvergenceChart();
    // drawDaysActiveChart();
    drawTop100DegreeChart();
    drawTop100ServersChart();
});



function drawConvergenceChart(){
    const data = DataStore.gamesBeforeMmrConvergence.filter(d => d.matches > 0);

    const notConvergedCount = DataStore.gamesBeforeMmrConvergence.filter(d => d.matches === 0)[0].c;
    const convergedCount = d3.sum(data, d => d.c);

    const g = svgConvergence.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // const x = d3.scaleLinear().range([0, d3.max(data, d => d.matches)]);
    // const y = d3.scaleLinear().range([0, d3.max(data, d => d.c)]);

    const x = d3.scaleLinear().range([0, width]).domain([20, 70]);
    const y = d3.scaleLinear().range([height, 0]).domain([0, d3.max(data, d => d.c)]);


    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.matches)-3)
        .attr("y", d => y(d.c))
        .attr("width", 6)
        .attr("height", d => height - y(d.c))
        .attr("fill", "steelblue")
        // .attr("stroke", "black")
    ;

    g.append("text")
        .attr("x", width)
        .attr("y", 0)
        .attr("text-anchor", "end")
        .attr("font-size", "12px")
        .append('svg:tspan')
        .attr('x', width)
        .attr('dy', 5)
        .text(`${d3.format(".3s")(notConvergedCount)} (${Math.round(notConvergedCount / (notConvergedCount + convergedCount) * 100)}%)`)
        .append('svg:tspan')
        .attr('x', width)
        .attr('dy', 15)
        .text("not converged");


    // X-axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y-axis
    g.append("g")
        .call(d3.axisLeft(y).ticks(5));

    g.append("text")
    .attr("x", width/2)
    .attr("y", height + 30)
    .text("games needed for MMR convergence")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("fill", "black");

}


function drawDaysActiveChart(){
    const data = DataStore.popDaysActive;

    const g = svgDaysActive.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().range([0, width]).domain([0, d3.max(data, d => d.days)]);
    const y = d3.scaleLog().range([height, 0]).domain([1, d3.max(data, d => d.c)]);

    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.days)-3)
        .attr("y", d => y(d.c))
        .attr("width", 6)
        .attr("height", d => height - y(d.c))
        .attr("fill", "steelblue")
        // .attr("stroke", "black")
    ;

    // X-axis
    g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Y-axis
    g.append("g")
        .call(d3.axisLeft(y));
}


function drawTop100DegreeChart(){
    const data = DataStore.top100Degree;

    const g = svgDegree.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define the scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.c)])  // Max value for the bars
        .range([0, widthHor]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.degree))  // All the degree labels
        .range([0, height])
        .padding(0.35);  // Padding between bands

    // Draw the bars
    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.degree))
        .attr("height", y.bandwidth())
        .attr("x", 0)  // Bars start at x=0
        .attr("width", d => x(d.c))
        .attr("fill", colorBase);

    g.selectAll(".label")
        .data(data)
        .enter().append("text")
        .attr("class", "label")
        .attr("y", d => y(d.degree) + y.bandwidth() / 2)  // Center the text in the bar
        .attr("x", d => x(d.c) + 3)  // Slightly offset to the right of the bar
        .attr("dy", ".35em")  // Vertical alignment
        .attr("font-size", "12px")
        .text(d => d.c);

    // Y-axis
    g.append("g")
        .call(d3.axisLeft(y));

    g.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .text("Number of pairs by degree of separation")
        .attr("font-size", "14px")
        .attr("text-anchor", "start")
        .attr("fill", "black");

}


function drawTop100ServersChart(){
    const data = DataStore.top100Servers;

    const g = svgServers.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define the scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.c)])  // Max value for the bars
        .range([0, widthHor]);

    const y = d3.scaleBand()
        .domain(data.map(d => d.servers))  // All the degree labels
        .range([0, heightHor])
        .padding(0.35);  // Padding between bands

    // Draw the bars
    g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("y", d => y(d.servers))
        .attr("height", y.bandwidth())
        .attr("x", 0)  // Bars start at x=0
        .attr("width", d => x(d.c))
        .attr("fill", colorBase);

    // g.selectAll(".label")
    //     .data(data)
    //     .enter().append("text")
    //     .attr("class", "label")
    //     .attr("y", d => y(d.servers) + y.bandwidth() / 2)  // Center the text in the bar
    //     .attr("x", d => x(d.c) + 3)  // Slightly offset to the right of the bar
    //     .attr("dy", ".35em")  // Vertical alignment
    //     .text(d => d.c);


    // Y-axis
    g.append("g")
        .call(d3.axisLeft(y));
    g.append("g")
        .attr('transform', `translate(0, ${heightHor})`)  // Move the group to the bottom of the chart
        .call(d3.axisBottom(x));

    g.append("text")
        .attr("x", 0)
        .attr("y", -10)
        .text("Players by number of servers played on")
        .attr("font-size", "14px")
        .attr("text-anchor", "start")
        .attr("fill", "black");

}


})();