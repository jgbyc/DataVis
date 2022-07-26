//key value is declared in html file
//const keyValue = ["Primary_School", "High_School", "Associates_Degree"];
let xScale, yScale, xScaleContext, yScaleContext;
let currTimeRange = initTimeRange;
let aduration = 1000;

const xAxisLabel = 'Year';
const yAxisLabel = 'Unemployment Rate (%)';

const labelName = {
    "Primary_School":"Primary School",
    "High_School": "High School",
    "Associates_Degree": "Associates Degree",
    "Professional_Degree": "Professional Degree",
    "White": "White",
    "Black": "Black",
    "Asian": "Asian",
    "Hispanic": "Hispanic",
    "Men": "Male",
    "Women": "Female"
};

const color = {
    "Primary_School":"#0FB5AE",
    "High_School": "#4046CA",
    "Associates_Degree": "#F68511",
    "Professional_Degree": "#DE3D82",
    "White": "#72E06A",
    "Black": "#147AF3",
    "Asian": "#7326D3",
    "Hispanic": "#E8C600",
    "Men": "#CB5D00",
    "Women": "#008F5D"
}

const month = {
    "Jan": 0,
    "Feb": 1,
    "Mar": 2,
    "Apr": 3,
    "May": 4,
    "Jun": 5,
    "Jul": 6,
    "Aug": 7,
    "Sep": 8,
    "Oct": 9,
    "Nov": 10,
    "Dec": 11
};

const type = d3.annotationCustomType(
    d3.annotationXYThreshold, 
    {"note":{
        "lineType":"none",
        "orientation": "top",
        "align":"middle"}
    }
  );

const renderInit = function(){
    //Setup a inner group to avoid any elements drawing outside the svg.
    const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('id', 'maingroup');

    g.append('defs').append('clipPath')
    .attr('id', 'clip')
    .append('rect')
    .attr('width', innerWidth)
    .attr('height', innerHeight);

    g.append('rect').attr('id', 'background')
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .style('fill', '#ddd');
        
    let yAxisGroup = g.append('g')
    .attr('id', 'yaxis');

    let xAxisGroup = g.append('g')
    .attr('transform', `translate(${0}, ${innerHeight})`)
    .attr('id', 'xaxis');

    yAxisGroup.append('text')
    .attr('font-size', '2em')
    .attr('transform', `rotate(-90)`)
    .attr('x', -innerHeight / 2)
    .attr('y', -60)
    .attr('fill', 'black')
    .text(yAxisLabel)
    .attr('text-anchor', 'middle')

    let focus = g.append('g')
    .attr('id', 'focus')
    .style('display', 'none');

    focus.append('line').attr('id', 'lineHover')
    .style('stroke', 'steelBlue')
    .attr('stroke-width', '2px')
    .attr('stroke-dasharray', '4')
    .style('shape-rendering', 'crispEdges')
    .style('opacity', 0.5)
    .attr('y1', innerHeight)
    .attr('y2', 0);

    focus.append('text').attr('id', 'lineHoverDate')
    .attr('text-anchor', 'middle')
    .attr('font-size', 12)
    .style('fill', 'steelBlue');

    let overlay = g.append('rect')
    .attr('id', 'overlay')
    //.attr('x', 0)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .style('fill', 'none')
    .style('pointer-events', 'all');

    //Create context group
    const context = svg.append('g')
    .attr('transform', `translate(${contextMargin.left}, ${contextMargin.top})`)
    .attr('id', 'contextGroup');

    let xAxisContextGroup = context.append('g')
    .attr('id', 'xAxisContext')
    .attr('transform', `translate(${0}, ${contextHeight})`);

    context.append('g')
    .attr('id', 'brush');
};

