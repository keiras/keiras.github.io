(function() {

const slider = document.getElementById("date-slider");
const playPauseIcon = document.getElementById("date-slider-play");
let isPlaying = false;  // Tracks whether the animation is playing
let interval;  // Will store our interval ID


// Define SVG canvas dimensions
const margin = { top: 40, right: 30, bottom: 40, left: 30 };
const totalWidth = 870;
const totalHeight = 400;
const chartHeight = totalHeight - margin.top - margin.bottom;

// Append SVG to the body and adjust for margins
const svg = d3.select("#viz-daily-matches-mmr")
              .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
              // .attr("width", width + margin.left + margin.right)
              .attr("width", "100%")  // Responsive SVG width
              .attr("height", totalHeight)
              .append("g")
              // .attr("transform", `translate(${margin.left}, ${margin.top})`);


const histogramWidth = totalWidth * 0.8;
const barChartWidth = totalWidth * 0.1;

const chart1 = svg.append("g")
    .attr("transform", `translate(0, ${margin.top})`);
const chart2 = svg.append("g")
    .attr("transform", `translate(${histogramWidth}, ${margin.top})`);
const chart3 = svg.append("g")
    .attr("transform", `translate(${histogramWidth + barChartWidth}, ${margin.top})`);

const qualityMmrRanges = ["<50", "<100", "<200", "<400", "+"];
const qualityPingRanges = ["<25", "<50", "<75", "<100", "+"];

const colorAsSuggestedMyAllmightyGpt4 = "#D64523"; //Fiery Red-Orange
const colorBase = colorAsSuggestedMyAllmightyGpt4;
// const colorPallette = ['#F9CBBE', '#F2865E', '#D64523', '#A63D1F', '#752B16'];
const colorPallette = ['#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d53e4f'];
const mutedNeutralColor = "#aaa";


// Load data
Promise.all([
    d3.csv('resources/data/sg-2024/daily_matches_mmr10.csv'),
    d3.csv('resources/data/sg-2024/daily_mmr_quantiles.csv'),
    d3.csv('resources/data/sg-2024/daily_quality_mmr.csv'),
    d3.csv('resources/data/sg-2024/daily_quality_ping.csv')
]).then(([matches, mmrQuantiles, qualityMmr, qualityPing]) => {
    const uniqueDateStrings = new Set(matches.map(d => d.refdate));
    const dates = Array.from(uniqueDateStrings).map(dateString => new Date(dateString)).sort((a, b) => a - b);
    DataStore.dates = dates;
    DataStore.mmrBinsCount = new Set(matches.map(d => d.bin10)).size;

    DataStore.matchesByMMR = matches.map(d => ({
        refdate: new Date(d.refdate),
        bin10: +d.bin10,
        c: +d.c
    }));

    DataStore.mmrQuantiles = mmrQuantiles.map(d => ({
        refdate: new Date(d.refdate),
        q25: +d.q25,
        q50: +d.q50,
        q75: +d.q75,
        q90: +d.q90,
        q95: +d.q95,
    }));

    DataStore.qualityMmr = qualityMmr.map(d => ({
        refdate: new Date(d.refdate),
        q1: +d["1"],
        q2: +d["2"],
        q3: +d["3"],
        q4: +d["4"],
        q5: +d["5"],
    }));

    DataStore.qualityPing = qualityPing.map(d => ({
        refdate: new Date(d.refdate),
        q1: +d["1"],
        q2: +d["2"],
        q3: +d["3"],
        q4: +d["4"],
        q5: +d["5"],
    }));

    // updateDateSlicer(d3.extent(DataStore.dates));
    updateChart(0);
    updateQualityMmrChart(0);
    updateQualityPingChart(0);
});


// deal with date slicer
const sliderX= 40;
const sliderLength = 100;
const gSlider = svg.append('g')

// Slider Track
const sliderTrack = gSlider.append('rect')
    .attr('class', 'slider-track')
    .attr('x', sliderX)
    .attr('y', 42-2)
    .attr('width', sliderLength)
    .attr('height', 5)
    .attr('fill', 'lightgrey');

// Slider Handle
const handle = gSlider.append('circle')
    .attr('class', 'slider-handle')
    .attr('cx', sliderX)
    .attr('cy', 42)
    .attr('r', 5)
    .attr('fill', 'black')
    .style('cursor', 'pointer');

const backButton = svg.append("text")
    .attr("x", sliderX - 10)
    .attr("y", 42)
    .attr("dominant-baseline", "middle")
    .attr("text-anchor", "end")
    .text("←");

// Calculate text width and add background
const textSize1 = backButton.node().getBBox();
svg.append("rect")
    .attr("x", textSize1.x - 5)
    .attr("y", textSize1.y - 5)
    .attr("width", textSize1.width + 10)
    .attr("height", textSize1.height + 10)
    .attr("fill", "white")
    .attr("fill-opacity", 0)
    .style("cursor", "pointer")
    .on("click", function() {
        moveByStep(-1);
    });

const frontButton = svg.append("text")
    .attr("x", sliderX + sliderLength + 10)
    .attr("y", 42)
    .attr("dominant-baseline", "middle")
    .attr("text-anchor", "start")
    .text("→");

// Calculate text width and add background
const textSize2 = frontButton.node().getBBox();
svg.append("rect")
    .attr("x", textSize2.x - 5)
    .attr("y", textSize2.y - 5)
    .attr("width", textSize2.width + 10)
    .attr("height", textSize2.height + 10)
    .attr("fill", "white")
    .attr("fill-opacity", 0)
    .style("cursor", "pointer")
    .on("click", function() {
        moveByStep(1 );
    });

const playButton = svg.append("text")
    .attr("x", sliderX + sliderLength + 30)
    .attr("y", 42)
    .attr("dominant-baseline", "middle")
    .attr("text-anchor", "start")
    .text("▶");

// Calculate text width and add background
const textSize3 = playButton.node().getBBox();
svg.append("rect")
    .attr("x", textSize3.x - 5)
    .attr("y", textSize3.y - 5)
    .attr("width", textSize3.width + 10)
    .attr("height", textSize3.height + 10)
    .attr("fill", "white")
    .attr("fill-opacity", 0)
    .style("cursor", "pointer")
    .on("click", function() {
        toggleAnimation();
    });

// Add drag behavior
handle.call(d3.drag()
    .on("drag", function(event) {
        moveHandleAndUpdate(event.x);
    }));

function moveByStep(x) {
    change = x * sliderLength/(DataStore.dates.length - 1)
    moveHandleAndUpdate(+handle.attr('cx') + change);
}

// Function to move handle and update visualization
function moveHandleAndUpdate(xPosition) {
    const x = Math.max(sliderX, Math.min(sliderX + sliderLength, xPosition));
    handle.attr('cx', x);
    const sliderValue = Math.round((x - sliderX) / sliderLength * (DataStore.dates.length - 1));
    updateAllNewSlider(sliderValue);
}





// Create x and y scales
const x = d3.scaleLinear().range([0, histogramWidth]);
const y = d3.scaleLinear().range([chartHeight, 0]);

// Add the x-axis and y-axis to the SVG
chart1.append("g")
   .attr("transform", `translate(0, ${chartHeight})`)
   .attr("class", "x-axis");

chart1.append("g")
   .attr("class", "y-axis");




chart2.append("g")
   .attr("class", "y-axis")
   .attr("transform", `translate(${margin.left}, 0)`);

chart2.append("text")
    .attr("x", (barChartWidth + margin.left) / 2)
    .attr("y", chartHeight + 20)
    .text("MMR diff")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("fill", "black");

chart2.append("line")
    .attr("x1", margin.left)
    .attr("x2", barChartWidth)
    .attr("y1", chartHeight)
    .attr("y2", chartHeight)
    .attr("stroke", "black")
    .attr("stroke-width", 1);




chart3.append("g")
   .attr("class", "y-axis")
   .attr("transform", `translate(${barChartWidth}, 0)`);


chart3.append("text")
    .attr("x", (barChartWidth + margin.left) / 2)
    .attr("y", chartHeight + 20)
    .text("ping diff")
    .attr("font-size", "12px")
    .attr("text-anchor", "middle")
    .attr("fill", "black");

chart3.append("line")
    .attr("x1", margin.left)
    .attr("x2", barChartWidth)
    .attr("y1", chartHeight)
    .attr("y2", chartHeight)
    .attr("stroke", "black")
    .attr("stroke-width", 1);



svg.append("text")
    .attr("x", 0)
    .attr("y", margin.top - 14)
    .text("Histogram of matches played per MMR (↔25) on the given day")
    .attr("font-size", "14px")
    .attr("text-anchor", "start")
    .attr("fill", "black");

svg.append("text")
    .attr("x", totalWidth)
    .attr("y", margin.top - 14)
    .text("Proportion of matches by quality metric")
    .attr("font-size", "14px")
    .attr("text-anchor", "end")
    .attr("fill", "black");




//
// function updateDateSlicer(extent) {
//     slider.min = 0;
//     slider.max = DataStore.dates.length - 1;
//     slider.value = 0;
//
// }


function updateChart(selectedDateIndex) {
    const refDate = DataStore.dates[selectedDateIndex];
    const filteredData = DataStore.matchesByMMR.filter(d => d.refdate.getTime() === refDate.getTime());
    const barWidth = histogramWidth / DataStore.mmrBinsCount -1 ; // Divide the chart width by the number of bars
    // document.getElementById("date-slider-label").innerText = d3.timeFormat("%Y-%m-%d")(refDate);

    // Update scales
    // x.domain(d3.extent(filteredData, d => d.bin10));
    y.domain([0, d3.max(filteredData, d => d.c)]);
    x.domain(d3.extent(DataStore.matchesByMMR, d => d.bin10));
    // y.domain([0, 1000]);

    // Update axes
    chart1.select(".x-axis").call(d3.axisBottom(x));
    chart1.select(".y-axis").call(d3.axisLeft(y));

    dateText = chart1.selectAll(".date-text")
        .data([d3.timeFormat("%Y-%m-%d (%a)")(refDate)]);
    dateText.enter()
        .append("text")
        .attr("class", "date-text")
        .merge(dateText) // Merges the enter and update selections
        .attr("x", 30)
        .attr("y", 30)
        .text(d => d)
        // .attr("font-family", "sans-serif")
        .attr("font-size", "18px")
        .attr("text-anchor", "start")
        .attr("fill", mutedNeutralColor);
    dateText.exit().remove();


    steamFestText = chart1.selectAll(".steam-fest-text")
        .data(refDate >= new Date("2024-02-05") && refDate <= new Date("2024-02-12") ? ["Steam Next Fest"] : []);
    steamFestText.enter()
        .append("text")
        .attr("class", "steam-fest-text")
        .merge(steamFestText) // Merges the enter and update selections
        .attr("x", 30)
        .attr("y", 50)
        .text(d => d)
        // .attr("font-family", "sans-serif")
        .attr("font-size", "18px")
        .attr("text-anchor", "start")
        .attr("fill", mutedNeutralColor);
    steamFestText.exit().remove();


    // Bind filtered data to the bars
    const bars = chart1.selectAll(".bar")
                    .data(filteredData, d => d.bin10);
    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.bin10))
        .attr("y", d => y(d.c))
        .attr("width", barWidth)
        .attr("height", d => chartHeight - y(d.c))
        .attr("fill", colorBase)
        .merge(bars)
        .transition()
        .duration(250)
        .attr("y", d => y(d.c))
        .attr("height", d => chartHeight - y(d.c));
    bars.exit().remove();


    const quantileData = DataStore.mmrQuantiles.filter(d => d.refdate.getTime() === refDate.getTime())[0];
    const quantileKeys = ['q25', 'q50', 'q75', 'q90', 'q95'];

    // Clear previous markings
    chart1.selectAll(".quantile-mark, .quantile-text").remove();

    quantileKeys.forEach(key => {
        const quantileValue = quantileData[key];

        // Draw median line (short vertical line for Q50)
        chart1.append("line")
            .attr("class", "quantile-mark")
            .attr("x1", x(quantileValue))
            .attr("x2", x(quantileValue))
            .attr("y1", y.range()[0] + 20)  // Short line, adjust y1 and y2 as needed
            .attr("y2", y.range()[0] + 30)
            .attr("stroke", colorBase)
            .attr("stroke-width", 2);

        // Add text label for Q50
        chart1.append("text")
            .attr("class", "quantile-text")
            .attr("x", x(quantileValue) + 3)  // Position the text right next to the line
            .attr("y", y.range()[0] + 30)   // Position it above the line
            .text(key)
            .attr("fill", "black")
            .style("font-size", "12px")
            .style("font-family", "Arial, sans-serif");
    });

}


