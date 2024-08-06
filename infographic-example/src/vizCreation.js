/**
 * General info
 */
const width = 750;
const widthSmall = 400;
const heightBig = 600;
const heightSmall = 150;
const margin = 10;

const colorRangePos = [
    {fill: '#9b0014', text:'#f0f0f0'}, 
    {fill: '#d94a40', text:'#000000'}
]

const colorRangeNeg = [
    {fill: '#878787', text:'#000000'},
    {fill: '#595959', text: '#f0f0f0'}
]

const colorRangeReds = d3.scaleOrdinal()
    .range(["#4D000A", "#9B0014", "#d94a40", "#A4666E", "#EEA7B0", "#f8d8dc"])

/**
 * Function to wrap text of axis labels
 */
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

/**
 * Create all svgs
 */
d3.selectAll(".section-content > .dataviz-wrapper")
    .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width} ${heightBig}`)
            .append("g")
            .attr("transform", `translate(${margin/2}, ${margin/2})`);

d3.selectAll(".section-appendix > .dataviz-wrapper")
    .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${width+margin} ${heightSmall+margin}`)
        .append("g")
            .attr("transform", `translate(${margin/2}, ${margin/2})`);

d3.selectAll(".section-content-gridlike > .dataviz-wrapper")
    .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${widthSmall+margin} ${heightSmall+margin}`)
        .append("g")
            .attr("transform", `translate(${margin/2}, ${margin/2})`);


/**
 * Load data summary into cards
 */
function loadDataIntoCard(ids, texts) {
    for (i in ids) {
        d3.select("#"+ids[i]).text(texts[i])
    }
}

/**
 *  Create treemap of the courses
 */ 
function createTreemapViz(type="SSD") {
    let uid_n = -1;
    const courseOutlineSvg = d3.select("#course-outline .section-content > .dataviz-wrapper svg g");
    courseOutlineSvg.selectAll("*").remove();

    const data = d3.stratify().path(d => d[`${type}`]+"/"+"/"+d.Insegnamento)(exams);

    function draw(data) {
        const color = d3.scaleOrdinal()
            .range(colorRangePos.concat(colorRangeNeg))
            .domain(data.children.map(d => d.id.split("/")[1])); 

        const root = d3.treemap()
            .tile(d3.treemapBinary)
            .size([width, heightBig])
            .padding(7)
            .round(true)
            (d3.hierarchy(data)
                .sum(d => parseInt(d.data?.["CFU\r\ntotali"])));
        
        // Add a cell for each leaf of the hierarchy
        const leaf = courseOutlineSvg.selectAll("g")
            .data(root.leaves())
            .join("g")
                .attr("transform", d => `translate(${d.x0},${d.y0})`);
        
        // Tooltip
        var tooltip = d3.select("#tooltips").append("div")
                .attr("class", "treemap-tooltip tooltip");

        leaf
            .on("pointerover", (event, d) => handlePointerOver(event, `<strong>${d.data.data.Insegnamento}</strong><br />CFU: ${d.data.data["CFU\r\ntotali"]}<br />Affinità: ${d.data.data.SSD}<br />Periodo: ${
                d.data.data["anno"]} anno${d.data.data["periodo"] ? ", "+d.data.data["periodo"] : ""}`, tooltip))
            .on("pointermove", (event) => handlePointerMove(event, tooltip))
            .on("pointerout", (event, d) => handlePointerOut(event, tooltip));

        // Append a color rectangle. 
        leaf.append("rect")
            .attr("class", "color-rect")
            .attr("fill", d => color(d.data.id.split("/")[1]).fill)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

        // Append a clipPath to ensure text does not overflow
        leaf.append("clipPath")
            .attr("id", d => (d.clipUid = `clip-${++uid_n}`))
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);
        
        // Append multiline text for the rects. The last line shows the value and has a specific formatting
        leaf.append("text")
            .attr("clip-path", d => `url(#${d.clipUid})`)
            .selectAll("tspan")
            .data(d => {
                const id = d.data.id.split("/")[1];     // subject (MAT, INF, ALTRO) for font color
                return [
                    { text: d.data.data.Insegnamento, id },
                    { text: `${d.data.data["CFU\r\ntotali"]} CFU`, id }
                ];
            })
            .join("tspan")
                .attr("fill", d => color(d.id).text)
                .attr("x", 3)
                .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
                .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
                .text(d => d.text);
        
        // Section text
        courseOutlineSvg.selectAll("titles")
            .data(root.descendants().filter(d => d.depth==1))
            .join("text")
                .attr("x", d => d.x0+5)
                .attr("y", d => d.y0)
                .text(d => {
                    const abbr = d.data.id.replace("/", "");
                    switch (abbr) {
                        case "INF":
                            return "INFORMATICA";
                        case "MAT":
                            return "MATEMATICA";
                        case "I":
                            return "ANNO I";
                        case "II":
                            return "ANNO II";
                        case "III":
                            return "ANNO III";
                        default:
                            return abbr;
                    }
                })
                .attr("fill",  d => color(d.data.id.replace("/", "")).fill) 
    }

    draw(data);
}


