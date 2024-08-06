/**
 * General interaction with viz
 */
function handlePointerMove(event, tooltip) {
    const tooltipElement = tooltip.node();
    const tooltipRect = tooltipElement.getBoundingClientRect();     // Get tooltip dimensions
    const viewportWidth = window.innerWidth;

    // Default positions
    let top = event.pageY - tooltipRect.height - 10;
    let left = event.pageX + 10;

    // Tooltip beyond the right edge -> position to the left of the cursor
    if (left + tooltipRect.width > viewportWidth) {
        left = event.pageX - tooltipRect.width - 10; 
    }

    // Tooltip beyond the bottom edge -> position below the cursor
    if (top < 0) {
        top = event.pageY + 10; 
    }

    // Tooltip beyond the left edge -> position a small distance from the left edge
    if (left < 0) {
        left = 10;
    }

    tooltip.style("left", `${left}px`)
           .style("top", `${top}px`);
}

function handlePointerOver(event, text, tooltip) {
    tooltip.transition().duration(400).style("opacity", .9);
    tooltip.html(text);

    var selection = d3.select(event.currentTarget).transition("tooltip").duration(400);
    selection.style("fill-opacity", .7)    
}

function handlePointerOut (event, tooltip) {
    tooltip.transition().duration(400).style("opacity", 0);
    var selection = d3.select(event.currentTarget).transition("tooltip").duration(400);
    selection.style("fill-opacity", 1)
}

/**
 * Intract with waffle chart
 */
function handleWafflePointerOver(svg, event, text, tooltip) {
    tooltip.transition().duration(400).style("opacity", .9);
    tooltip.html(text);

    var selection = d3.select(event.currentTarget);
    selection.transition("tooltip").duration(400);

    const currentColor = selection.attr("fill");
    svg.selectAll("rect").filter(function() {
        return d3.select(this).attr("fill") === currentColor;
    })
        .style("fill-opacity", .7)
        .style("stroke", "#000000")
        .style("stroke-width", 2);
}

function handleWafflePointerOut (svg, event, tooltip) {
    tooltip.transition().duration(400).style("opacity", 0);

    var selection = d3.select(event.currentTarget)
    selection.transition("tooltip").duration(400);

    const currentColor = selection.attr("fill");
    svg.selectAll("rect").filter(function() {
        return d3.select(this).attr("fill") === currentColor;
    })
        .style("fill-opacity", 1)
        .style("stroke", 'rgba(0,0,0,0.5)')
        .style("stroke-width", 1);
}

/**
 * Interaction with venn viz
 */
function handleVennPointerOver(event, d, vennG, tooltip) {
    // sort all the areas relative to the current item
    venn.sortAreas(vennG, d);

    // Display a tooltip with the current size
    tooltip.transition().duration(400).style("opacity", .9);
    tooltip.text(d.size + "% dei laureati");

    // highlight the current path
    var selection = d3.select(event.currentTarget).transition("tooltip").duration(400);
    selection.select("path")
        .style("fill-opacity", d.sets.length == 1 ? .5 : .1)        // .1 for hovering intersections
        .style("stroke-opacity", 1);
}

function handleVennPointerOut (event, d, tooltip) {
    tooltip.transition().duration(400).style("opacity", 0);
    var selection = d3.select(event.currentTarget).transition("tooltip").duration(400);
    selection.select("path")
        .style("fill-opacity", d.sets.length == 1 ? .7 : .0)
        .style("stroke-opacity", 0);
}

/**
 * Interaction with sankey (or other elements with half opac links)
 */
function handleLinksPointerOut (event, tooltip) {
    tooltip.transition().duration(400).style("opacity", 0);

    d3.select(event.currentTarget).transition("tooltip").duration(400);
}

function handleLinksPointerOver(event, text, tooltip) {
    tooltip.transition().duration(400).style("opacity", .9);
    tooltip.html(text);

    d3.select(event.currentTarget).transition("tooltip").duration(400);      
}


/**
 * Accordion management
 */
const accordionElements = document.querySelectorAll('.accordion');

