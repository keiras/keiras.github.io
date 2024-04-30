(function() {


const colorAsSuggestedMyAllmightyGpt4 = "#D64523"; //Fiery Red-Orange
const colorBase = colorAsSuggestedMyAllmightyGpt4;
// const colorPallette = ['#F9CBBE', '#F2865E', '#D64523', '#A63D1F', '#752B16'];
const colorPallette = ['#ffffbf', '#fee08b', '#fdae61', '#f46d43', '#d53e4f'];
const mutedNeutralColor = "#ccc";
const neutralColor = "#d53e4f";


// Dealing with vizual about home server of players and graph adjacency of mutual 1v1 ladder match encounters
Promise.all([
    d3.json('resources/data/sg-2024/nodes.json'),
    d3.json('resources/data/sg-2024/links.json')
]).then(([players, links]) => {

    const svg = d3.select("#viz-region-relations");
    const width = 800;
    const height = 440;

    svg.attr("viewBox", `0 0 ${width} ${height}`)
        // .attr("width", width + margin.left + margin.right)
        .attr("width", "100%")  // Responsive SVG width
        .attr("height", height)


    const centers = {
        'Tokyo': {x: 750, y: 150},
        'London': {x: 440, y: 125},
        'Frankfurt': {x: 510, y: 325},
        'Los_Angeles': {x: 50, y: 275},
        'Sao_Paulo': {x: 200, y: 375},
        'Sydney': {x: 750, y: 375},
        'Chicago': {x: 175, y: 175},
        'Singapore': {x: 700, y: 250},
        'Washington_DC': {x: 300, y: 250},
        'Seattle': {x: 40, y: 100}
    };

    const playersByServer = d3.group(players, d => d.home_server);
    const linkMap = new Map();
    const linkValueMap = new Map();

    links.forEach(link => {
        if (!linkMap.has(link.source)) linkMap.set(link.source, []);
        // if (!linkMap.has(link.target)) linkMap.set(link.target, []);
        linkMap.get(link.source).push(link.target);
        // linkMap.get(link.target).push(link.source);

        // Use a string key "source-target" to uniquely identify each link
        linkValueMap.set(link.source + "-" + link.target, link.value);
        // linkValueMap.set(link.target + "-" + link.source, link.value); // Assuming bidirectional relevance

    });

    Object.entries(centers).forEach(([key, value]) => {
        svg.append("circle")
            .attr("cx", value.x)
            .attr("cy", value.y)
            .attr("r", Math.sqrt(playersByServer.get(key).length) * 17.5)
            .attr("class", "cluster-circle");

        svg.append("text")
            .attr("x", value.x)
            .attr("y", value.y - 10 - Math.sqrt(playersByServer.get(key).length) * 17.5)
            .text(key)
            .attr("font-family", "sans-serif")
            .attr("font-size", "14px")
            .attr("text-anchor", "middle")
            .attr("fill", "black");
    });

    playersByServer.forEach((value, key) => {
        const nodeGroup = svg.selectAll('.node-group-' + key.replace(/[^a-zA-Z]/g, ""))
            .data(value)
            .join("g")
            .attr("class", 'player-node node-group node-group-' + key.replace(/[^a-zA-Z]/g, ""))

        nodeGroup.append("circle")
            .attr("r", 5)
            .attr("fill", mutedNeutralColor);

        nodeGroup.append("text")
            .text(d => d.nickname)
            .attr("class", "player-label")
            .attr("x", 0)
            .attr("y", -8)
            .attr("text-anchor", "middle")
            // .attr("font-weight", "bold")
            .style("display", "none");

        const simulation = d3.forceSimulation(value)
            .force("charge", d3.forceManyBody().strength(-0.7))
            .force("center", d3.forceCenter(centers[key].x, centers[key].y))
            .force("collision", d3.forceCollide().radius(10))
            .on("tick", () => {
                nodeGroup.attr("transform", d => `translate(${d.x}, ${d.y})`);
            });

        nodeGroup.on("mouseover", (event, d) => {
                const linkedNodes = new Set(linkMap.get(d.player_id));
                svg.selectAll(".player-node circle").style("fill", node => linkedNodes.has(node.player_id) ? colorBase : mutedNeutralColor)
                    .attr("r", node => {
                        if (linkedNodes.has(node.player_id)) {
                            const valueKey = d.player_id + "-" + node.player_id;
                            const scaleValue = linkValueMap.get(valueKey);
                            return scaleValue ? 5 + scaleValue/3 : 3; // Scale radius based on link value
                        } else if (node.player_id === d.player_id) {
                            return 5;
                        } else {
                            return 2;
                        }
                    })
                    .classed("highlight", node => {return node.player_id === d.player_id})
                ;

                svg.selectAll(".player-node text").style("display", node => d.player_id === node.player_id ? "block" : "none");
                moveToFront(d3.select(event.currentTarget));
            })
            .on("mouseout", (event, d) => {
                svg.selectAll(".player-node circle").style("fill", mutedNeutralColor)
                    .attr("r", 5)
                    .classed("highlight", false);
                svg.selectAll(".player-node text").style("display", "none");
            });
    });
});

// Function to move text to front
function moveToFront(selection) {
    selection.each(function(){
        this.parentNode.appendChild(this);
    });
}

})();