function updateQualityMmrChart(selectedDateIndex) {
    const refDate = DataStore.dates[selectedDateIndex];
    const qualityMmrData = DataStore.qualityMmr.filter(d => d.refdate.getTime() === refDate.getTime())[0];

    // Transform data for stacking
    const qualities = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const total = qualityMmrData.q1 + qualityMmrData.q2 + qualityMmrData.q3 + qualityMmrData.q4 + qualityMmrData.q5;
    const transformedData = [{
        q1: qualityMmrData.q1 / total,
        q2: qualityMmrData.q2 / total,
        q3: qualityMmrData.q3 / total,
        q4: qualityMmrData.q4 / total,
        q5: qualityMmrData.q5 / total,
        cumulative: [qualityMmrData.q1 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total + qualityMmrData.q3 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total + qualityMmrData.q3 / total + qualityMmrData.q4 / total,
            ]
    }];

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([ chartHeight, 0 ]);
    const yAxis = d3.axisLeft(y)
        .tickValues(transformedData[0].cumulative)
        .tickFormat(d3.format(".0%"));  // Formats the number as a percentage with no decimal places
    chart2.select(".y-axis")
      .call(yAxis);
    chart2.select('.y-axis .domain').attr('stroke', 'none');

    const color = d3.scaleOrdinal()
        .domain(qualities)
        .range(colorPallette);

    const stackedData = d3.stack()
        .keys(qualities)(transformedData);

    // Show the bars
    // Update the groups
    const groups = chart2.selectAll("g.layer")
        .data(stackedData);
    const groupsEnter = groups.enter().append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key));
    groups.exit().remove();

    const rects = groups.merge(groupsEnter).selectAll("rect")
            .data(d => d.map(v => ({...v, index: d.index})));
    rects.enter().append("rect")
        .merge(rects)
        .attr("x", margin.left)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", barChartWidth - margin.right);
    rects.exit().remove();


    // Update the text within each group
    const texts = groups.merge(groupsEnter).selectAll("text")
        .data(d => d.map(v => ({...v, index: d.index})));
    texts.enter().append("text")
        .attr("class", "bar-text")
        .merge(texts)  // ENTER + UPDATE
        .attr("x", (barChartWidth + margin.left) / 2)
        .attr("y", d => y(d[1]) + (y(d[0]) - y(d[1])) / 2 + 6)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .text(d => (y(d[0]) - y(d[1]) > 15 ? `${qualityMmrRanges[d.index]} mmr` : ''));
    texts.exit().remove();
}



