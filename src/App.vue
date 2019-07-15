<template>
  <div id="tree" class="tree">
    <span class="range">
      <label for="range-slider" class="range-label">Tree Animation Timer ( {{ duration }}ms )</label>
      <input name="range-slider" class="range-slider" type="range" min="1" max="1000" v-model="duration">
    </span>
    <transition name="list-complete">
      <div class="form" v-if="selectedNode && !draggingNode">
        <div class="form-header">
          <div class="form-header-input">
            <input
              ref="parentInput"
              type="text"
              class="form-header-title title"
              v-model="form.parent.name"
              :readonly="!editMode"
            />
            <div class="form-header-icons">
              <span>
                <i class="fa fa-pen" @click="changeEditMode(true)" v-if="!editMode" />
                <i class="fa fa-check" @click="editParent" v-else />
              </span>
              <span>
                <i class="fas fa-trash" @click="removeNode" />
              </span>
            </div>
          </div>
          <Form-icons
            v-if="editMode"
            :icons="icons"
            :selected-icon="form.parent.icon"
            @setIcon="icon => setIcon(icon, 'parent')"
          />
        </div>
        <div class="form-content">
          <div class="form-item">
            <label class="form-item-title title">Child Name</label>
            <input
              class="form-item-input input child-name"
              v-model="form.child.name"
              type="text"
              @change="editParent"
            />
          </div>
          <Form-icons
            :icons="icons"
            :selected-icon="form.child.icon"
            @setIcon="icon => setIcon(icon, 'child')"
          />
        </div>
        <div class="form-footer">
          <button
            class="form-button"
            :disabled="!form.child.icon || !form.child.name"
            @click="addNode"
          >Add</button>
        </div>
      </div>
    </transition>
    <div
      id="background"
      :class="['background', {'background-darken': !!selectedNode}]"
      :style="!selectedNode ? 'pointer-events: none;' : null"
      @click="selectedNode = null"
    ></div>
    <div id="tree-container"></div>
  </div>
</template>

<script>
import * as d3 from "d3";
import initialTreeData from "./tree-data";
import FormIcons from "./components/form-icons";

