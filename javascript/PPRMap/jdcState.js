//*******************************************************************************
// Dependencies
// d3
// NVD3 - adjusted
// Various helper functions - formatting, values etc., - could be integrated
// css defnitions
//*******************************************************************************
//State Manager
//*******************************************************************************
//should arrays of data sources, views and handlers be added or multiple stateManagers be added - leaning to latter
function stateManager(anchorManager,dataSource){
	var state = {
		//AnchorManager
		anchorMgr : null,
		//Data - don't see a reason to have this here - should attach to view?
		data : null, //to change to more generic name - may also require more than one dataSource so possibly change to an array			
		initData : function(d){ state.data=d; }, //to go
		resetData : function(d){ state.data=d; },
		//State controls
		controls : [],
		addControl : function(id,values,schema,accessor,eventHandler,defaultValue){
			if(state[id]){ //duplicating
				return -1;
			}
			var refNo = (state.controls.push(defaultValue||0)-1);
			state[id]=accessor(state,refNo,values);
			state.stateHandlers.push(eventHandler(state,id,refNo));
			state.anchorMgr.addAnchorMapSchema(id,schema);
			return refNo;
		},
		addHandler : function(refNo,handler){
			return (state.stateHandlers.push(handler(state,refNo))-1);
		},
		stateHandlers : [],
		updated : 0,
		updateStateControls : function(){
			for(var i=0;i<state.stateHandlers.length;i++){
				state.stateHandlers[i]();
			}
		},
		//Views
		views : [], //views should be pushed in here when create
		addView : function(view){
			return (state.views.push(view)-1);
		},
		viewActive : 0, //not updated at present
		updateViews : function(){
			if(state.views[state.viewActive]){state.views[state.viewActive].update();}
		},
		//Single State Update
		update : function(){
			state.updateStateControls();
			state.updateViews();			
		},		
	}
	state.anchorMgr = anchorManager;
	state.data = dataSource;
	state.anchorMgr.addStateManager(state);
	return state;
};
//should be in configuration

//*******************************************************************************
//Anchor Management
//*******************************************************************************
/* Anchor Map section */
//Need to turn this into a module
var anchorManager = function(){
	var ret = {}, anchorMap = {}, anchorMapSchema = {};

	ret.stateManagers = [];
	ret.stateChanged = [];
	
	ret.addStateManager = function(stateObj){
		var i = (ret.stateManagers.push(stateObj)-1);
		ret.stateChanged[i] = false;
		return i;
	}

	ret.changeAnchorPart = function( argMap ) {
		var anchorMapRevise = copyAnchorMap(), result = true, k, k_dep;
		// Begin merge changes into anchor map
		KEYVAL:
		for ( k in argMap ) {
		  if ( argMap.hasOwnProperty( k ) ) {
		    // skip dependent keys during iteration
		    if ( k.indexOf( '_' ) === 0 ) { continue KEYVAL; }
		    // update independent key value
		    anchorMapRevise[k] = argMap[k];
		    // update matching dependent key
		    k_dep = '_' + k;
		    if ( argMap[k_dep] ) {
		      anchorMapRevise[k_dep] = argMap[k_dep];
		    }
		    else {
		      delete anchorMapRevise[k_dep];
		      delete anchorMapRevise['_s' + k_dep];
		    }
		  }
		}
		// End merge changes into anchor map
		// Begin attempt to update URI; revert if not successful
		try {
		  $.uriAnchor.setAnchor( anchorMapRevise );
		}
		catch ( error ) {
		  // replace URI with existing state
		  $.uriAnchor.setAnchor( anchorMap,null,true );
		  result = false;
		}
		// End attempt to update URI...
		return result;
	};
	
	// Need to consider sending state in as a parameter
	ret.onHashchange = function( event ) {
	    var anchorMapPrevious = copyAnchorMap(), anchorMapProposed, toggleCty = false;

		// attempt to parse anchor
		try { anchorMapProposed = $.uriAnchor.makeAnchorMap(); }
		catch ( error ) {
			$.uriAnchor.setAnchor( anchorMapPrevious, null, true );
			return false;
		}
		anchorMap = anchorMapProposed;

		for ( k in anchorMapProposed ) {
			if ( ! anchorMapPrevious || anchorMapPrevious[k] !== anchorMapProposed[k] ) {	
				if(k.indexOf('s_')===-1){
					ret.stateManagers.forEach(function(e,i,a){
						if(k in e){
							e[k](anchorMapProposed[k]); //state properties updated
							ret.stateChanged[i] = true;
						}					
					})
				}
			}
		};

		ret.stateChanged.forEach(function(e,i,a){ 
			if(e===true){
				ret.stateManagers[i].update();
				e = false;
			}
		});

	    return false;
	};

	ret.addAnchorMapSchema = function(id,schema){
		if(!anchorMapSchema[id]){
			anchorMapSchema[id] = schema;
		}
	}

	ret.init = function(){
		// configure uriAnchor to use our schema
		$.uriAnchor.configModule({
			schema_map : anchorMapSchema
		});
		return ret;
	}

	//helper functions
	function copyAnchorMap() {
		return $.extend( true, {}, anchorMap );
	};

	return ret.init();
}