function updateQualityPingChart(selectedDateIndex) {
    const refDate = DataStore.dates[selectedDateIndex];
    const qualityMmrData = DataStore.qualityPing.filter(d => d.refdate.getTime() === refDate.getTime())[0];

    // Transform data for stacking
    const qualities = ['q1', 'q2', 'q3', 'q4', 'q5'];
    const total = qualityMmrData.q1 + qualityMmrData.q2 + qualityMmrData.q3 + qualityMmrData.q4 + qualityMmrData.q5;
    const transformedData = [{
        q1: qualityMmrData.q1 / total,
        q2: qualityMmrData.q2 / total,
        q3: qualityMmrData.q3 / total,
        q4: qualityMmrData.q4 / total,
        q5: qualityMmrData.q5 / total,
        cumulative: [qualityMmrData.q1 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total + qualityMmrData.q3 / total,
            qualityMmrData.q1 / total + qualityMmrData.q2 / total + qualityMmrData.q3 / total + qualityMmrData.q4 / total,
            ]
    }];

    // Add Y axis
    const y = d3.scaleLinear()
        .domain([0, 1])
        .range([ chartHeight, 0 ]);
    const yAxis = d3.axisRight(y)
        .tickValues(transformedData[0].cumulative)
        .tickFormat(d3.format(".0%"));  // Formats the number as a percentage with no decimal places
    chart3.select(".y-axis")
      .call(yAxis);
    chart3.select('.y-axis .domain').attr('stroke', 'none');  // '.domain' is the class typically used for the axis line


    const color = d3.scaleOrdinal()
        .domain(qualities)
        .range(colorPallette);

    const stackedData = d3.stack()
        .keys(qualities)(transformedData);

    // Show the bars
    // Update the groups
    const groups = chart3.selectAll("g.layer")
        .data(stackedData);
    const groupsEnter = groups.enter().append("g")
        .attr("class", "layer")
        .attr("fill", d => color(d.key));
    groups.exit().remove();

    const rects = groups.merge(groupsEnter).selectAll("rect")
            .data(d => d.map(v => ({...v, index: d.index})));
    rects.enter().append("rect")
        .merge(rects)
        .attr("x", margin.left)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", barChartWidth - margin.left);
    rects.exit().remove();


    // Update the text within each group
    const texts = groups.merge(groupsEnter).selectAll("text")
        .data(d => d.map(v => ({...v, index: d.index})));
    texts.enter().append("text")
        .attr("class", "bar-text")
        .merge(texts)  // ENTER + UPDATE
        .attr("x", (barChartWidth + margin.left) / 2)
        .attr("y", d => y(d[1]) + (y(d[0]) - y(d[1])) / 2 + 6)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .style("font-size", "12px")
        .style("font-family", "Arial, sans-serif")
        .text(d => (y(d[0]) - y(d[1]) > 15 ? `${qualityPingRanges[d.index]} ms` : ''));  // Only show text for bars taller than 15 pixels
    texts.exit().remove();
}



