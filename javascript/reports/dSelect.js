//*******************************************************************************
// Select Controls
//*******************************************************************************

var pathFwd = "M25 0 L25 200 L175 100 Z",
    pathBck= "M175 0 L175 200 L20 100 Z",
    viewBox = "0 0 200 200";
var svgFwd = "<svg viewbox='" + viewBox + "' fill='#fff'><path d='" + pathFwd + "' />Sorry, your browser does not support inline SVG.</svg>";
var svgBck = "<svg viewbox='" + viewBox + "' fill='#fff'><path d='" + pathBck + "' />Sorry, your browser does not support inline SVG.</svg>";

function dSelectLinear(options){ // Select control with forward, back and state
    // Preliminary items - defaults - call base function
    var defaults = { cycle : false };
    var ret = {};
    var o = ret.options = extend(defaults,options); // merge defaults and options
    var valuesMap = {};

    // Set controls - this is configuratrion really
    var ctrls = d3.selectAll('.'+o.id); //console.log(ctrls);
    var inline = "display:inline-block";
    var controls = [
        { css :  "btn btn-custom bck", style : inline, handlers : [hHelper("click",back)], text : svgBck },
        { css :  "menuDropdown", style : inline, text : "", createFn : createDD  },
        { css :  "state", style : inline, handlers : [hHelper("click",toggleDD)], text : "Default" },
        { css :  "btn btn-custom fwd", style : inline, handlers : [hHelper("click",forward)], text : svgFwd },
    ]; // console.log(controls);
    function hHelper(name,handler){
        return { "event" : name, "handler" : function(e) { return handler(); } }
    }

    function updateValue(value){
        var update = {}; console.log(value);
        update[o.id]=value; //cannot create the update object direct
        anchor.changeAnchorPart(update);
    }

    function currentPropertyValue(){
        return valuesMap[o['state'][o['id']]()]; // if map get index in array - create index to look up
    }

    function back(){
        var v = currentPropertyValue(); //console.log(v);
        if(v!==0){
            updateValue(--v);
        } else {
            if(o.cycle===true){ updateValue(o.data.length-1) }
        }
    }

    function forward(){
        var v = currentPropertyValue(); //console.log(v);
        if (v === undefined) { v = 0;};
        if(v!==(o.data.length-1)){
            updateValue(++v);
        } else {
            if(o.cycle===true){ updateValue(0) }
        }
    }

    // use later for dropdown component
    function toggleDD(){
        $('.'+o.id+' .menuContainer').toggleClass("hidden")
    }

    function createDD(el){ // Need to define depth and structure
        var elDom = $('.'+o.id+' div.'+el['css']);  console.log(el); console.log('.'+o.id+'.'+el['css']); console.log(elDom);
        var html = constructDivs(o.data);  console.log(html);
        elDom.html(html);
        elDom.click(toggleDD);
        $('.'+o.id+' td.menuItem').click(selectDimValue);
    }

    function selectDimValue(el){
        var e = d3.select(this); //console.log(e);
        updateValue(e.attr('value'));
    }

    function constructDivs(data){
        return "<table class='menuContainer hidden'>" + data.reduce(function(r,e,i,a){
            r += "<tr  class='menuRow' ><td class='menuItem' value='"  + e['value'] + "'>"+e['name']+"</td></tr>";
            return r;
        },"") + "</table>";
    }

    ret.init = function(options){
        createControls();
        o.data.forEach(function(e,i,a){
            return valuesMap[e['map']] = i;
        });
        return ret;
    }

    ret.updateState = function(stateObj,id,refNo){
        return function(){
            var v = stateObj["controls"][refNo]; console.log(v);
            $('.'+id+' div').removeClass('disabled');
            if(v==0){ $('.'+id+' div' + '.bck').addClass('disabled'); }
            if(v==(o['data'].length-1)) { $('.'+id+' div' + '.fwd').addClass('disabled'); } // did not work with ===
            $('.'+id+' div' + '.state').html(o['data'][v]['name']);
        }
    }

    // Create controls for the function
    function createControls(){
        // create the controls
        controls.forEach(function(e,i,a){
            var ctrl = ctrls.append('div')
                .attr("class",e["css"])
                .attr("style",e["style"])
                .html(e["text"]);  // seems to work if no text field
            if(e["handlers"]){
                e["handlers"].forEach(function(f,j,b){ //console.log(ctrl); console.log(g);
                    ctrl.on(f["event"],f["handler"]);
                });
            }
            if(e["createFn"]){
                e["createFn"](e);
            }
        });
    }

    return ret.init(o);
}

function stateElementFwdBck(stateObj,id,css,states,map,handlers,defaultValue,index,cycle){ //code should be segmented
	var values = {}, schema = {}, buttons = [], s = stateObj || state, refNo;

	buttons = states.map(function(e,i,a){
		var ndx = i;
		if(index) { ndx = index[i]; }
		values[ndx] = map ? map[i] : e;
		schema[i] = true;
		return { name : e , value : ndx, map : map[i]||e }; // changed this
	});

	// createButtonSet('.'+id,buttons,css,{ click : stateBtnHandler(id,stateObj.anchorMgr) });
    var ctrl = dSelectLinear({
        'state' : stateObj,
        'id' : id,
        'data' : buttons,
        'css' : css,
        'cycle' : cycle ? cycle : false
    });

	refNo  = s.addControl(id,values,schema,stateProperty,ctrl['updateState'],defaultValue||0); // Change updateButtonState
    //console.log(refNo);

    ctrl['updateState'](stateObj,id,refNo)();

	if(handlers){
		handlers.forEach(function(e,i,a){ stateObj.addHandler(refNo,e); });
	}
	return refNo; //not sure there is any need to return an object
}
