//*******************************************************************************
//
//*******************************************************************************
function dProvider(o){
	//Function variables
	var ret = { cache : {}, calc : {}, srcId : { '_' : 0 }, src : [] };
	var cache = ret.cache, calc = ret.calc, srcId = ret.srcId, src = ret.src;
	// Defaults
	var def = {
		all : '_', //used for where no filter on dimension
		fn : 'fn', //used for function branching
		result : function(){ return 0; }, //to be a function - called for default result and map reduce
		indices : [],
		src : []
	}
	// Initialisation member
	ret.init = function(options){
	    // Extend defaults
		o = ret.options = $.extend(def,options); //var o used for shorthand - will this lead to trouble later overriding o?
		// Push options source into source for function
		o["src"].forEach(function(e,i,a){
			src.push(e["data"]||e);
			srcId[e["id"]||i] = i;
		});
		// option to kick start cache
		if(o.cache){ cache = o.cache; }
		// return function
		return ret;
	}
	// Principal access point
	ret.segment = function(key,range){ //range can be single value or array with 2 values - index and offset
		var s = key["src"] || '_';
		var k = src[srcId[s]].extKey(key,[s]); //returns { obj : fullKey, id : idString, filter : minKey }
		var res = ret.segmentFromCache(k);
		return res;
	}
	// Access cache - return if found otherwise fill cachs
	ret.segmentFromCache = function(key){ //cache will use string key
		return (cache[key["id"]] ? cache[key["id"]][key["obj"]["mre"]] : ret.fillCache(key));
	}
	// Fill cache by accessing source objects
	ret.fillCache = function(key){  //should be a private function
		var res, k = key.obj, id = key.id, 	s = srcId[key["src"] || '_'];
		if(k.xfn){ //check if there is a calculation function
			if(k.xfn.fn){
				if(calc[k.xfn.fn]){
					res = calc[k.xfn.fn](key);
					cache[id] = res.value;
				}
			} else if(calc[k.xfn]){ //is it a calculated field - check definitions?
				res = calc[k.xfn](key);
				cache[id] = res.value;
			} else {
				console.log("Error - transform function not logged");
			}
		} else {
			res = ret.src[s].getValues(key);
			cache[id] = res.value;
		}
		return cache[id][key["obj"]["mre"]]; //different as now returning a measure within an object of measures - not presently an array - this may need to change
	}
	// function to return population of array objects without summarisation
	ret.getPopulation = function(key){ //same interface as previous - key has already been processed though fullkey function
		var s = srcId[key["src"] || '_'];
		return src[s].getPopulation(key);
	}
	// Function to perform of Total calculations
	var ofTot = function(transform){
		return function(key){
			var tfm = $.extend({},key[transform]);
			var base = $.extend({},key,tfm.args[0]);
			delete base[transform];
			var divKey = $.extend({},base,tfm.args[1]);
			var val = ret.segment(base);
			var div = ret.segment(divKey);
			var vals = [];
			for(var i=0;i<val.length;i++){
				vals.push(div[i]===0 ? 0 : val[i]/div[i] );
			}
			return { id : ret.idString(key), key : key, value : vals }
		}
	}
	// Register function
	calc['ofTotal'] = ofTot('xfn');
	// Function entry point
	return ret.init(o);
}

// structure will be lvl|reg|pou : { mre1 : value1, mre2 : value2, mre3 : value3, ...}
//*******************************************************************************
//Step 2 - Create Periods Objects Array
//*******************************************************************************
//should pou be converted to index?
function periodsCreate(start,end){
	var res={}, mths = [], ndx = {};
	var yr = Math.round(start/100);
	var mth = start%100;

	for(var i=0;i<end;i++){
		mths[i]=yr*100+mth;
		ndx[mths[i]]=i;

		if((++mth) > 12){
			yr++;
			mth=1;
		}
	}
	res.mth = mths;
	res.ndx = ndx;
	return res;
}
var periods = periodsCreate(201201,25);
//console.log(periods);
var utilsValues = {
	"shortmonths"	: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
	"monthsletters"	: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
	"fullmonths"	: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
	"shortdays"		: ["M", "T", "W", "T", "F", "S", "S"],
	"fulldays" 		: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],

}

