(function() {

const colorBase = "#ccc";


const margin = { top: 25, right: 30, bottom: 35, left: 20 };
const width = 485 - margin.left - margin.right;
const height = 175 - margin.top - margin.bottom;

const svgDailyActivity = d3.select("#viz-daily-active-topace")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


Promise.all([
  d3.csv('resources/data/ba-202407/active_top_ace.csv'),
  d3.csv('resources/data/ba-202407/all_top_ace.csv'),
]).then(([activeTopAce, allTopAce]) => {
    const parseDate = d3.timeParse("%Y-%m-%d"); // Define the date parsing function

    DataStore.activeTopAce = activeTopAce.map(d => ({
        date: parseDate(d.date),
        count: +d.count,
    }));
    DataStore.allTopAce = allTopAce.map(d => ({
        date: parseDate(d.date),
        players: +d.players,
    }));

    drawDayActivityChart();
});


function drawDayActivityChart(){
    const formatDate = d3.timeFormat("%a %d"); // e.g., "Sun 07"

    const data_active = DataStore.activeTopAce;
    const data_all = DataStore.allTopAce;

    const targetSvg = svgDailyActivity.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(data_all, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data_all, d => d.players)])
        .range([height, 0]);

    const line1 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.count));

    const line2 = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.players));

    const area2 = d3.area()
        .x(d => x(d.date))
        .y0(height)
        .y1(d => y(d.players));

    // Calculate custom ticks for y-axis
    const minActive = d3.min(data_active, d => d.count);
    const maxActive = d3.max(data_active, d => d.count);
    const maxAll = d3.max(data_all, d => d.players);

    const yTicks = [minActive, maxActive, maxAll].sort((a, b) => a - b);

    // Add X axis
    targetSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(formatDate));

    // Add Y axis with custom ticks
    targetSvg.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(d3.axisRight(y).tickValues(yTicks));

    // Add area2
    targetSvg.append("path")
        .datum(data_all)
        .attr("fill", colorBase)
        .attr("fill-opacity", 0.5)
        .attr("stroke", "none")
        .attr("d", area2);

    // Add line1
    targetSvg.append("path")
        .datum(data_active)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line1);

    // Tooltip and vertical line elements
    const tooltipText = targetSvg.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("fill", "black")
        // .attr("font-size", "12px")
        .style("visibility", "hidden");

    const verticalLine = targetSvg.append("line")
        .attr("stroke", "grey")
        .attr("stroke-width", 1)
        .attr("y1", 0)
        .attr("y2", height)
        .style("visibility", "hidden");


    // Add overlay for capturing mouse events
    const overlay = targetSvg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "none")
        .attr("pointer-events", "all");


    // Bisector function to find the nearest date
    const bisectDate = d3.bisector(d => d.date).left;

    // Function to handle mousemove event and manual calls
    function showDataPoint(mouseX) {
        const x0 = x.invert(mouseX);
        const i = bisectDate(data_all, x0, 1);
        const d0 = data_all[i - 1];
        const d1 = data_all[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        const activeData = data_active.find(active => +active.date === +d.date);
        const activeCount = activeData ? activeData.count : 0;

        verticalLine
            .attr("x1", x(d.date))
            .attr("x2", x(d.date))
            .style("visibility", "visible");

        tooltipText
            .text(`Top Ace: ${d.players} total, ${activeCount} active (${(activeCount / d.players * 100).toFixed(0)}%)`)
            .style("visibility", "visible");
    }

    // Attach the mousemove event listener to the overlay
    overlay.on("mousemove", function(event) {
        const [mouseX] = d3.pointer(event);
        showDataPoint(mouseX);
    });

    // Manually call showDataPoint after the page loads to display a specific point
    const initialMouseX = x(new Date(2024,6,12)); // Change the index to the desired initial data point
    showDataPoint(initialMouseX);

}


})();