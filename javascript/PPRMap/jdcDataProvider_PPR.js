//*******************************************************************************
// Dependencies
// d3
// NVD3 - adjusted
// Various helper functions - formatting, values etc., - could be integrated
//*******************************************************************************
//Cross Filter
//*******************************************************************************
function jdcDataProvider(o){
	//Too many characters/values set
	var ret = {};
	var cache = {}; //= dataArray; //cached slices
	var calc = {}; //calculated definitions
	var o;

	var def = {
		all : '_', //used for where no filter on dimension
		fn : 'fn', //used for function branching
		result : function(){ return 0; }, //to be a function - called for default result and map reduce
		indices : []
	}

	ret.init = function(options){
	    // Extend defaults
	    var extended = def;
	    for (var prop in options) {
	      if (options.hasOwnProperty(prop)) {
	        extended[prop] = options[prop];
	      }
	    }
		o = ret.options = extended; //var o used for shorthand - will this lead to trouble later overriding o?

		ret.dims={};

		for(var i=0;i<o.dims.length;i++){
			console.log(i);
			var d = o.dims[i];
			console.log(d);
			ret.dims[i] = {}; //ordered map
			ret.dims[d] = {};  //associative map
			ret.dims[i].val=d; //e.g. [0].val = "dim 1 Name"
			ret.dims[d].val=i; //e.g. [name].val = order
			ret.dims[i].range = [];
		}
		console.log(o.dims.length);
		//New version - iterates over population once
		var res={}, mre, val;
		for(var j=0;j<o.dims.length;j++){
			res[o.dims[j]]={};
		}
		var vals = o.data.reduce(function(res,e,i,a){
			for(var j=0;j<o.dims.length;j++){
				mre=o.dims[j];
				val=wlk(e,mre);
				if(!res[mre][val]){
					res[mre][val]={ "n":0, "val":0.0 };
					ret.dims[j].range.push(val);
				}
				res[mre][val]["n"]++;
				res[mre][val]["val"]+=e["Price"];
			}
			return res;
		},res);
		for(var j=0;j<o.dims.length;j++){
			ret.dims[j].range.sort();
		}
		console.log(res);
		if(o.cache){
			cache = o.cache;
		}

		return ret;
	}

	//Where should order of keys be controlled?
	ret.idString = function(keys){
		var res = [];
		for(var i=0;i<o.dims.length;i++){
			res.push(def.all); //Push blank for no filter
		}
		for(k in keys){
			if(ret.dims[k]){
				var r = f(keys[k]);
				res[ret.dims[k].val] = r.label || r; //use f to resolve function here - need to make this generic
			} else {
				if(k.indexOf(def.fn)<1){
					console.log("Invalid key: " + k);
				}
			}
		}
		res[ret.dims["mre"].val]=def.all; //Set mre to all as measures in object
		return res.join('|');
	}

	//Key expanded to include all dimensions
	ret.fullKey = function(keys){
		var res = {};
		for(var i=0;i<o.dims.length;i++){
			res[o.dims[i]]=def.all; //using '' causes problems - don't know why
		}
		for(k in keys){ //would $.extend be better? - check k is in result
			if(ret.dims[k]){
				res[k] = f(keys[k]); //use f to resolve function here - need to make this generic
			} else {
				if(k.indexOf(def.fn)<1){
					console.log("Invalid key: " + k);
				}
			}
		}
		return res;
	}

	//New Reduce Functionality
	function objInKey(obj,key){
		res=true;
		for(k in key){
			var v=key[k];
			var o=wlk(obj,k); // walks if nested
			if(typeof(v)==='object'){ //allDims firing initial function
				if(v.fn){
					res=v.fn(o);
				}
			} else {
				if(v!=="_"){
					if(o){
						res=((o===v)||(+o===+v));
					//console.log("fn objInKey - value comparison - " + obj[k] + " with " + v);
					} else { return false; } //value key with no corresponding key in object
				}
			}
			if(res===false){ return false };
		}
		return true;
	}

	function keyFilter(key,field){
		return function(obj,i,a){
			if(objInKey(obj,key)){
				if(!field) return obj;
				return wlk(obj,field); //return the target field
			}
		}
	}

	function keyFilterReduce(key,field){
		return function(res,obj,i,a){
			res.push(wlk(obj,field)); //return the target field
			return res;
		}
	}

	function kFilter(key){
		return function(obj,i,a){
			return objInKey(obj,key);
		}
	}

	function keyReduce(key){ //want this to be the stats
		return function(res, obj) {
			if(objInKey(obj,key)){
				var v=obj.values;
				for(var i=0;i<v.length;i++){
					res[i]+=v[i];
				}
			}
		    return res;
		}
	}

	function fillArray(value, len) {
	  var arr = [];
	  for (var i=0; i<len; i++) {
	    arr.push(value);
	  };
	  return arr;
	}

	function filterData(key){ //should always be a full key
		//return a filtered set of data based on ordered indices supplied
		//if(o.indices.length>0){ //need to ensure default value
		//o.indices.each(function(index,i,a)){ //object with indices - confirmed can rely on ordering - won't work as return won't exit loop
		for (var i=0; i<o.indices.length; i++) {
			var index = o.indices[i];
			if(index["field"]){
				if(index["field"] in key){ //should maybe use hasOwnProperty
					var v=key[index["field"]]; //index used
					if(v!=="_" && typeof(v)!=='object'){ //not all and not an object
						return index["index"][v].map(function(e,i,a){
							index["indexMap"][e]; //iterate through index to return array of objects
						});
					}
				}
			}
		}
		return o.data;
	}

	//may rename to get measures
	ret.getValues = function(key){ //same interface as previous - key has already been processed though fullkey function
		//var population = filterData(ret.fullKey(key)).filter(kFilter(key));
		var keyAllMre = ret.fullKey(key);
		keyAllMre["mre"] = def.all;
		//console.log(ret.idString(keyAllMre));
		var pop = filterData(keyAllMre).filter(kFilter(keyAllMre));
		//console.log(pop[0]);
		//console.log(pop.length);
		//population = population.reduce(keyFilterReduce(key,"Price"),[]);
		var population = pop.reduce(function(r,e,i,a){ if(e["Price"]) { r.push(e["Price"]);} return r; },[]);
		//console.log(population[0]);
		//console.log(population.length);
		var r = population.stats();
		//console.log(r);
		return {
			id : ret.idString(key),
			key : key,
			value : population.stats() //introduces filter on an index - need to parameterise
		}
	}

	//function to return population of array objects without summarisation
	ret.getPopulation = function(key){ //same interface as previous - key has already been processed though fullkey function
		console.log("getPopulation");
		return {
			id : ret.idString(key), //arguable this is not required
			key : key,
			value : filterData(ret.fullKey(key)).filter(kFilter(key)) //introduces filter on an index
		}
	}

	ret.segmentSum = function(key,range){  //this should be accessible as string or object key
		return ret.segmentRange(key,range).reduce( function(previousValue, currentValue, index, array){
				return previousValue + currentValue;
			});
	}

	ret.segment = function(key,range){ //range can be single value or array with 2 values - index and offset
		var res = ret.segmentFromCache(key);
		/*var r = range;
		var r0, r1;
		if(r){
			r0 = r[0] || r; r0 = f(r0);
			r1 = r[1] || r0+1; r1 = f(r1);
			if(r1<r0){
				if(r1<0) {
					r0 += r1+1;
					r1 = r0-r1;
				} else {
					r1 += r0;
				}
			}
		}
		return (!range ? res : res.slice(r0,r1));*/
		return res;
	}

	ret.segmentFromCache = function(key){ //cache will use string key
		//console.log(ret.idString(key));
		return (cache[ret.idString(key)] ? cache[ret.idString(key)][key["mre"]] : ret.fillCache(key));
	}

	ret.fillCache = function(key){  //should be a private function
		var res;
		if(key.xfn){
			if(key.xfn.fn){
				if(key.xfn.fn){ //is it a calculated field - check definitions?
					res = calc[key.xfn.fn](key);
					cache[res.id] = res.value;
				}
			} else if(calc[key.xfn]){ //is it a calculated field - check definitions?
				res = calc[key.xfn](key);
				cache[res.id] = res.value;
			} else {
				console.log("Error - transform function not logged");
			}
		} else {
			res = ret.getValues(ret.fullKey(key));
			cache[res.id] = res.value;
		}
		return cache[res.id][key["mre"]]; //different as now returning a measure within an object of measures - not presently an array - this may need to change
	}

	function preCalculated(key){
		//console.log("preCalc Fired");
		//console.log(ret.idString(key));
		for(k in key){
			if(!preCalc[k][key[k]]){
				return false; //return as soon as failed
			}
		}
		//console.log("preCalc Fired - & short circuited");
		return true;
	}

	var measureChange = function(key){
		var newKey=$.extend({},key);
		newKey.mre = f(newKey.mre).replace('Chg','');
		delete newKey.xfn; //need to delete or
		var values = ret.segment(newKey);
		var res=[0];
		for(var i=1;i<values.length;i++){
			res.push(values[i]-values[i-1]);
		}
		return { id : ret.idString(key), key : key, value : res }
	}

	var chg = function(dim,suffix,transform){
		return function(key){
			var base = $.extend({},key);
			base[dim] = f(base[dim]).replace(suffix,'');
			delete base[transform]; //necessary to stop looking in calc
			var values = ret.segment(base);
			var res=[0];
			for(var i=1;i<values.length;i++){
				res.push(values[i]-values[i-1]);
			}
			return { id : ret.idString(key), key : key, value : res }
		}
	}

	var ofTotal = function(dim,suffix,transform,total){
		return function(key){
			var base = $.extend({},key);
			base[dim] = f(base[dim]).replace(suffix,''); //Change this to add suffix later & output
			delete base[transform];
			var values = ret.segment(base);
			for(k in total){
				if(base[k]){
					base[k]=total[k];
				}
			}
			var div = ret.segment(base);
			var res = [];
			for(var i=0;i<values.length;i++){
				res.push(div[i]===0 ? 0 : values[i]/div[i] );
			}
			return { id : ret.idString(key), key : key, value : res }
		}
	}

	var ofTot = function(transform){
		return function(key){
			var tfm = $.extend({},key[transform]);
			var base = $.extend({},key,tfm.args[0]);
			delete base[transform];
			var divKey = $.extend({},base,tfm.args[1]);
			//console.log(divKey);
			var val = ret.segment(base);
			var div = ret.segment(divKey);
			var vals = [];
			for(var i=0;i<val.length;i++){
				vals.push(div[i]===0 ? 0 : val[i]/div[i] );
			}
			return { id : ret.idString(key), key : key, value : vals }
		}
	}

	//calc['Chg'] = measureChange;
	calc['Chg'] = chg('mre','Chg','xfn');
	calc['ofTotalArr'] = ofTotal('uom','OfTotal','xfn', {arr : xfFilter('arr','All',function(){ return d>0; })});
	calc['ofTotalEnt'] = ofTotal('uom','OfTotal','xfn', {ent : '_'});
	calc['rate'] = ofTotal('mre','Rate','xfn', {mre : 'Bal'});//This will change to the following
	//calc['rate'] = ofTotal('mre','Rate','xfn', {mre : 'Bal'});
	calc['ofTotal'] = ofTot('xfn');

	return ret.init(o);
}