/**
 *  Create venn diagram
 */ 
function createVennViz(svg, sets) {
    let isNew = true;       // true means is the first time the venn is drawn

    function getSets() {
        if(isNew === true) {
            return [{sets: ["Clicca per scoprire cosa hanno deciso di fare i laureati"], size: 100}]
        }
        else {
            return sets;
        }
    }
    
    const vennG = svg.append("g")
        .attr("transform", `translate(${margin/2}, ${margin/2})`);

    var chart = venn.VennDiagram()
        .width(width-margin)
        .height(heightBig-margin);

    // Create tooltip
    var tooltip = d3.select("#tooltips").append("div")
        .attr("class", "venn-tooltip tooltip");

    // Add img
    const imgSize = (width-margin)/3;
    vennG.append("image")
        .attr("xlink:href", "./src/assets/images/graduate.svg")
            .attr("x", chart.width() /2 - imgSize/2)
            .attr("y", chart.height() /2 - imgSize/2)
            .attr("height", imgSize)
            .attr("height", imgSize);

    const colorRange = colorRangeNeg.slice(1).concat(colorRangePos);
    
    function draw() {
        let sets = getSets();

        // Display text for 0% values   
        const emptySets = sets.filter(d => d.size === 0);
        if(emptySets) {
            sets = sets.filter(d => d.size !== 0);
            svg.append("text")
                .attr("class", "chart-info")
                .attr("x", width-margin)
                .attr("text-anchor", "end")
                .attr("y", heightBig-margin/2-15)
                .text(emptySets.map(d => ` ${d.sets}: 0%`));
        }

        //Venn
        vennG.datum(sets).call(chart);

        vennG.selectAll(".venn-circle path")
        .style("fill-opacity", .7)
        .style("fill", (d,i) => colorRange[i].fill);

        vennG.selectAll(".venn-circle text")
            .style("fill", (d,i) => colorRange[i].text)
            .style("font-size", '14px')
            .transition()
            .attr("transform", isNew ? `translate(0, ${(imgSize)/2+30})` : `translate(0, 0)`);

        vennG.selectAll("path")
            .style("stroke-opacity", 0)
            .style("stroke", "#333333")
            .style("stroke-width", 3);

        if(isNew === false) {           
            vennG.selectAll("g")
                .on("pointerover", (event, d) => handleVennPointerOver(event, d, vennG, tooltip))
                .on("pointermove", (event) => handlePointerMove(event, tooltip))
                .on("pointerout", (event, d) => handleVennPointerOut(event, d, tooltip));
        }
        else {
            isNew = false;
            vennG.selectAll("g")
                .on("click", () => { 
                    vennG.select("image").remove();
                    draw();
                })
        }
    }
    
    draw();
}


/**
 *  Create Sankey Chart
 */ 
