
nv.models.mekko = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0} // set for xCategory
    , width = 960
    , height = 500
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , x = d3.scale.linear()
    , y = d3.scale.linear()
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
    , color = nv.utils.defaultColor()
    , barColor = null // adding the ability to set the color for each rather than the whole group
    , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
    , stacked = false
    , showValues = false
    , valuePadding = 60
    , valueFormat = d3.format(',.2f')
    , delay = 1200
    , xDomain
    , yDomain
    , xRange
    , yRange
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0 //used to store previous scales
      ;

  //============================================================


  function chart(selection) {
        selection.each(function(data) {
          var availableWidth = width - margin.left - margin.right,
              availableHeight = height - margin.top - margin.bottom,
              container = d3.select(this);
        //console.log(availableWidth); console.log(availableHeight);
        data = layoutMekko(data)
        //console.log(data);

        // temp hack
        barColor = function(d,i) { return palettes['mekko'][d.seriesIndex % palettes['mekko'].length] }; // Test
        //console.log(barColor);
      //------------------------------------------------------------
      // Setup Scales

      x.domain(xDomain || [0,data.value]);
      x.range(xRange || [0, availableWidth]);

      y.domain(yDomain || [1,0])
      y.range(yRange || [0,availableHeight]);

      x0 = x0 || x;
      y0 = y0 || y;

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-multibarHorizontal').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibarHorizontal');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');
      gEnter.append('g').attr('class', 'nv-groups');
      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // New group to show horizontal values
      var xCat = d3.select(this).selectAll('g.xCat-wrap').data([data]);
      var xCatEnter = xCat.enter().append('g').attr('class','xCat-wrap');
      xCat.attr('transform', 'translate(' + margin.left + ',0)'); // may configure
      var xCatBar = xCat.selectAll('g.x-bar').data(function(d) { return d.values });
      xCatBar.exit().remove();
      var xCatBarEnter = xCatBar.enter().append('g')
        .attr('class', 'x-bar')
          .attr('transform', function(d,i) {
              return 'translate(' + x0(ƒ('x')) + ',0)' // only move on x-axis
          })
          .style('stroke-opacity', 1)
          .style('fill-opacity', .75);

    var xCatBarHeight = (margin.top-10); // need to configure

      xCatBarEnter.append('rect')
        .attr('width', 0 )
        .attr('height', 0 )
        //.style('fill', function(d,i,j){ return color(d, i) }) //Moved here to change colour for each value
        .style('stroke', function(d,i) { return '#fff'; });

    xCatBarEnter.append('text');
        xCatBar.select('text')
            .attr('text-anchor', 'middle')
            .attr('y', xCatBarHeight/2 )
            .attr('dy', '.32em')
            //.text(function(d,i) { return valueFormat(getY(d,i)) })
            .style('stroke', function(d,i) { return '#fff'; })
            .style('stroke-width', function(d,i) { return '0.8'; })
            .text(function(d,i) { return d.display })
        xCatBar.transition()
          .select('text')
            .attr('x', function(d,i) {  return  x(d.value/2) })
        //20150119 must run after labels have been rendered
        xCatBar.selectAll('text').style('opacity',function(d,i){ // console.log(this.getComputedTextLength()); console.log(x(d.value));
            return (this.getComputedTextLength()>x(d.value)) ? 0 : 1; // height check not relevant and breaking IE
        });

        if (barColor) {
            xCatBar
            .style('fill', function(d,i) { return barColor(d,i); });
        }

        xCatBar.transition()
            .attr('transform', function(d,i) {
              return 'translate(' + x(d.x) + ',0)'
          })
          .select('rect')
            .attr('width', function(d){ return x(d.value); } )
            .attr('height', function(d){ return xCatBarHeight; }  );

            xCatBar
                .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
                  d3.select(this).classed('hover', true);
                  dispatch.elementMouseover({
                    value: d.value,
                    point: d,
                    series: data['values'][d.seriesIndex],
                    pos: [ x(getX(d,i)), 0 ],
                    pointIndex: i,
                    seriesIndex: d.seriesIndex,
                    e: d3.event,
                    key : d.key,
                    x : d.display,
                    y : (d.value/data.value)
                  });
                })
                .on('mouseout', function(d,i) {
                  d3.select(this).classed('hover', false);
                  dispatch.elementMouseout({
                    value: d.value,
                    point: d,
                    series: data['values'][d.seriesIndex],
                    pointIndex: i,
                    seriesIndex: d.series,
                    e: d3.event
                  });
                })

      //------------------------------------------------------------

      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
          .data(function(d) { return d.values }, function(d,i) { return i });
      groups.enter().append('g')
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6);
      groups.exit().transition()
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6)
          .remove();
      groups
          .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
          .classed('hover', function(d) { return d.hover })
          //.style('fill', function(d,i){ return color(d, i) })
          //.style('stroke', function(d,i){ return color(d, i) });
      groups.transition()
          .style('stroke-opacity', 1)
          .style('fill-opacity', .75);


      var bars = groups.selectAll('g.nv-bar')
          .data(function(d) { return d.values });

      bars.exit().remove();

      var barsEnter = bars.enter().append('g')
        .attr('class', 'nv-bar')
          .attr('transform', function(d,i,j) {
              return 'translate(' + x0(ƒ('x')) + ',' + y0(ƒ('y')) + ')'
          });

      barsEnter.append('rect')
          .attr('width', 0 )
          .attr('height', 0 )
          //.style('fill', function(d,i,j){ return color(d, i) }) //Moved here to change colour for each value
          .style('stroke', function(d,i,j) { return '#fff'; });

      bars
          .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
            d3.select(this).classed('hover', true);
            dispatch.elementMouseover({
              value: d.value,
              point: d,
              series: data['values'][d.seriesIndex],
              pos: [ x(getX(d,i)), y(getY(d,i)) ],
              pointIndex: i,
              seriesIndex: d.seriesIndex,
              e: d3.event,
              key : data['values'][d.seriesIndex].display,
              x : d.display,
              y : d.dy
            });
          })
          .on('mouseout', function(d,i) {
            d3.select(this).classed('hover', false);
            dispatch.elementMouseout({
              value: d.value,
              point: d,
              series: data['values'][d.seriesIndex],
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
          })
          .on('click', function(d,i) {
            dispatch.elementClick({
                value: d.value,
                point: d,
                series: data['values'][d.seriesIndex],
                pos: [ x(getX(d,i)), y(getY(d,i)) ],
                pointIndex: i,
                seriesIndex: d.seriesIndex,
                e: d3.event
            });
            d3.event.stopPropagation();
          })
          .on('dblclick', function(d,i) {
            dispatch.elementDblClick({
                value: d.value,
                point: d,
                series: data['values'][d.seriesIndex],
                pos: [ x(getX(d,i)), y(getY(d,i)) ],
                pointIndex: i,
                seriesIndex: d.seriesIndex,
                e: d3.event
            });
            d3.event.stopPropagation();
          });


     barsEnter.append('text');

     if (showValues) { //20150119 added to provide labels
        bars.select('text')
            .attr('text-anchor', 'middle')
            .attr('y',  function(d,i) { return y(1-d.dy/2);})
            .attr('dy', '.32em')
            //.text(function(d,i) { return valueFormat(getY(d,i)) })
            .text(function(d,i) { return d.display })
        bars.transition()
          .select('text')
            .attr('x', function(d,i) {  return  x(d.dx/2) })
        //20150119 must run after labels have been rendered
        bars.selectAll('text').style('opacity',function(d,i){ //console.log(this.getBBox().height);
            return (this.getComputedTextLength()>x(d.dx) || (y(0)-y(d.dy))<this.getBBox().height) ? 0 : 1;
        });
      } else {
        bars.selectAll('text').text('');
    }

     /* if (barColor) {
        if (!disabled) disabled = data.map(function() { return true });
        bars
          .style('fill', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[i]   ).toString(); })
          .style('stroke', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i}).filter(function(d,i){ return !disabled[i]  })[i]   ).toString(); });
      }*/

      // Manage colur gradients - to be improved
      var colourRange = 1;
      if(data['values'][0]['values'].length>5){
          colourRange = 2;
      }

      if (barColor) {
        bars
          .style('fill', function(d,i,j) { /*console.log("Series Index: " + d.seriesIndex + " index: " + i + " Colour: " + d3.rgb(barColor(d,i)).brighter(i).toString());*/ return d3.rgb(barColor(d,i)).brighter(i/colourRange); })
          //.style('stroke', function(d,i,j) { return d3.rgb(barColor(d,i)).brighter(i/colourRange); });
          .style('stroke-width', 5)
          .style('stroke', function(d,i,j) { return '#fff'; });
      }

    bars.transition()
        .attr('transform', function(d,i) {
          return 'translate(' + x(d.x) + ',' + y(d.y+d.dy) + ')'
      })
      .select('rect')
        //.attr('width', x(ƒ('dx')) )
        //.attr('height', y(ƒ('dy')) );
        .attr('width', function(d){ return x(d.dx); } )
        .attr('height', function(d){ return y(0)-y(d.dy); }  );

      //store old scales for use in transitions on update
      x0 = x.copy();
      y0 = y.copy();

    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    x = _;
    return chart;
  };

  chart.yScale = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };

  chart.xDomain = function(_) {
    if (!arguments.length) return xDomain;
    xDomain = _;
    return chart;
  };

  chart.yDomain = function(_) {
    if (!arguments.length) return yDomain;
    yDomain = _;
    return chart;
  };

  chart.xRange = function(_) {
    if (!arguments.length) return xRange;
    xRange = _;
    return chart;
  };

  chart.yRange = function(_) {
    if (!arguments.length) return yRange;
    yRange = _;
    return chart;
  };

  chart.forceY = function(_) {
    if (!arguments.length) return forceY;
    forceY = _;
    return chart;
  };

  chart.stacked = function(_) {
    if (!arguments.length) return stacked;
    stacked = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.barColor = function(_) {
    if (!arguments.length) return barColor;
    barColor = nv.utils.getColor(_);
    return chart;
  };

  chart.disabled = function(_) {
    if (!arguments.length) return disabled;
    disabled = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.delay = function(_) {
    if (!arguments.length) return delay;
    delay = _;
    return chart;
  };

  chart.showValues = function(_) {
    if (!arguments.length) return showValues;
    showValues = _;
    return chart;
  };

  chart.valueFormat= function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.valuePadding = function(_) {
    if (!arguments.length) return valuePadding;
    valuePadding = _;
    return chart;
  };

  //============================================================


  return chart;
}



nv.models.mekkoChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var multibar = nv.models.mekko()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , legend = nv.models.legend().height(30)
    , controls = nv.models.legend().height(30)
    ;

  var margin = {top: 40, right: 20, bottom: 50, left: 60}
    , width = null
    , height = null
    , color = nv.utils.defaultColor()
    , showControls = true
    , showLegend = true
    , stacked = false
    , tooltips = true
    , tooltip = function(e, graph) {
        return '<h3>' + e.key + ' - ' + e.x + '</h3>' +
               '<p>' + rptFmtN(e.value) + ' ('+ rptFmt(e.y).trim() + ')</p>'
      }
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , state = { stacked: stacked }
    , defaultState = null
    , noData = 'No Data Available.'
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState')
    , controlWidth = function() { return showControls ? 180 : 0 }
    , transitionDuration = 250
    , xCat = 40;
    ;

  multibar
    .stacked(stacked)
    ;
  xAxis
    .orient('bottom')
    .tickPadding(5)
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(rptFmtN)
    ;
  yAxis
    .orient('left')
    .tickFormat(d3.format(',.1f'))
    ;

  controls.updateState(false);
  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        //x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
        content = tooltip(e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        //console.log(availableWidth); console.log(availableHeight); console.log(container); console.log(container.style('width')); console.log(container.style('height'));
      chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
      chart.container = this;

      //set state.disabled
      state.disabled = data.map(function(d) { return !!d.disabled });

      if (!defaultState) {
        var key;
        defaultState = {};
        for (key in state) {
          if (state[key] instanceof Array)
            defaultState[key] = state[key].slice(0);
          else
            defaultState[key] = state[key];
        }
      }

      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Scales

      x = multibar.xScale();
      y = multibar.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-multiBarHorizontalChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarHorizontalChart').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend.width(availableWidth - controlWidth());

        if (multibar.barColor())
          data.forEach(function(series,i) {
            series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
          })

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        if ( margin.top != legend.height()) {
          margin.top = legend.height();
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;
        }

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) +')');
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Controls

      if (showControls) {
        var controlsData = [
          { key: 'Grouped', disabled: multibar.stacked() },
          { key: 'Stacked', disabled: !multibar.stacked() }
        ];

        controls.width(controlWidth()).color(['#444', '#444', '#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .attr('transform', 'translate(0,' + (-margin.top) +')')
            .call(controls);
      }

      //------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      multibar
        .disabled(data.map(function(series) { return series.disabled }))
        .width(availableWidth)
        .height(availableHeight)
        .margin( { 'top' : xCat } ) // display horizontal key
        .color(data.map(function(d,i) {
          return d.color || color(d, i);
        }).filter(function(d,i) { return !data[i].disabled }))


      var barsWrap = g.select('.nv-barsWrap')
          .datum(data.filter(function(d) { return !d.disabled }))

      barsWrap.transition().call(multibar);

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Axes

      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize( -availableHeight, 0);

        g.select('.nv-x.nv-axis')
            .attr('transform', 'translate(0,' + availableHeight + ')');
      g.select('.nv-x.nv-axis').transition()
          .call(xAxis);

      var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

      xTicks
          .selectAll('line, text')
          .style('opacity', 1)

      yAxis
        .scale(y)
        .ticks( availableHeight / 24 )
        .tickSize(-availableWidth, 0);

        g.select('.nv-y.nv-axis')
            .attr('transform', 'translate(0,' + xCat + ')');
      g.select('.nv-y.nv-axis').transition()
          .call(yAxis);

      //------------------------------------------------------------



      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      legend.dispatch.on('stateChange', function(newState) {
        state = newState;
        dispatch.stateChange(state);
        chart.update();
      });

      controls.dispatch.on('legendClick', function(d,i) {
        if (!d.disabled) return;
        controlsData = controlsData.map(function(s) {
          s.disabled = true;
          return s;
        });
        d.disabled = false;

        switch (d.key) {
          case 'Grouped':
            multibar.stacked(false);
            break;
          case 'Stacked':
            multibar.stacked(true);
            break;
        }

        state.stacked = multibar.stacked();
        dispatch.stateChange(state);

        chart.update();
      });

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      // Update chart from a state object passed to event handler
      dispatch.on('changeState', function(e) {

        if (typeof e.disabled !== 'undefined') {
          data.forEach(function(series,i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        if (typeof e.stacked !== 'undefined') {
          multibar.stacked(e.stacked);
          state.stacked = e.stacked;
        }

        selection.call(chart);
      });
      //============================================================


    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  multibar.dispatch.on('elementMouseover.tooltip', function(e) {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  multibar.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);
  });
  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.multibar = multibar;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, multibar, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'clipEdge', 'id', 'delay', 'showValues', 'valueFormat', 'stacked', 'barColor');

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    legend.color(color);
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.tooltip = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.state = function(_) {
    if (!arguments.length) return state;
    state = _;
    return chart;
  };

  chart.defaultState = function(_) {
    if (!arguments.length) return defaultState;
    defaultState = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  chart.transitionDuration = function(_) {
    if (!arguments.length) return transitionDuration;
    transitionDuration = _;
    return chart;
  };
  //============================================================


  return chart;
}
