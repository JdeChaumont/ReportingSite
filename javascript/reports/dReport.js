//*******************************************************************************
// Report - Contructs report for inserting grids and visualisations
//
/*<div id="rpt1" class="inActiveTab">
    <div class="fullspan rptControls">
            <div class="btn-group pull-right rptPage"></div>
    </div>
    <div class="row-fluid" style="padding:5px">
        <div class="rptTitle indent">Loan Characteristics</div>
        <div class="full-width rptTitleBorder"></div>
    </div>
    <div class="rptBody indent" id="rptLoans"></div>
    <div class="rptCommentary indent">Additional commentary is placed at this point</div>
    <div class="rptFooter indent"></div>
</div>*/
//*******************************************************************************
function dReport(options){ // wraps customised nvd3 horizontal bar chart
    // Preliminary items - defaults - call base function
    var defaults = {
        container : null, // div container
        controlsContainer : { 'class' : 'rptGroups rptControls fullspan' },
        controls : [],
        titleContainer : { 'class' : 'rptGroups row-fluid', 'style' : 'padding:5px' },
        title : { 'class' : 'rptItems rptTitle indent' },  // not correct
        titleBorder : { 'class' : 'rptItems rptTitleBorder full-width' },
        body : { 'class' : 'rptGroups rptBody indent' },
        commentary : { 'class' : 'rptGroups rptCommentary indent' },
        footer : { 'class' : 'rptGroups rptFooter indent' }

    };

    // Custom extends function to address nested defaults objects
    function extendDefaults(a,b){
        var ret = {};
        for (var key in a){
            if(a.hasOwnProperty(key)){
                ret[key] = a[key];
            }
        }
        for (var key in b){
            if(b.hasOwnProperty(key)){
                if(typeof(b[key])==='object'){ //console.log(b[key]);
                    for(var k in b[key]){
                        if(!ret[key]){ ret[key] = {}; }
                        ret[key][k] = b[key][k];
                    }
                } else {
                    ret[key] = b[key];
                }
            }
        }
        return ret;
    }
    var o = ret.options = extendDefaults(defaults,options); // returns new object

    // Ensure report can be created
    var rpt = d3.select(o.container);
    if(!rpt){
        console.log('container for report not valid');
        return;
    }
    // Data for selection
    var data = [];
    // Process element
    function element(e){ // Helper function to flesh out element
        var d = {};
        d['type'] = (e['type']==null) ? 'div' : e['type'];
        d['id'] = e['id']||'';
        d['class'] = e['class']||'';
        d['style'] = e['style']||'';
        d['html'] = e['html']||'';
        if(e['children']){
            d['children'] = e['children'].map(function(e,i,a){
                return element(e);
            });
        } else {
            d['children'] = [];
        }
        return d;
    }
    // Push report components into data object
    if(o.controls.length>0){
        // create controls
        o.controlsContainer['children'] = o.controls;
        data.push(element(o.controlsContainer));
    }
    if(o.title!==''){
        // create title
        o.titleContainer['children'] = [];
        o.titleContainer['children'].push(o.title);
        o.titleContainer['children'].push(o.titleBorder);
        data.push(element(o.titleContainer));
    }
    if(o.body['id']){
        // create body
        data.push(element(o.body));
    }
    if(o.commentary['html']){
        // create commentary
        data.push(element(o.commentary));
    }
    if(o.footer['class']!==''){
        // create footer
        data.push(element(o.footer));
    }
    //console.log(data);
    // Create DOM objects
    var containers = enter(rpt,'rptGroups',data); // console.log(containers);
    var content = enter(containers,'rptItems',function(d){ return d['children']; }); // console.log(content);
    // Custom enter function to inflate DOM
    function enter(parent,identifier,data){
        var res = parent.selectAll(identifier).data(data); // console.log(res);
        var resEnter = res.enter().append('div') // did not like lifting this from type
            .attr('id',function(d){ return d['id']; })
            .attr('class',function(d){ return d['class']; })
            .attr('style',function(d){ return d['style']; })
            .text(function(d){ return d['html']; }); // console.log(res);
        return res;
    }

}
