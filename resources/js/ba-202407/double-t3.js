(function() {

const colorBase = "#ccc";


const margin = { top: 25, right: 30, bottom: 35, left: 30 };
const width = 500 - margin.left - margin.right;
const height = 150 - margin.top - margin.bottom;


Promise.all([
  d3.csv('resources/data/ba-202407/wildcards.csv'),
  d3.csv('resources/data/ba-202407/t3_combo_foundry.csv'),
  d3.csv('resources/data/ba-202407/t3_combo_starforge.csv'),
]).then(([wildcards, foundry, starforge]) => {
    const parseDate = d3.utcParse("%Y-%m-%d"); // Define the date parsing function

    DataStore.wildcards = wildcards.map(d => ({
        date: parseDate(d.date),
        advancedfoundry: +d.advancedfoundry,
        advancedstarforge: +d.advancedstarforge,
        foundryT3Perc: 1 - d.foundryPerc,
        starforgeT3Perc: 1 - d.starforgePerc,
    }));

    const bestCombosFoundry = foundry.map(d => ({
        date: parseDate(d.date),
        unit1: d.unit1,
        unit2: d.unit2,
        count: +d.count,
    }));

    const groupedByDateFoundry = d3.groups(bestCombosFoundry, d => d.date);

    const maxCountsPerDateFoundry = groupedByDateFoundry.map(([date, records]) => {
        const maxRecord = records.reduce((max, record) => (record.count > max.count ? record : max), records[0]);
        return {
            date: date,
            foundryCombo: maxRecord
        };
    });

    const bestCombosStarforge = starforge.map(d => ({
        date: parseDate(d.date),
        unit1: d.unit1,
        unit2: d.unit2,
        count: +d.count,
    }));

    const groupedByDateStarforge = d3.groups(bestCombosStarforge, d => d.date);

    const maxCountsPerDateStarforge = groupedByDateStarforge.map(([date, records]) => {
        const maxRecord = records.reduce((max, record) => (record.count > max.count ? record : max), records[0]);
        return {
            date: date,
            starforgeCombo: maxRecord
        };
    });

    DataStore.wildcards = DataStore.wildcards.map(wildcard => {
        const foundryCombo = maxCountsPerDateFoundry.find(combo => combo.date.getTime() === wildcard.date.getTime());
        const starforgeCombo = maxCountsPerDateStarforge.find(combo => combo.date.getTime() === wildcard.date.getTime());

        return {
            ...wildcard,
            foundryCombo: foundryCombo ? foundryCombo.foundryCombo : null,
            foundryComboPerc: foundryCombo ? (foundryCombo.foundryCombo.count / wildcard.advancedfoundry) : "N/A",
            starforgeCombo: starforgeCombo ? starforgeCombo.starforgeCombo : null,
            starforgeComboPerc: starforgeCombo ? (starforgeCombo.starforgeCombo.count / wildcard.advancedstarforge ) : "N/A"
        };
    });

    drawWildcardsTable();
});

function drawWildcardsTable() {
    const data = DataStore.wildcards;
    const tableBody = d3.select("#container-viz-double-t3").select("tbody");

    // const container = d3.select("#container-viz-double-t3");
    const formatDate = d3.timeFormat("%a %d");

    tableBody.html("");

    // Append rows
    const rows = tableBody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // Append cells
    rows.each(function(row) {
        const cells = d3.select(this).selectAll("td")
            .data([
                { value: formatDate(row.date), class: "text-end" },
                { value: (row.foundryT3Perc * 100).toFixed(1) + "%", class: "text-end background-1" },
                { value: (row.starforgeT3Perc * 100).toFixed(1) + "%", class: "text-end background-2" },
                {
                    value: row.foundryCombo ? `
                        <img class="unit-icon ${row.foundryCombo.unit1}" src="https://cdn.playbattleaces.com/images/icons/units/${row.foundryCombo.unit1}.png" alt="${row.foundryCombo.unit1}" title="${row.foundryCombo.unit1}">
                        <img class="unit-icon ${row.foundryCombo.unit2}" src="https://cdn.playbattleaces.com/images/icons/units/${row.foundryCombo.unit2}.png" alt="${row.foundryCombo.unit2}" title="${row.foundryCombo.unit2}">
                    ` : "N/A",
                    class: "text-center background-1"
                },
                {
                    value: (row.foundryComboPerc * 100).toFixed(0) + "%",
                    class: "combo-perc-cell text-end background-1",
                    perc: row.foundryComboPerc * 100
                },
                {
                    value: row.starforgeCombo ? `
                        <img class="unit-icon ${row.starforgeCombo.unit1}" src="https://cdn.playbattleaces.com/images/icons/units/${row.starforgeCombo.unit1}.png" alt="${row.starforgeCombo.unit1}" title="${row.starforgeCombo.unit1}">
                        <img class="unit-icon ${row.starforgeCombo.unit2}" src="https://cdn.playbattleaces.com/images/icons/units/${row.starforgeCombo.unit2}.png" alt="${row.starforgeCombo.unit2}" title="${row.starforgeCombo.unit2}">
                    ` : "N/A",
                    class: "text-center background-2"
                },
                {
                    value: (row.starforgeComboPerc * 100).toFixed(0) + "%",
                    class: "combo-perc-cell text-end background-2 " ,
                    perc: row.starforgeComboPerc * 100
                }
            ])
            .enter()
            .append("td")
            .attr("class", d => d.class)
            .html(d => d.value);

        // Add sparklines
        cells.filter(d => d.class.includes("combo-perc-cell")).each(function(d) {
            const container = d3.select(this)
                .append("div")
                .style("position", "relative")
                .style("width", "100%")
                .style("height", "8px")
                .style("margin-top", "2px")
                .style("border", "solid 1px #aaa");

            // // Add the 50% vertical line
            // container.append("div")
            //     .style("position", "absolute")
            //     .style("left", "50%")
            //     .style("top", "0")
            //     .style("bottom", "0")
            //     .style("width", "1px")
            //     .style("background", "#aaa");

            // Add the filled part of the progress bar
            container.append("div")
                .style("width", d => d.perc + "%")
                .style("height", "100%")
                .style("background", "steelblue");
        });

        // Add hover functionality
        d3.selectAll(".unit-icon")
            .on("mouseenter", function(event) {
                const unitClass = d3.select(this).attr("class").split(' ').filter(c => c !== "unit-icon")[0];
                d3.selectAll(`.${unitClass}`).classed("unit-selected", true);
            })
            .on("mouseleave", function(event) {
                const unitClass = d3.select(this).attr("class").split(' ').filter(c => c !== "unit-icon")[0];
                d3.selectAll(`.${unitClass}`).classed("unit-selected", false);
            });

        });
}

})();