export default {
  name: "app",
  components: { FormIcons },
  data() {
    return {
      editMode: false,
      icons: [
        "burn",
        "superscript",
        "briefcase-medical",
        "pager",
        "sitemap",
        "object-ungroup",
        "reddit-square",
        "allergies",
        "angry",
        "bolt"
      ],
      form: {
        parent: {
          name: "",
          icon: ""
        },
        child: {
          name: "",
          icon: ""
        }
      },
      selectedNode: null,
      totalNodes: 0,
      maxLabelLength: 0,
      inDragNode: null,
      draggingNode: null,
      duration: 500,
      root: null,
      treeData: {}
    };
  },
  created() {},
  watch: {
    "form.parent"() {
      this.changeEditMode(false);
    }
  },
  methods: {
    focus(ref = this.$refs.parentInput) {
      this.$nextTick(() => ref.focus());
    },
    changeEditMode(bool) {
      this.editMode = bool;
      if (this.editMode) this.focus();
    },
    setIcon(icon, who) {
      this.form[who].icon = icon;
    },
    addNode() {
      if (!this.selectedNode.children) this.selectedNode.children = [];
      const hasAllready = this.selectedNode.children.some(
        item => item.name === this.form.child.name
      );
      if (hasAllready) return;
      this.selectedNode.children.push({
        name: this.form.child.name,
        icon: this.form.child.icon,
        children: []
      });
      this.update(this.root);
      this.$nextTick(() => (this.selectedNode = null));
    },

    removeNode() {
      if (!this.selectedNode.parent) return;
      const parent = this.selectedNode.parent;
      const children = this.selectedNode.children;
      const childIndex = parent.children.indexOf(this.selectedNode);
      parent.children.splice(childIndex, 1);
      this.update(this.root);
      this.selectedNode = null
    },
    editParent() {
      this.update(this.root);
      this.changeEditMode(false);
    },
    clearChildName() {
      this.form.child.name = "";
    },
    visit(parent, visitFn, childrenFn) {
      if (!parent) return;

      visitFn(parent);

      const children = childrenFn(parent);
      if (children) {
        let count = children.length;
        for (let i = 0; i < count; i++) {
          this.visit(children[i], visitFn, childrenFn);
        }
      }
    }
  },

  mounted() {
    const self = this;
    this.treeData = initialTreeData;
    let i = 0;

    // size of the diagram
    let viewerWidth = document.documentElement.clientWidth;
    let viewerHeight = document.documentElement.clientHeight;

    let tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    let diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

    // Call visit function to establish this.maxLabelLength
    self.visit(
      this.treeData,
      d => {
        self.totalNodes++;
        self.maxLabelLength = Math.max(d.name.length, self.maxLabelLength);
      },
      d => (d.children && d.children.length > 0 ? d.children : null)
    );

    // sort the tree according to the node names

    function sortTree() {
      tree.sort(function(a, b) {
        return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
      });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();
    // Define the zoom function for the zoomable tree

    function zoom() {
      svgGroup.attr(
        "transform",
        "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")"
      );
    }

    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    let zoomListener = d3.behavior
      .zoom()
      .scaleExtent([0.1, 3])
      .on("zoom", zoom);

    function initiateDrag(d, domNode) {
      self.draggingNode = d;
      d3.select(domNode)
        .select(".ghostCircle")
        .attr("pointer-events", "none");
      d3.selectAll(".ghostCircle").attr("class", "ghostCircle show");
      d3.select(domNode).attr("class", "node activeDrag");

      svgGroup.selectAll("g.node").sort(function(a, b) {
        // select the parent and sort the path's
        if (a.id != self.draggingNode.id) return 1;
        // a is not the hovered element, send "a" to the back
        else return -1; // a is the hovered element, bring "a" to the front
      });
      // if nodes has children, remove the links and nodes
      let nodes = tree.nodes(d);
      if (nodes.length > 1) {
        // remove link paths
        let links = tree.links(nodes);
        let nodePaths = svgGroup
          .selectAll("path.link")
          .data(links, function(d) {
            return d.target.id;
          })
          .remove();
        // remove child nodes
        let nodesExit = svgGroup
          .selectAll("g.node")
          .data(nodes, function(d) {
            return d.id;
          })
          .filter(function(d, i) {
            if (d.id == self.draggingNode.id) {
              return false;
            }
            return true;
          })
          .remove();
      }

      // remove parent link
      let parentLink = tree.links(tree.nodes(self.draggingNode.parent));
      svgGroup
        .selectAll("path.link")
        .filter(function(d, i) {
          if (d.target.id == self.draggingNode.id) {
            return true;
          }
          return false;
        })
        .remove();
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    const baseSvg = d3
      .select("#tree-container")
      .append("svg")
      .attr("width", viewerWidth)
      .attr("height", viewerHeight)
      .attr("class", "overlay")
      .call(zoomListener);

    // Define the drag listeners for drag/drop behaviour of nodes.
    let dragListener = d3.behavior
      .drag()
      .on("dragstart", function(d) {
        if (d == self.root) {
          return;
        }
        let dragStarted = true;
        let nodes = tree.nodes(d);
        d3.event.sourceEvent.stopPropagation();
      })
      .on("drag", function(d) {
        if (d == self.root) {
          return;
        }

        let domNode = this;
        initiateDrag(d, domNode);

        d.x0 += d3.event.dy;
        d.y0 += d3.event.dx;
        let node = d3.select(this);
        node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
        updateTempConnector();
      })
      .on("dragend", function(d) {
        if (d == self.root) {
          return;
        }
        if (self.inDragNode) {
          // now remove the element from the parent, and insert it into the new elements children
          let index = self.draggingNode.parent.children.indexOf(
            self.draggingNode
          );
          if (index > -1) {
            self.draggingNode.parent.children.splice(index, 1);
          }
          if (
            typeof self.inDragNode.children !== "undefined" ||
            typeof self.inDragNode._children !== "undefined"
          ) {
            if (typeof self.inDragNode.children !== "undefined") {
              self.inDragNode.children.push(self.draggingNode);
            } else {
              self.inDragNode._children.push(self.draggingNode);
            }
          } else {
            self.inDragNode.children = [];
            self.inDragNode.children.push(self.draggingNode);
          }
          // Make sure that the node being added to is expanded so user can see added node is correctly moved
          sortTree();
          endDrag();
        } else {
          endDrag();
        }
      });

    function endDrag() {
      let domNode = this;
      self.inDragNode = null;
      d3.selectAll(".ghostCircle").attr("class", "ghostCircle");
      d3.select(domNode).attr("class", "node");
      // now restore the mouseover event or we won't be able to drag a 2nd time
      d3.select(domNode)
        .select(".ghostCircle")
        .attr("pointer-events", "");
      updateTempConnector();
      if (self.draggingNode !== null) {
        update(self.root);
        centerNode(self.draggingNode);
        self.draggingNode = null;
      }
    }

    let overCircle = function(d) {
      self.inDragNode = d;
      updateTempConnector();
    };
    let outCircle = function(d) {
      self.inDragNode = null;
      updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    let updateTempConnector = function() {
      let data = [];
      if (self.draggingNode !== null && self.inDragNode !== null) {
        // have to flip the source coordinates since we did this for the existing connectors on the original tree
        data = [
          {
            source: {
              x: self.inDragNode.y0,
              y: self.inDragNode.x0
            },
            target: {
              x: self.draggingNode.y0,
              y: self.draggingNode.x0
            }
          }
        ];
      }
      let link = svgGroup.selectAll(".templink").data(data);

      link
        .enter()
        .append("path")
        .attr("class", "templink")
        .attr("d", d3.svg.diagonal())
        .attr("pointer-events", "none");

      link.attr("d", d3.svg.diagonal());

      link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
      let scale = zoomListener.scale();
      let x = -source.y0;
      let y = -source.x0;
      x = x * scale + viewerWidth / 2 - 200;
      y = y * scale + viewerHeight / 2 + 50;
      d3.select("g")
        .transition()
        .duration(self.duration)
        .attr(
          "transform",
          "translate(" + x + "," + y + ")scale(" + scale + ")"
        );
      zoomListener.scale(scale);
      zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else if (d._children) {
        d.children = d._children;
        d._children = null;
      }
      return d;
    }

    // Toggle children on click.

    function click(d) {
      self.selectedNode = d;
      if (d3.event.defaultPrevented) return; // click suppressed
      self.form.parent = d;
      // d = toggleChildren(d);
      update(d);
      centerNode(d);
    }

    function update(source) {
      // Compute the new height, function counts total children of root node and sets tree height accordingly.
      // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
      // This makes the layout more consistent.
      let levelWidth = [1];
      let childCount = function(level, n) {
        if (n.children && n.children.length > 0) {
          if (levelWidth.length <= level + 1) levelWidth.push(0);

          levelWidth[level + 1] += n.children.length;
          n.children.forEach(function(d) {
            childCount(level + 1, d);
          });
        }
      };
      childCount(0, self.root);
      let newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
      tree = tree.size([newHeight, viewerWidth]);

      // Compute the new tree layout.
      let nodes = tree.nodes(self.root).reverse(),
        links = tree.links(nodes);

      // Set widths between levels based on this.maxLabelLength.
      nodes.forEach(function(d) {
        d.y = d.depth * (self.maxLabelLength * 10); //this.maxLabelLength * 10px
        // alternatively to keep a fixed scale one can set a fixed depth per level
        // Normalize for fixed-depth by commenting out below line
        // d.y = (d.depth * 500); //500px per level.
      });

      // Update the nodes…
      let node = svgGroup.selectAll("g.node").data(nodes, function(d) {
        return d.id || (d.id = ++i);
      });

      // Enter any new nodes at the parent's previous position.
      let nodeEnter = node
        .enter()
        .append("g")
        .call(dragListener)
        .attr("class", "node")
        .attr("transform", function(d) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

      nodeEnter
        .append("circle")
        .attr("class", "nodeCircle")
        .attr("r", 0)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      const iconSize = 30;
      nodeEnter
        .append("svg:foreignObject")
        .attr("x", 10)
        .attr("y", -10)
        .attr("width", d => d.name.length * 6 + iconSize)
        .attr("height", 17)
        .append("xhtml:body")
        .html(d => `<label class="node-label">${d.name}</label>`)
        .style("fill-opacity", 0);

      // phantom node to give us mouseover in a radius around it

      nodeEnter
        .append("circle")
        .attr("class", "ghostCircle")
        .attr("r", 30)
        .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
        .attr("pointer-events", "mouseover")
        .on("mouseover", function(node) {
          overCircle(node);
        })
        .on("mouseout", function(node) {
          outCircle(node);
        });

      // Update the text to reflect whether node has children or not.
      node
        .select(".node-label")
        .html(
          d =>
            `<i class="fa fa-${d.icon}"></i> <label class="node-label">${d.name}</label>`
        );

      // Change the circle fill depending on whether it has children and is collapsed
      node
        .select("circle.nodeCircle")
        .attr("r", 4.5)
        .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      // Transition nodes to their new position.
      let nodeUpdate = node
        .transition()
        .duration(self.duration)
        .attr("transform", function(d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      // Fade the text in
      nodeUpdate.select("text").style("fill-opacity", 1);

      // Transition exiting nodes to the parent's new position.
      let nodeExit = node
        .exit()
        .transition()
        .duration(self.duration)
        .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      nodeExit.select("circle").attr("r", 0);

      nodeExit.select("text").style("fill-opacity", 0);

      // Update the links…
      let link = svgGroup.selectAll("path.link").data(links, function(d) {
        return d.target.id;
      });

      // Enter any new links at the parent's previous position.
      link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          let o = {
            x: source.x0,
            y: source.y0
          };
          return diagonal({
            source: o,
            target: o
          });
        });

      // Transition links to their new position.
      link
        .transition()
        .duration(self.duration)
        .attr("d", diagonal);

      // Transition exiting nodes to the parent's new position.
      link
        .exit()
        .transition()
        .duration(self.duration)
        .attr("d", function(d) {
          let o = {
            x: source.x,
            y: source.y
          };
          return diagonal({
            source: o,
            target: o
          });
        })
        .remove();

      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
    self.update = update;
    // Append a group which holds all nodes and which the zoom Listener can act upon.
    let svgGroup = baseSvg.append("g");

    // Define the root
    self.root = this.treeData;
    self.root.x0 = viewerHeight / 2;
    self.root.y0 = 0;

    // Layout the tree initially and center on the root node.
    update(self.root);
    centerNode(self.root);
  }
};
</script>

<style lang="scss">
@import "./style/main.scss";
</style>