/*var dataDims = ["Location.Cty",
				"Location.Admin_Cty",
				"Location.ED",
				"Location.SA",
				"Date",
				"Property.Bedrooms",
				"Property.Type",
				"Property.Bathrooms",
				"mre"];*/
/*
var dataIndices = [
					{"field":"Location.SA","index":"dataPPRBySA","indexMap":index}, //problem with timing here
					{"field":"Location.ED","index":"dataPPRByED","indexMap":index}, //should move to configuration
				];*/

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
console.log(periods);
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
	pivot.dim[name].display = display[]; //not a feature at present - display should be embedded in pivot
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


/*var a = { id: "this", value: 1 };
var b = { value: "this", id : 1};
var c = { id: "this", value: 1 };

console.log(_.isEqual(a,c));
console.log(_.isEqual(a,b));

var dataStore;

var dataCache;

// from
// http://www.sitepoint.com/forums/showthread.php?857462-efficient-way-to-search-a-multi-dimensional-array-for-key-based-on-value
function filterKeys(obj, func) {
    return Array.prototype.filter.call(Object.keys(obj), func, obj);
}
function someKeys(obj, func) {
    return Array.prototype.some.call(Object.keys(obj), func, obj);
}
function atLeastOnePropertyMatches(obj, requiredProp) {
    return someKeys(obj, function (prop) {
        if (requiredProp.hasOwnProperty(prop)) {
            return this[prop] === requiredProp[prop];
        }
    });
}
function getMatchingKeys(obj, requiredProp) {
    return filterKeys(obj, function (prop) {
        return atLeastOnePropertyMatches(this[prop], required);
    });
}
var arr = {
    thisKey: {prop1: 'a', prop2: 'b', prop3: 'c'},
    thatKey: {prop1: 'x', prop2: 'y', prop3: 'z'},
    otherKey: {prop1: 'red', prop2: 'orange', prop3: 'blue'}
},
    required = {prop2: 'orange'};
    results = [];

results = getMatchingKeys(arr, required);
// results is now ['otherkey']

function firstMatchingKey(arr, requiredProp) {
    var matches = forEachKey(arr, Array.prototype.filter, function (prop) {
        return atLeastOnePropertyMatches(this[prop], required);
    });
    return matches[0];
}
...
result = firstMatchingKey(arr, required);
// result is now 'otherkey'*/
