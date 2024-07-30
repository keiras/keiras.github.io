(function() {

const techTierUnits = {
    core: [
        'beetle', 'blink', 'blinkhunter', 'crab', 'gunbot', 'hornet', 'hunter', 'missilebot', 'recall', 'recallhunter', 'scorpion', 'wasp'
    ],
    foundry: [
        'ballista', 'bomber', 'crusader', 'destroyer', 'heavyhunter', 'kingcrab', 'mortar', 'raider', 'recallshocker', 'shocker', 'swiftshocker', 'turret'
    ],
    advancedfoundry: [
        'advancedblink', 'assaultbot', 'behemoth', 'heavyballista', 'predator', 'sniper'
    ],
    starforge: [
        'advancedrecall', 'airship', 'butterfly', 'dragonfly', 'falcon', 'heavyturret', 'mammoth', 'stinger'
    ],
    advancedstarforge: [
        'advancedbot', 'artillery', 'bulwark', 'katbus', 'kraken', 'locust', 'valkyrie'
    ]
};


const colorBase = "#ccc";
const margin = { top: 25, right: 30, bottom: 35, left: 20 };
const width = 485 - margin.left - margin.right;
const height = 250 - margin.top - margin.bottom;

const svgUnitPicks = d3.select("#viz-unit-picks")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);


let selectedUnits = new Set(); // Initially empty, will be set when tech tier is selected
let highlightedUnit = null;
const unitStats = {};



Promise.all([
  d3.csv('resources/data/ba-202407/units_per_slot.csv'),
]).then(([unitPickRates]) => {
    const parseDate = d3.timeParse("%Y-%m-%d"); // Define the date parsing function

    DataStore.unitPickRates = unitPickRates.map(d => ({
        date: parseDate(d.date),
        slug: d.slug,
        techTierSlug: d.techTierSlug,
        count: +d.c,
        percentage: +d.perc,
    }));


    unitPickRates.forEach(d => {
        const unit = d.slug;
        if (!unitStats[unit]) {
            unitStats[unit] = {
                min: d.perc,
                max: d.perc
            };
        } else {
            unitStats[unit].min = Math.min(unitStats[unit].min, d.perc);
            unitStats[unit].max = Math.max(unitStats[unit].max, d.perc);
        }
    });


    updateControlPanel();
    drawUnitPickRatesChart();

    // Add event listener to the select box
    d3.select("#techTierSlug").on("change", function() {
        updateControlPanel();
        drawUnitPickRatesChart();
    });


    addOnHoverToInlineUnitNames();

});


function updateControlPanel() {
    const selectedTechTier = d3.select("#techTierSlug").property("value");
    const units = techTierUnits[selectedTechTier];

    // Find the unit with the highest max percentage
    let bestUnit = null;
    units.forEach(unit => {
        if (!bestUnit || unitStats[unit].max > unitStats[bestUnit].max) {
            bestUnit = unit;
        }
    });

    selectedUnits = new Set([bestUnit]); // Only select the best unit

    // Clear existing control panel
    const controlPanel = d3.select("#unit-controls");
    controlPanel.selectAll("*").remove();

    // Create control panel buttons
    units.forEach(unit => {
        const button = controlPanel.append("div")
            .attr("class", "unit-button col-4 my-2")
            .on("click", () => selectUnit(unit))
            .on("mouseover", () => highlightUnit(unit))
            .on("mouseout", () => highlightUnit(null))
        ;

        button.append("img")
            .attr("src", `https://cdn.playbattleaces.com/images/icons/units/${unit}.png`)
            .attr("alt", unit)
            .classed("selected", selectedUnits.has(unit));

        button.append("span")
            .attr("class", "unit-label")
            .text(unit);

        button.append("span")
            .attr("class", "unit-stats")
            .text(`${(unitStats[unit].min * 100).toFixed(1)}% - ${(unitStats[unit].max * 100).toFixed(1)}%`);

    });
}

function selectUnit(unit) {
    selectedUnits.forEach(unit => {d3.select(`img[alt="${unit}"]`).classed("selected", false);});
    selectedUnits = new Set([unit]); // Only select the one unit

    d3.select(`img[alt="${unit}"]`).classed("selected", true);
    drawUnitPickRatesChart();
}

function highlightUnit(unit) {
    highlightedUnit = unit;
    d3.selectAll(".unit-highlighted").classed("unit-highlighted", false);
    d3.select(`img[alt="${unit}"]`).classed("unit-highlighted", true);
    drawUnitPickRatesChart();
}


function drawUnitPickRatesChart(){
    const formatDate = d3.timeFormat("%a %d"); // e.g., "Sun 07"

    const data = DataStore.unitPickRates;
    const selectedTechTier = d3.select("#techTierSlug").property("value");
    const dataFiltered = data.filter(d => d.techTierSlug === selectedTechTier);
    svgUnitPicks.selectAll("*").remove();

    const targetSvg = svgUnitPicks.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.extent(data, d => d.percentage)[1]])
        .range([height, 0]);

    // Add X axis
    targetSvg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(formatDate));


    // Define the Y axis with dynamic ticks
    const yAxis = d3.axisRight(y)
        .tickValues(d3.range(0, Math.ceil(y.domain()[1] * 10)).map(d => d / 10)) // Generate ticks at multiples of 0.1
        .tickFormat(d => (d * 100) + '%'); // Custom format to convert decimal to percentage

    // Add Y axis with custom ticks
    targetSvg.append("g")
        .attr("transform", `translate(${width},0)`)
        .call(yAxis);


    targetSvg.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "-0.5em")
        .style("text-anchor", "start")
        .text("Pick rate of units (daily)");


    // Group data by slug
    const dataBySlug = d3.groups(dataFiltered, d => d.slug);

    // Define line generator
    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.percentage));

    const balancePatch3 = targetSvg.append("line")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        // .attr("stroke-dasharray", "5,5")
        .attr("x1", x(new Date("2024-07-08")))
        .attr("x2", x(new Date("2024-07-08")))
        .attr("y1", 0)
        .attr("y2", 15);

    const balancePatch3Label = targetSvg.append("text")
        .attr("x", x(new Date("2024-07-08")) +2 )
        .attr("y", 0)
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .attr("font-size", "0.8em")
        .attr("fill", "#666")
        .text("Patch #3");

    const balancePatch4 = targetSvg.append("line")
        .attr("stroke", "#666")
        .attr("stroke-width", 1)
        // .attr("stroke-dasharray", "5,5")
        .attr("x1", x(new Date("2024-07-11")))
        .attr("x2", x(new Date("2024-07-11")))
        .attr("y1", 0)
        .attr("y2", 15);

    const balancePatch4Label = targetSvg.append("text")
        .attr("x", x(new Date("2024-07-11")) +2 )
        .attr("y", 0)
        .attr("dy", "1em")
        .attr("text-anchor", "start")
        .attr("font-size", "0.8em")
        .attr("fill", "#666")
        .text("Patch #4");



    // Draw non-selected unit lines first
    targetSvg.selectAll(".line")
        .data(dataBySlug.filter(d => !selectedUnits.has(d[0])))
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d[1]))
        .attr("fill", "none")
        .attr("stroke", colorBase)
        .attr("stroke-width", 1.5);

    // Draw selected unit lines last (to be on top)
    targetSvg.selectAll(".line-selected")
        .data(dataBySlug.filter(d => selectedUnits.has(d[0])))
        .enter()
        .append("path")
        .attr("class", "line-selected")
        .attr("d", d => line(d[1]))
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Draw highlighted unit lines last last (to be on top top)
    targetSvg.selectAll(".line-highlighted")
        .data(dataBySlug.filter(d => d[0] == highlightedUnit))
        .enter()
        .append("path")
        .attr("class", "line-highlighted")
        .attr("d", d => line(d[1]))
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2);
}


function addOnHoverToInlineUnitNames() {
    const inlineSpan = document.querySelectorAll("span.unit-inline");
    inlineSpan.forEach(x => {
        const unitName = x.dataset.slug;
        const group = x.dataset.sluggroup;
        x.addEventListener("mouseover", () => {
            const selectedTechTier = d3.select("#techTierSlug").property("value");
            if (selectedTechTier !== group) {
                d3.select("#techTierSlug").property("value", group);
                updateControlPanel();
            }
            highlightUnit(unitName);

        });
        x.addEventListener("mouseout", () => highlightUnit(null));
    });
}


})();