var displayNames = {
	mre: { "Bal": "Balance", "Cre": "Cure", "Flw": "Flow", "Prv": "Provision", "BalChg": "Balance Movement", "BlD": "Balance Movement"},
	ent: { "A": "AMU", "N": "Non-core", "P": "ptsb" },
	prd: { "_": "Mortgage" },
	prt: { "BTL": "BTL", "PDH": "PDH" },
	arr: { "0": "Closed", "10": "UTD", "20": "0-30", "30": "30-60", "40": "60-90", "50": "90 plus", "60": "180 plus", "70" : "Repo", "80" : "Shortfall" },
	npl: { "N": "Performing", "Y": "Non-performing" },
	fb: { "CL": "Closure", "LT": "Long-term", "NO": "None", "ST": "Short-term" },
	fbt: { "A": "AVS", "AS": "AVS-Sold", "C": "Cap", "IO": "IO", "IP": "IOplus", "LT": "LT_Trial", "NO": "NO", "PR": "PMT_Red", "R": "Repo", "RS": "Repo-Sold", "S": "Split", "T": "TE" },
	uom: { "E": "Value", "#": "Volume" },
		pou: { "201201": "201201", "201202": "201202", "201203": "201203", "201204": "201204", "201205": "201205", "201206": "201206", "201207": "201207", "201208": "201208", "201209": "201209", "201210": "201210", "201211": "201211", "201212": "201212", "201301": "201301", "201302": "201302", "201303": "201303", "201304": "201304", "201305": "201305", "201306": "201306", "201307": "201307", "201308": "201308", "201309": "201309", "201310": "201310" } } ;



//*******************************************************************************
//Step 3 - Get data & Create Crossfilter
//*******************************************************************************
//3.1 - Get data

//3.2 - Create crossfilter


//Approaches below not currently used
var balChg = { //merge op1 & op2 key with key
	op1 : { mre : 'bal'}, index : [], //could use for range
	op2 : { mre : 'bal' }, index : [-1],
	opr : "subtract"
}

var ofArrs = { //need an operative dimension?
	op1 : { }, index : [],
	op2 : { arr : '' }, index : [],
	opr : "divide"
}

var offb = { //need an operative dimension?
	op1 : { }, index : [],
	op2 : { fb : '' }, index : [],
	opr : "divide"
}


/* New development */
// Expected steps
// 1. Read in text file (expect CSV) - need file load - do we need step to load a configuration/meta data file? - could paste in!
// 2. Reshape to put measures in nested object
// 3. Add new dimensions
// 4. Index required dimensions

// Prototype for adding dimension to pivot
function pivotAddDim(name, grpFn, display, field){
	pivot.population.each(function(e,i,a){
		e[name] = grpFn(e[field]); //apply grouping function
	});
	pivot.dim[name].display = display; //not a feature at present - display should be embedded in pivot
}

function createIndexes(){
	//Iterate through (categorical) dimensions and add to index
}

// need to develop an index intersection function to refine selection - may need to determine a viable set size to stop intersection checking e.g. 5k records

// Function to provide groupings for ranges over a dimension
// g = grouping, d = default, lte = less than equal, f = field
// usage grpRanges([0.7,1.0,1.2,1.5],5,true)
function grpRanges(g,d,lte){
	return function(f){
		for(var i=0;i<g.length;i++){
			if( f<g[i] && (lte && f===g[i]) ){
				return ++i;
			}
		}
		return d || i+1; //no not found - assume greater than last
	}
}

//To do - produce a version which looks at extent and segments into a certain number of categories
//To do - produce a version which looks at extent and segments into a certain number of categories driven by population distribution

// Function to provide groupings for ranges over a dimension
function grpCategories(g,d){
	return function(f){
		if(f in g){
			return g[f];
		}
		return d || 0;
	}
}