// slider.addEventListener("input", function(e) {
//         updateAll();
// });


// function updateAll(){
//     updateChart(slider.value);
//     updateQualityMmrChart(slider.value);
//     updateQualityPingChart(slider.value);
// }

function updateAll(){
    const sliderValue = Math.round((+handle.attr('cx') - sliderX) / sliderLength * (DataStore.dates.length - 1));
    updateAllNewSlider(sliderValue);
}

function updateAllNewSlider(sliderValue){

    updateChart(sliderValue);
    updateQualityMmrChart(sliderValue);
    updateQualityPingChart(sliderValue);
}

function sliderAtEnd(){
    return +handle.attr('cx') === sliderX + sliderLength;
}

// Function to handle the animation
function toggleAnimation() {
    if (!isPlaying) {
        if (sliderAtEnd()) {
            handle.attr('cx', sliderX);  // Reset the slider if we're at the end
            updateAll();
        }
        isPlaying = true;
        playButton.text('◼');  // Change icon to pause
        interval = setInterval(() => {
            if (! sliderAtEnd()) {
                moveByStep(1);  // Increment the slider value
                updateAll();
            } else {
                clearInterval(interval);  // Stop the interval if we reach the end
                // slider.value = slider.min;  // Optionally reset to start
                playButton.text('▶');  // Reset play button icon
                isPlaying = false;
            }
        }, 500);
    } else {
        // Pause the animation
        clearInterval(interval);
        isPlaying = false;
        playButton.text('️▶');  // Change icon to play
    }
}


})();