const renderUpdate = function(data, keyValue){
    const g = d3.select('#maingroup');
    const context = d3.select('#contextGroup');
    const brushG = d3.selectAll('#brush');

    let curves = keyValue.map(function(id) {
        return {
            id: id,
            values: data.map(d => {return {time: d.Date, rates: d[id]}})
        }
    });
    
    // prepare scale
    xScale = d3.scaleTime()
    .domain([
        d3.min(curves, d => d3.min(d.values, f => f.time)),
        d3.max(curves, d => d3.max(d.values, f => f.time))
    ])
    .range([0, innerWidth])
    //.nice();
    
    yScale = d3.scaleLinear()
    .domain([
        d3.min(curves, d => d3.min(d.values, f => f.rates)),
        d3.max(curves, d => d3.max(d.values, f => f.rates))
    ].reverse())
    .range([0, innerHeight])
    .nice();

    xScaleContext = d3.scaleTime()
    .domain(xScale.domain())
    .range([0, contextWidth])
    //.nice();

    yScaleContext = d3.scaleLinear()
    .domain(yScale.domain())
    .range([0, contextHeight])
    .nice();
    
   // Adding axis; 
    const yAxis = d3.axisLeft(yScale)
    .tickSize(-innerWidth)
    .tickPadding(10); 
    
    const xAxis = d3.axisBottom(xScale)
    .tickSize(-innerHeight)
    .tickPadding(10);

    const xAxisContext = d3.axisBottom(xScaleContext)
    .tickPadding(10);

    // Create axis
    
    g.selectAll('#yaxis').transition()
    .duration(aduration)
    .call(yAxis);

    g.selectAll('#xaxis').transition()
    .duration(aduration)
    .call(xAxis);

    context.selectAll('#xAxisContext').transition()
    .duration(aduration)
    .call(xAxisContext);

    // Draw main series
    const line = d3.line()
    .curve(d3.curveCardinal.tension(0.5))
    .x(d => xScale(d.time)).y(d => yScale(d.rates));

    const series = svg.select('#maingroup').selectAll('#curves').data(curves);
    series.exit().remove();
    series.enter().append('g').append('path').merge(series)
    .style('stroke', d => color[d.id])
    .attr('stroke-width', '2px')
    .attr('fill', 'none')
    .attr('id', 'curves')
    .attr('clip-path', 'url(#clip)')
    //.transition().duration(aduration)
        .attr('d', d => line(d.values));

    // Draw context series sample
    const contextLine = d3.line()
    .curve(d3.curveCardinal.tension(0.5))
    .x(d => xScaleContext(d.time)).y(d => yScaleContext(d.rates));

    const contextSeries = svg.select('#contextGroup').selectAll('#contextCurves').data(curves);
    contextSeries.exit().remove();
    contextSeries.enter().append('g').append('path').merge(contextSeries)
    .style('stroke', d => color[d.id])
    .attr('stroke-width', '1px')
    .attr('fill', 'none')
    .attr('id', 'contextCurves')
    //.transition().duration(aduration)
        .attr('d', d => contextLine(d.values));

    // prepare brush component

    const brushed = function (selection) {
        if (selection) {
            const selectedDomain = selection.map(xScaleContext.invert, xScaleContext);
            currTimeRange = selectedDomain;
            xScale.domain(selectedDomain);
        } else {
            currTimeRange = xScaleContext.domain();
            xScale.domain(xScaleContext.domain());
        }
        g.selectAll('#curves')
        //.transition().duration(aduration)
            .attr('d', d => line(d.values));

        g.selectAll('#xaxis')
        .transition().duration(aduration)
            .call(xAxis);

        const makeAnnotations = d3.annotation()
        .type(type)
        //Gives you access to any data objects in the annotations array
        .accessors({ 
            x: function(d){ return xScale(new Date(d.x))},
            y: function(d){ return yScale(d.y) }
        })
        .annotations(annotations)
        .textWrap(100);

        d3.selectAll('#annotation-group').remove();

        d3.select("#maingroup")
        .append("g")
        .attr("id", "annotation-group")
        .attr('clip-path', 'url(#clip)')
        .call(makeAnnotations);
    };

    const brush = d3.brushX()
    .extent([[0, 0], [contextWidth, contextHeight]])
    .on('brush', ({selection}) => {
        if (selection) brushed(selection);
    })
    .on('end', ({selection}) => {
        if(!selection) brushed(null);
    });

    const defaultBrushSelection = [xScaleContext(currTimeRange[0]), xScaleContext(currTimeRange[1])];
    brushG.call(brush).call(brush.move, defaultBrushSelection);

    // draw legend
    
    d3.select('#maingroup').selectAll('.legend').remove();
    let legend = d3.select('#maingroup').selectAll(".legend")
    .data(keyValue).join('g')
    .attr("class", "legend")
    .attr("transform", (d, i) => `translate(${innerWidth + 10}, ${i * 50 + 300})`);
    
    // draw legend colored rectangles
    legend.append("rect") 
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 60)
    .attr("height", 2.5)
    .style("fill", d => color[d]);
    
    // draw legend text
    legend.append("text")
    .attr("x", 0)
    .attr("y", 15)
    .attr("dy", ".5em")
    .attr("text-anchor", "start")
    .attr('font-size', '12px')
    .text(d => labelName[d]);

    //console.log(xScale.domain());
    tooltip(data, keyValue);

    
};