//*******************************************************************************
//Buttons Management
//*******************************************************************************
//Button Group Creation
var createButtonSet = function(container,btns,css,events){
	var btns = d3.selectAll(container).selectAll('button')
		.data(btns)
	.enter().append('button')
		.attr("class", css)
		.attr("value", ƒ("value"))
		.html(ƒ("name"))
		.on("click",events.click);				
}			//Config - Button to data field mapping

//*******************************************************************************
//Step 1 - Add Buttons to Page Structure
//*******************************************************************************			
//New Approach to setting up state
//Attaches a property to a state object
function stateProperty(stateObj,refNo,propertyStates){ //move into state object
	return function(v){ 
		if(v!==undefined){
			if(v!==stateObj["controls"][refNo]) {
				stateObj["controls"][refNo]=v;
				stateObj["updated"] = refNo; //need to consider - some array registration
			}
		}
		return propertyStates[stateObj["controls"][refNo]];
	};
}			

function stateBtnHandler(id,anchor){
	return function(e){
		var update = {};
		update[id]=this.value; //cannot create the update object direct
		anchor.changeAnchorPart(update);
		return false;					
	}
}

function updateButtonState(stateObj,id,refNo){ //attach to state object
	return function(){
		$("."+id+" button").removeClass("active");
		$("."+id+" button[value=" + stateObj["controls"][refNo] + "]").addClass("active");
	}
}

function reportChange(id){
	return function(stateObj,refNo){		
		return function(){
			//Update active report - want to do this only if report changed
			if(stateObj["updated"]===refNo){
				stateObj["viewActive"]=stateObj["controls"][refNo]; //is this too late
				$("#" + id + " .activeTab").fadeOut('fast', //didn't work when div specified in selector
					function(){
						$("#" + id + " div[id=" + id + stateObj["controls"][refNo] + "]").fadeIn('slow').removeClass("inActiveTab").addClass("activeTab"); 
					})
				.removeClass("activeTab").addClass("inActiveTab");
			}
		}
	}
}

//*******************************************************************************
// Function needs work to make more general purpose - too tightly bound
//*******************************************************************************
//Creates a button set with a click handler, adds two members (btns.id (function) + member (property)) to a state object (stateObj)
//returns an associative array of values
//btns.id drives hook up with Anchor management and state
//member no longer used - array of controls now used driven by refNo - refNo could be derived and returned
function stateElement(stateObj,id,css,states,map,handlers){ //code should be segmented
	var values = {}, schema = {}, buttons = [], s = stateObj || state, h = "stateHandlers", refNo; 
	
	buttons = states.map(function(e,i,a){ 
		values[i] = map ? map[i] : e;
		schema[i] = true;
		return { name : e , value : i };
	});

	createButtonSet('.'+id,buttons,css,{ click : stateBtnHandler(id,stateObj.anchorMgr) });
	
	refNo  = s.addControl(id,values,schema,stateProperty,updateButtonState,0)
	
	if(handlers){
		handlers.forEach(function(e,i,a){ stateObj.addHandler(refNo,e); });		
	}
	return refNo; //not sure there is any need to return an object
}


		


