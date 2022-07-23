// get main SVG and its attributes & setting hyper-parameters; 
const svg = d3.select('#mainsvg');
const width = +svg.attr('width');
const height = +svg.attr('height');
const margin = {top: 100, right: 120, bottom: 100, left: 120};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;
//const xValue = d => d.Date; 
//const yValue = d => d.High_School;
//const rValue = d => 10;
const keyValue = ["Primary_School", "High_School", "Associates_Degree"];
let xScale, yScale;
let maxX, maxY;
let line;
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
    "Primary_School":"#ff1c12",
    "High_School": "#de5991",
    "Associates_Degree": "#759AA0",
    "Professional_Degree": "#E69D87",
    "White": "#be3259",
    "Black": "#EA7E53",
    "Asian": "#EEDD78",
    "Hispanic": "#9359b1",
    "Men": "#47c0d4",
    "Women": "#F49F42"
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

const renderinit = function(){
    //Setup a innergroup to avoid any elements drawing outside the svg.
    const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)
    .attr('id', 'maingroup');

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
    .attr('fill', '#333333')
    .text(yAxisLabel)
    .attr('text-anchor', 'middle') // Make label at the middle of axis. 

    xAxisGroup.append('text')
    .attr('font-size', '2em')
    .attr('y', 60)
    .attr('x', innerWidth / 2)
    .attr('fill', '#333333')
    .text(xAxisLabel);

    let focus = g.append('g')
    .attr('id', 'focus')
    .style('display', 'none');

    focus.append('line').attr('id', 'lineHover')
    .style('stroke', '#999')
    .attr('stroke-width', 1)
    .style('shape-rendering', 'crispEdges')
    .style('opacity', 0.5)
    .attr('y1', innerHeight)
    .attr('y2', 0);

    focus.append('text').attr('id', 'lineHoverDate')
    .attr('text-ancor', 'middle')
    .attr('font-size', 12);

    let overlay = g.append('rect')
    .attr('id', 'overlay')
    //.attr('x', 0)
    .attr('width', innerWidth)
    .attr('height', innerHeight)
    .style('fill', 'none')
    .style('pointer-events', 'all');
};

const renderupdate = function(data, keyValue){
    const g = d3.select('#maingroup');

    let curves = keyValue.map(function(id) {
        return {
            id: id,
            values: data.map(d => {return {time: d.Date, rates: d[id]}})
        }
    });

    console.log(curves);
    
    // prepare scale
    xScale = d3.scaleTime()
    .domain([
        d3.min(curves, d => d3.min(d.values, f => f.time)),
        d3.max(curves, d => d3.max(d.values, f => f.time))
    ])
    .range([0, innerWidth])
    .nice();
    
    yScale = d3.scaleLinear()
    .domain([
        d3.min(curves, d => d3.min(d.values, f => f.rates)),
        d3.max(curves, d => d3.max(d.values, f => f.rates))
    ].reverse())
    .range([0, innerHeight])
    .nice();
    
   // Adding axes; 
    const yAxis = d3.axisLeft(yScale)
    .tickSize(-innerWidth)
    .tickPadding(10); 
    
    const xAxis = d3.axisBottom(xScale)
    .tickSize(-innerHeight)
    .tickPadding(10);
    
    g.selectAll('#yaxis').transition()
    .duration(aduration)
    .call(yAxis);

    g.selectAll('#xaxis').transition()
    .duration(aduration)
    .call(xAxis);

    // Draw line series
    const line = d3.line()
    .curve(d3.curveCardinal.tension(0.5))
    .x(d => xScale(d.time)).y(d => yScale(d.rates));

    const series = svg.select('#maingroup').selectAll('.curves').data(curves);
    series.exit().remove();
    series.enter().append("g").append('path').merge(series)
    .style("stroke", d => color[d.id])
    .attr('stroke-width', '5px')
    .attr('fill', 'none')
    .attr('id', 'curves')
    .transition().duration(aduration)
        .attr("d", d => line(d.values));


    // add lengend
    
    let legend_text = keyValue;
    //console.log(legend_text);
    
    // draw legend
    var legend = d3.select('#maingroup').selectAll(".legend")
    .data(legend_text).join('g')
    .attr("class", "legend")
    .attr("transform", function(d, i) { return "translate(" + (innerWidth + 10) + "," + (i * 50 + 300) + ")"; });
    
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

    tooltip(data, keyValue);    
};

const tooltip = function(data, keyValue) {
    var focus = d3.selectAll('#focus');

    let text = focus.selectAll('#lineHoverText').data(keyValue)

        text.enter().append('text')
        .attr('id', 'lineHoverText')
        .style('fill', d => color[d])
        .attr('text-anchor', 'start')
        .attr('font-size', 12)
        .attr('dy', (d, i) => i * 2 + 'em')
        .merge(text);

    let points = focus.selectAll('#hoverCircle').data(keyValue)

        points.enter().append('circle')
        .attr('id', 'hoverCircle')
        .style('fill', d => color[d])
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
            .attr('transform', 'translate(' + xScale(d.Date) + ',' + 0 + ')');

            const formatTime = d3.timeFormat('%b %Y');
            focus.select('#lineHoverDate')
            .attr('transform', 'translate(' + xScale(d.Date) + ',' + innerHeight + ')')
            .attr('font-size', '20px')
            .text(formatTime(d.Date));

            focus.selectAll('#hoverCircle')
            .attr('cx', xScale(d.Date))
            .attr('cy', e => yScale(d[e]))
            .attr('r', 10);

            focus.selectAll('#lineHoverText')
            .attr('transform', 'translate(' + xScale(d.Date) + ',' + innerHeight / 2 + ')')
            .text(e => 'Unemployment Rate of ' + labelName[e] + ' ' + d[e])
            .attr('font-size', '20px');
        });

    
};

d3.csv('https://jgbyc.github.io/DataVis/unemployment_data_us.csv').then(function(data){
    console.log(data);
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


    renderinit();
    renderupdate(data, keyValue);

    

});