const tooltip = function(data, keyValue) {
    let focus = d3.selectAll('#focus');

    focus.selectAll('#lineHoverText').remove();
    let text = focus.selectAll('#lineHoverText').data(keyValue)

        text.enter().append('text')
        .attr('id', 'lineHoverText')
        .style('fill', d => color[d])
        .attr('text-anchor', 'start')
        .attr('font-size', 20)
        //.attr('dy', (d, i) => i * 2 + 'em')
        .merge(text);

    focus.selectAll('#hoverCircle').remove();
    let points = focus.selectAll('#hoverCircle').data(keyValue)

        points.enter().append('circle')
        .attr('id', 'hoverCircle')
        .style('fill', 'none')
        .style('stroke', d => color[d])
        .attr('r', 5)
        .merge(points);
    
    d3.selectAll('#overlay')
        .on('mouseover', function() {focus.style('display', 'initial')})
        .on('mouseout', function() {focus.style('display', 'none')})
        .on('mousemove', function(event) {
            let x0 = xScale.invert(d3.pointer(event)[0]);
            let bisectDate = d3.bisector(d => d.Date).left;
            let index = bisectDate(data, x0);
            let d = data[index];

            focus.selectAll('#lineHover')
            .attr('transform', `translate(${xScale(d.Date)}, ${0})`);

            const formatTime = d3.timeFormat('%b %Y');
            focus.select('#lineHoverDate')
            .attr('transform', `translate(${xScale(d.Date)}, ${innerHeight})`)
            .attr('font-size', '20px')
            .text(formatTime(d.Date));

            focus.selectAll('#hoverCircle')
            .attr('cx', xScale(d.Date))
            .attr('cy', e => yScale(d[e]))

            focus.selectAll('#lineHoverText')
            .attr('transform', e => `translate(${xScale(d.Date)}, ${yScale(d[e]) - 15})`)
            .text(e => d[e] + '%')
        }); 
};

d3.csv('https://jgbyc.github.io/DataVis/unemployment_data_us.csv').then(function(data){
    data.forEach(datum => {
        // pre-process the data; 
        datum.Date = new Date(+(datum.Year), month[datum.Month]);
        datum.Primary_School = +(datum.Primary_School);
        datum.High_School = +(datum.High_School);
        datum.Associates_Degree = +(datum.Associates_Degree);
        datum.Professional_Degree = +(datum.Professional_Degree);
        datum.White = +(datum.White);
        datum.Black = +(datum.Black);
        datum.Asian = +(datum.Asian);
        datum.Hispanic = +(datum.Hispanic);
        datum.Men = +(datum.Men);
        datum.Women = +(datum.Women);
    });

    // sort the data in chronologically
    data = data.sort((a, b) => a.Date - b.Date);

    // Call init function to setup the structure of whole chart
    renderInit();

    // Update the chart
    renderUpdate(data, keyValue);

    // Update the chart if checkbox get changed.
    d3.selectAll('#checkBox')
    .on('change', function() {
        let checkboxes = document.getElementsByName('key');
        keyValue = [];
        for (var i=0; i<checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                keyValue.push(checkboxes[i].value);
            }
        }
        renderUpdate(data, keyValue);
    });
});