accordionElements.forEach(el => {
    el.addEventListener("click", function() {
        this.classList.toggle("active");

        var panel = this.nextElementSibling;
        let panelD3 = d3.select(panel);

        if (panel.style.display === "block") {
            const panelHeight = panel.scrollHeight + "px";
            panelD3.style("height", panelHeight)
                .transition()
                .duration(1000)
                .ease(d3.easeExpIn)
                .style("height", "0px")
                .on("end", () => panelD3.style("display", "none"));
        } else {
            panel.style.display = "block";
            const panelHeight = panel.scrollHeight + "px";

            panelD3.style("height", "0px")
                .transition()
                .duration(1000)
                .ease(d3.easeBounce)
                .style("height", panelHeight)
                .on("end", () => panelD3.style("height", "auto"));
        }
    });
});

/**
 * Treemap slide
 */
document.querySelector("#treemap-switch").addEventListener("change", function() {
    if(this.checked) {
        createTreemapViz("anno");
    }
    else {
        createTreemapViz();
    }
})


/**
 * Chat visibility
 */
const chatButton = document.getElementById('chatButton');
const chatWindow = document.getElementById('chatWindow');
const closeChat = document.getElementById('closeChat');

let isDragging = false;
let isMouseDown = false;
let offsetX, offsetY;

chatButton.addEventListener('pointerdown', (e) => {
    isMouseDown = true;
    offsetX = e.clientX - chatButton.getBoundingClientRect().left;
    offsetY = e.clientY - chatButton.getBoundingClientRect().top;
});

document.addEventListener('pointermove', (e) => {
    if (isMouseDown) {
        // Drag chatButton
        isDragging = true;

        let newLeft = e.clientX - offsetX;
        let newTop = e.clientY - offsetY;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        const buttonWidth = chatButton.offsetWidth;
        const buttonHeight = chatButton.offsetHeight;

        // Ensure button stays within the viewport bounds
        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - buttonWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - buttonHeight));

        chatButton.style.left = `${newLeft}px`;
        chatButton.style.top = `${newTop}px`;
    }
});

document.addEventListener('pointerup', (e) => {
    if (isMouseDown) {
        if (!isDragging) {
            // Click event
            chatWindow.style.display = chatWindow.style.display === 'none' || chatWindow.style.display === '' ? 'block' : 'none';
        }
        isMouseDown = false;
        isDragging = false;
    }
});

closeChat.addEventListener('click', () => {
    chatWindow.style.display = 'none';
});

/**
 * Chat management
 */
const chatForm = document.getElementById('chatForm');
const msgText = document.getElementById('msg');

msgText.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();      // Prevent the default newline behavior
        sendMessage();
    }
});

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
})

function sendMessage() {
    const msg = msgText.value.trim();
    const chatContent = document.querySelector("#chatWindow .chat-content");

    d3.select("#chatWindow .chat-content")
        .append("div")
        .attr("class", "chat-message user")
        .text(msg);

    msgText.value = '';
    chatContent.scrollTop = chatContent.scrollHeight;

    // Show loading msg
    const botMsg = d3.select("#chatWindow .chat-content")
        .append("div")
        .attr("class", "chat-message bot")
        .html("<span class='dot'></span><span class='dot'></span><span class='dot'></span>");
    chatContent.scrollTop = chatContent.scrollHeight;

    // Show true msg
    setTimeout(() => {
        const ans = answer(msg);
        botMsg
            .html(ans); 
        chatContent.scrollTop = chatContent.scrollHeight;
    }, 1000)
}


/**
 * Zoom-pan big dataviz
 */
let zoom = d3.zoom()
	.scaleExtent([1, 5])
	.translateExtent([[0-150, -5], [width+200, heightBig+5]])
	.on('zoom', handleZoom);

function initZoom() {
    d3.selectAll(".section-content > .dataviz-wrapper svg")
        .each(function() {
            // Apply zoom behavior to each "big" SVG
            d3.select(this).call(zoom);
        });
}

// Handle zoom events independently for each SVG
function handleZoom(event) {
    d3.select(this).select('g')
        .attr('transform', event.transform);
}

initZoom();