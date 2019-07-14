
  // set the dimensions and margins of the graph
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      width = 450 - margin.left - margin.right,
      height = 480 - margin.top - margin.bottom;
  
  // append the svg object to the body of the page
  var svg = d3.select("#my_dataviz").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

  // Color scale used
  var color = d3.scaleOrdinal(d3.schemeCategory20);
  
  // Set the sankey diagram properties
  var sankey = d3.sankey()
      .nodeWidth(50)
      .nodePadding(100)
      .size([width, height]);
  // load the data
    let graph = {
    nodes:[
    {node:0, name:"node0"},
    {node:1, name:"node1"},
    {node:2, name:"node2"},
    {node:3, name:"node3"},
    {node:4, name:"node4"},
    {node:5, name:"node5"}
    ],
    links:[
    {source:0,target:1,value:1},
    {source:1,target:2,value:1},
    {source:1,target:3,value:1},
    {source:2,target:4,value:1},
    {source:2,target:5,value:1}
    ]}  
    // Constructs a new Sankey generator with the default settings.
    sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(5);
  
    // add in the links
    var link = svg.append("g")
      .selectAll(".link")
      .data(graph.links)
      .enter()
      .append("path")
        .attr("class", "link")
        .attr("d", sankey.link() )
        // .style("stroke-width", function(d) { return Math.max(1, d.dy); })
        .sort(function(a, b) { return b.dy - a.dy; });
  
    // add in the nodes
    var node = svg.append("g")
      .selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        .call(d3.drag()
          .subject(function(d) { return d; })
          .on("start", function(d) {
            this.parentNode.appendChild(this);
            console.log(d)
          })
          .on("drag", dragmove));
  
    // add the rectangles for the nodes
    node
      .append("rect")
        .attr("height", 100)
        .attr("width", sankey.nodeWidth())
        .style("fill", function(d) { return d.color = color(d.name.replace(/ .*/, "")); })
        .style("stroke", function(d) { return d3.rgb(d.color).darker(2); })
      // Add hover text
      .append("title")
        .text(function(d) { return d.name + "\n" + "There is " + d.value + " stuff in this node"; });
      // add html
      
      // node
      // .append("svg:foreignObject")
      // .attr('width', 36)
      // .attr('height', 106)
      // .append('xhtml:div')
      // .attr("class", function(d) {
      //   return "onur"
      // })
      // .append('p')
      // .attr('class', 'lead')
      // .html('Holmes was certainly not a difficult man to live with.');
        
    // add in the title for the nodes
      node
        .append("text")
          .attr("x", -6)
          .attr("y", function(d) { return d.dy / 2; })
          .attr("dy", ".35em")
          .attr("text-anchor", "end")
          .attr("transform", null)
          .text(function(d) { return d.name; })
        .filter(function(d) { return d.x < width / 2; })
          .attr("x", 6 + sankey.nodeWidth())
          .attr("text-anchor", "start");
  
    // the function for moving the nodes
    function dragmove(d) {
      d3.select(this)
        .attr("transform",
              "translate("
                 + d.x + ","
                 + (d.y = Math.max(
                    0, Math.min(height - d.dy, d3.event.y))
                   ) + ")");
      sankey.relayout();
      link.attr("d", sankey.link() );
    }