function createSankeyViz(svg, data) {
    // Format data in source-target-value
    const formattedData={nodes: [], links: []};

    formattedData.nodes.push({name : "Donne", category: "gender"});
    formattedData.nodes.push({name : "Uomini", category: "gender"});
    formattedData.nodes.push({name : "Matricole", category: "status"});

    for (school in data) {
        if(school.includes("donne")){
            formattedData.links.push({
                source: "Donne", 
                target: school.replace("donne", "").trim(), 
                value: parseInt(data[school] || "0")            // use || "0" to parse 0 if string is empty
            })
        }
        else if(school.includes("totale")){
            formattedData.links.push({
                source: "Uomini", 
                target: school.replace("totale", "").trim(), 
                value: parseInt(data[school] || "0") - parseInt(data[school.replace("totale", "donne")] || "0")
            })

            formattedData.links.push({
                source: school.replace("totale", "").trim(),
                target: "Matricole",
                value: parseInt(data[school] || "0")
            })

            formattedData.nodes.push({name : school.replace("totale", "").trim(), category: "school"});
        }
    }
    const totalStudents = parseInt(data["TOTALE"]);

    const genderBoxSize = 200;

    // Sankey generator
    const sankey = d3.sankey()
        .nodeId(d => d.name)
        .nodeAlign(d3.sankeyJustify)
        .nodeWidth(15)
        .nodePadding(30)
        .extent([[margin+genderBoxSize, margin], [width - margin, heightBig - margin]]);
    
    let {nodes, links} = sankey({
        nodes: formattedData.nodes.map(d => Object.assign({}, d)),  // shallow copy of nodes to avoid changes
        links: formattedData.links.map(d => Object.assign({}, d))   // shallow copy of links to avoid changes
    });

    // Colors
    const colorRange = colorRangePos.concat(colorRangeNeg);
    
    const colorScale = d3.scaleOrdinal()
        .domain(["gender", "school", "status"])
        .range(colorRange.map(d => d.fill).slice(0,3))

    // Creates the rects that represent the nodes.
    const rect = svg.append("g")
        .attr("stroke", '#333333')
        .selectAll()
        .data(nodes)
        .join("rect")
            .attr("class", "node")
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("height", d => d.y1 - d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("fill", d => colorScale(d.category));

    // Adds labels on the nodes.
    svg.append("g")
        .selectAll()
        .data(nodes)
        .join("text")
            .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr("y", d => (d.y1 + d.y0) / 2)
            .attr("dy", "0.35em")
            .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
            .text(d => d.name);

    // Created boxes for data based on gender
    const genderNodes = nodes.filter(d => d.category === "gender");
    const genderBox = svg.append("g").attr("class", "gender-box");

    genderBox.selectAll(".gender-box")
        .data(genderNodes)
        .join("rect")
            .attr("class", "gender-box")
            .attr("x", d => (d.x0 - genderBoxSize))
            .attr("y", d => d.y0)
            .attr("width", genderBoxSize)
            .attr("height", d => d.y1 - d.y0)
            .style("fill", "#f0f0f0")
            .style("stroke", colorScale("gender"));

    const foreignObject = genderBox
        .selectAll(".foreign-object")
        .data(genderNodes)
        .join("foreignObject")
            .attr("class", "foreign-object")
            .attr("x", d => (d.x0 - genderBoxSize))
            .attr("y", d => d.y0)
            .attr("width", genderBoxSize)
            .attr("height", d => d.y1 - d.y0);
    
    foreignObject.append("xhtml:div")
        .style("width", "100%")
        .style("height", "100%")
        .style("display", "flex")
        .style("align-items", "center")
        .style("justify-content", "center")
        .html(d => `
            <img src="./src/assets/images/${d.name}.svg" alt="Icona ${d.name}" style="height: ${(d.y1 - d.y0)/2}px; max-height: 64px; padding-left: 5px" />
            <span class="text-highlight focus">${d3.format(".2%")(d.value/totalStudents)}</span>
        `);

    // Creates the paths that represent the links
    const link = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.5)
        .selectAll()
        .data(links)
        .join("g")
            .style("mix-blend-mode", "multiply");
    
    let uid = 0;
    const defs = svg.append("defs");
    links.forEach(link => {
        const gradient = defs.append("linearGradient")
            .attr("id", `gradient-${uid}`)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", link.source.x1)
            .attr("y1", link.source.y1)
            .attr("x2", link.target.x0)
            .attr("y2", link.target.y0);
    
        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", colorScale(link.source.category));
    
        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", colorScale(link.target.category));
    
        link.uid = uid++;
    });
    
    // Append path elements representing links (gradient)
    const gradientLinks = link.append("path") 
        .attr("class", "gradient-link")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", d => `url(#gradient-${d.uid})`)
        .attr("stroke-opacity", 0)
        .attr("stroke-width", d => Math.max(1, d.width))
        .each(setDash);

    // Append path element representing links (grey)
    link.append("path")
        .attr("class", "grey-links")
        .attr("d", d3.sankeyLinkHorizontal())
        .attr("stroke", 'black')
        .attr("stroke-opacity", 0.2)
        .attr("stroke-width", d => Math.max(1, d.width));

    // Define the default dash behavior for colored gradients.
    function setDash() {
        const path = d3.select(this);
        if (!path.empty()) {
            let length = path.node().getTotalLength();
            path.attr("stroke-dasharray", `${length} ${length}`)
                .attr("stroke-dashoffset", length);
        }
    }
    
    function branchAnimate(event, d) {
        let links = svg.selectAll("path.gradient-link")
            .filter((link) => {
                return d.sourceLinks.includes(link);
            });
        let nextNodes = [];
        links.each((link) => {
            nextNodes.push(link.target);
        });
        links.attr("stroke-opacity", 0.5)
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", () => {
                nextNodes.forEach((node) => {
                    branchAnimate(event = null, node);
                });
            });
    }
  

    function branchClear() {
        gradientLinks
            .transition()
            .attr("stroke-opactiy", 0)
            .each(setDash);
    }
    
    // Tooltip
    var tooltip = d3.select("#tooltips").append("div")
        .attr("class", "sankey-tooltip tooltip");

    // Adds tooltip on the nodes
    rect
        .on("pointerover", (event, d) => {branchAnimate(event, d); handlePointerOver(event, `<strong>${d.name}:</strong> ${d.value} ${d.value === 1 ? "persona" : "persone"}`, tooltip)})
        .on("pointermove", (event) => handlePointerMove(event, tooltip))
        .on("pointerout", (event) => {branchClear(); handlePointerOut(event, tooltip)});

    // Tooltip on links
    link
        .on("pointerover", (event, d) => handleLinksPointerOver(event, `<strong>${d.source.name} → ${d.target.name}:</strong> ${d.value} ${d.value === 1 ? "persona" : "persone"}`, tooltip))
        .on("pointermove", (event) => handlePointerMove(event, tooltip))
        .on("pointerout", (event) => handleLinksPointerOut(event, tooltip));
}


/**
 *  Create ordered bar
 */ 
function createOrderedBarViz(svg, data) {
    // Scales (and axis)
    const x = d3.scaleBand()
        .domain(data.answers.map(a => a.answer))
        .range([margin*2, width - margin*2])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data.answers, (d) => d.value)])
        .range([heightBig - margin*2-20, margin*2]);
    
    // Add the x-axis and label.
    svg.append("g")
        .attr("transform", `translate(0,${heightBig - margin*2-20})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll(".tick text")
        .call(wrap, x.bandwidth());

    svg.append("g")
        .attr("transform", `translate(${margin*2+10},0)`)
        .call(d3.axisLeft(y).tickFormat((y) => `${y}%`))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", -margin*2-15)
            .attr("y", 5)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text("↑ Percentage of students (%)"));

    // Bars
    const bars = svg.append("g")
        .attr("fill", colorRangePos[0].fill)
        .selectAll()
        .data(data.answers)
        .join("rect")
            .attr("x", (d) => x(d.answer))
            .attr("y", (d) => y(d.value))
            .attr("height", (d) => y(0) - y(d.value))
            .attr("width", x.bandwidth());
    
    // Text with accurate % of bars
    svg.selectAll(".bar-labels")
        .data(data.answers)
        .join("text")
            .attr("x", (d) => x(d.answer) + x.bandwidth() / 2 + margin/2)
            .attr("y", (d) => y(d.value)-12)
            .attr("text-anchor", "middle")
            .attr("dy", "0.75em")
            .attr("fill", colorRangePos[0].fill)
            .text(d => `${d.value}%`)

}

/**
 *  Create diverging bar chart
 */ 
function createDivergingBarViz(svg, data, size = "big", delimiter = 2){     // delimiter separate positives from negatives
    let xWidth = size === "big" ? width : widthSmall;    

    // Answers can be positive or negative (if negative -tot% instead of tot%)
    const positives = data.answers.slice(0,delimiter).map(d => d.answer).reverse();
    const negatives = data.answers.slice(delimiter).map(d => d.answer).reverse();

    data.answers.forEach((element, index) => {
        if (element.value !== 0 && negatives.includes(element.answer)) {
            data.answers[index].value = - data.answers[index].value; 
        }
    });
    
    // Scales
    const colorRange = colorRangeNeg.map(d => d.fill).slice(0,delimiter).reverse().concat(colorRangePos.map(d => d.fill).slice(0,delimiter).reverse());
    const colorScale = d3.scaleOrdinal()
        .domain([].concat(negatives, positives))
        .range(colorRange);

    const xScale = d3.scaleLinear()
        .domain([-100, 100])
        .range([margin, xWidth - margin]);
    
    // Add axis
    const xAxis = d3.axisTop(xScale)
        .ticks(9)
        .tickFormat(d => `${(d)}%`);

    svg.append("g")
        .attr("transform", `translate(1, ${margin/2+20})`)
        .attr("class", "axis")
        .call(xAxis);

    // Stack layout function
    const stack = d3.stack()
        .keys(["value"])        // stacked based on value property
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetDiverging);

    const stackedData = stack(data.answers.reverse());

    // One group for each bar
    const groups = svg.selectAll("g.bar")
        .data(stackedData)
        .join("g")
            .attr("class", "bar")
            .attr("transform", `translate(1, ${margin/2+21})`);

    const rects = groups.selectAll("rect")
        .data(d => d)
        .join("rect")
            .attr("x", (d,i) => (i > 0 ? (xScale(stackedData[0][i-1][1] + d[0])) : xScale(d[0]+stackedData[0][i+1][0])))
            .attr("y", 0)
            .attr("width", d => Math.abs(xScale(d[1]) - xScale(d[0])))
            .attr("height", 50)
            .attr("fill", (d, i) => colorScale(data.answers[i].answer));
   
    // Tooltip
    var tooltip = d3.select("#tooltips").append("div")
        .attr("class", "div-bars-tooltip tooltip");

    // Adds tooltip on the bars
    rects
        .on("pointerover", (event, d) => handlePointerOver(event, `<strong>${d.data.answer}:</strong> ${Math.abs(d.data.value)}%`, tooltip))
        .on("pointermove", (event) => handlePointerMove(event, tooltip))
        .on("pointerout", (event) => handlePointerOut(event, tooltip));

    // Legend
    const negativeLegend = d3.legendColor()
        .scale(colorScale)
        .cellFilter(d => negatives.includes(d.label))
        .ascending(true);
    
    const positiveLegend = d3.legendColor()
        .scale(colorScale)
        .cellFilter(d => positives.includes(d.label));

    svg.append("g")
        .attr("transform", `translate(${xWidth/4-50}, ${margin/2+80})`)
        .attr("class", "legend")
        .call(negativeLegend);

    svg.append("g")
        .attr("transform", `translate(${xWidth/4*3-50}, ${margin/2+80})`)
        .attr("class", "legend")
        .call(positiveLegend);
}


/**
 *  Create waffle chart
 */ 
function createWaffleViz(svg, data) {
    // Setup
    const n_cells_hor = 20;
    const n_cells_ver = 5;

    // Format data
    const waffles = []
    const max = data.answers.length; 
    let index = 0, curr = 1, 
        accu = Math.round(data.answers[0].value), waffle = [];
    
    for (let y = n_cells_ver-1; y >= 0; y--)
      for (let x = 0; x < n_cells_hor; x ++) {
        if (curr > accu && index < max-1) {
            let r = Math.round(data.answers[++index].value);
            while(r === 0 && index < max-1) r = Math.round(data.answers[++index].value);
            accu += r;
        }
        waffle.push({x, y, index});
        curr++;
      } 
    waffles.push(waffle);

    // Scales
    const xScale = d3.scaleBand()
        .domain(Array.from({length: n_cells_hor}, (v, i) => i))
        .range([margin/2, widthSmall - margin/2])
        .padding(0.1);
    
    const yScale = d3.scaleBand()
        .domain(Array.from({length: n_cells_ver}, (v, i) => i))
        .range([0, heightSmall - margin - 80])      // 80 for legend
        .padding(0.1);
    
    const colorScale = colorRangeReds
        .domain(Array.from({length: data.answers.length}, (v, i) => i));

    // Waffle
    const g = svg.selectAll(".waffle")  
        .data(waffles)
        .join("g")
            .attr("class", "waffle")
            .attr("transform", `translate(0,${margin/2})`);

    const cells = g.append("g")
        .selectAll("rect")
        .data(d => d)
            .join("rect")
            .attr("fill", d => d.index === -1 ? "#333333" : colorScale(d.index))
            .attr("stroke", 'rgba(0,0,0,0.5)');

    cells.attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("rx", 3)
        .attr("ry", 3)
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())      

    // Tooltip
    var tooltip = d3.select("#tooltips").append("div")
        .attr("class", "waffle-tooltip tooltip");

    cells
        .on("pointerover", (event, d) => handleWafflePointerOver(svg, event, `<strong>${data.answers[d.index].answer}:</strong> ${data.answers[d.index].value.toFixed(2)}%`, tooltip))
        .on("pointermove", (event) => handlePointerMove(event, tooltip))
        .on("pointerout", (event) => handleWafflePointerOut(svg, event, tooltip));    

    // Legend
    const legend = d3.legendColor()
        .scale(colorScale)
        .labels(data.answers.map(a => a.answer))
        .orient("horizontal")
        .labelOffset(5)
        .shapePadding(widthSmall/data.answers.length-15)
        .labelWrap(widthSmall/data.answers.length-5)
        .labelAlign("start");

    svg.append("g")
        .attr("transform", `translate(${margin/2}, ${heightSmall-margin/2-70})`)
        .call(legend);
}



/**
 * Map creation using leaflet+D3
 */
function createMap(geoJson) {
    const initialCoords = [45.409561, 11.887347];
    const initialZoom = 16;

    // Initialize Leaflet map
    var map = L.map('map').setView(initialCoords, initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {foo: 'bar', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);

    // Add svg overlay to the leaflet map
    L.svg().addTo(map)
  
    const overlay = d3.select(map.getPanes().overlayPane)
    const svg = overlay.select('svg')
    const g = svg.append('g').attr('class', 'leaflet-zoom-hide');

    function projectPoint(lat, lon) {
        const point = map.latLngToLayerPoint([lat, lon]);
        return [point.x, point.y];
    }

    // Create polygons with geoJson data
    const polygons = g.selectAll('polygon')
        .data(geoJson.features)
        .join('polygon')
            .attr('class', 'polygon')
            .attr('points', d => d.geometry.coordinates[0].map(coord => projectPoint(coord[1], coord[0])).join(' '))
            .attr("fill", colorRangePos[0].fill)
            .attr("fill-opacity", 0.7)
            .attr("stroke", colorRangeNeg[1].fill);
    
    // Calculate center of polygon based on coords (for marker position)
    function calculateCentroid(coords) {
        let area = 0;
        let x = 0;
        let y = 0;

        for (let i = 0, len = coords.length; i < len; i++) {
            const x0 = coords[i][0], y0 = coords[i][1];
            const x1 = coords[(i + 1) % len][0], y1 = coords[(i + 1) % len][1];
            const a = x0 * y1 - x1 * y0;
            area += a;
            x += (x0 + x1) * a;
            y += (y0 + y1) * a;
        }

        area *= 0.5;
        const factor = area !== 0 ? 1 / (6 * area) : 0;
        return [x * factor, y * factor];
    }

    // Markers
    const markersLayer = L.layerGroup().addTo(map);

    // Initialize OverlappingMarkerSpiderfier
    const oms = new OverlappingMarkerSpiderfier(map, {
        keepSpiderfied: true,
        circleFootSeparation: 25,
        circleStartAngle: 3,
        zoomOnSpiderfy: false
    });

    function createIcon(type, i) {
        let html = `<img src="./src/assets/images/marker-${type}.svg" style="width: 100%; height: 100%; position: absolute; left: ${i*3}px; top: left: ${i*3}px"/>`

        return L.divIcon({
            className: 'custom-icon',
            html: `<div>${html}</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
    }

    geoJson.features.forEach(feature => {
        const centroid = calculateCentroid(feature.geometry.coordinates[0]);
        const latLng = L.latLng(centroid[1], centroid[0]);
    
        feature.properties.type.forEach((type, i) => {
            const icon = createIcon(type, i);
            const marker = L.marker(latLng, { icon: icon });
    
            let popupContent = `<strong>${feature.properties.name}</strong><br>[${type.replace("_", " ")}]`;
            if(type === "aula_studio") {
                feature.properties.aula_studio_info.forEach(item => {
                    popupContent += `<p>Nome aula: <em>${item.name}</em>`
                    popupContent += `<br>Posti: ${item.seats}`
                    popupContent += `<br>Orario: ${item.hours}`
                    popupContent += `<br>Dotazione: ${item.facilities}</p>`
                })
            }
            
            marker.bindPopup(popupContent, {
                className: 'map-popup'
            });
    
            marker.on('click', function(event) {
                const polygon = d3.select(polygons.nodes()[geoJson.features.indexOf(feature)]);
                toggleSelectPolygon(polygon);
            });
    
            marker.on('popupclose', function(event) {
                const polygon = d3.select(polygons.nodes()[geoJson.features.indexOf(feature)]);
                unSelectPolygon(polygon);
            });
    
            markersLayer.addLayer(marker);
            oms.addMarker(marker);
        });
    });

    // Reset View Button
    d3.select("#map .leaflet-top.leaflet-left .leaflet-control")
        .append("a")
        .attr("class", "leaflet-control-reset-view")
        .attr("href", "#")
        .attr("title", "Reset view")
        .attr("role", "button")
        .attr("aria-label", "Zoom in")
        .attr("aria-disabled", "false")
        .html("<span aria-hidden='true'>&#8634;</span>")
        .on("click", function(event) {
            event.preventDefault();
            resetView();
        });

    function resetView() {
        map.setView(initialCoords, initialZoom);
    }

    // Update polygons and markers on map zoom or pan
    function update() {
        polygons.attr('points', d => d.geometry.coordinates[0].map(coord => projectPoint(coord[1], coord[0])).join(' '));
    }

    map.on("zoomend", update);
    map.on("moveend", update);
    map.on('click', function() {
        polygons.each(function() {
            const polygon = d3.select(this);
            if(polygon.attr("class").includes("selected")){
                unSelectPolygon(polygon);
            }
        });
    });
}

function toggleSelectPolygon(polygon) {
    if(!polygon.attr("class").includes("selected")) {
        polygon
            .attr("class", "selected")
            .attr("fill", '#ffaa1d')
            .attr("fill-opacity", 1)
            .attr("stroke", colorRangePos[1].fill)
            .attr("stroke-width", 3);
    }
    else {
        unSelectPolygon(polygon);
    }
}

function unSelectPolygon(polygon) {
    polygon
        .attr("class", "")
        .attr("fill", colorRangePos[0].fill)
        .attr("fill-opacity", 0.7)
        .attr("stroke", colorRangeNeg[1].fill)
        .attr("stroke-width", 1);
}