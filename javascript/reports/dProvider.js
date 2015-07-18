//*******************************************************************************
//
//*******************************************************************************
function dProvider(options){
	// Defaults
	var def = {
		all : '_', //used for where no filter on dimension
		fn : 'fn', //used for function branching
		result : function(){ return 0; }, //to be a function - called for default result and map reduce
		src : [],
		dims : [],
		tgt : 'mre'
	}
	//Function variables
	var ret = { cache : {}, calc : {}, srcId : { '_' : 0 }, src : [], options : {} };
	var cache = ret.cache, calc = ret.calc, srcId = ret.srcId, src = ret.src, o = ret.options, filters = { 'active' : {} };
	o = extend(def,options); // merge defaults and options
	// Initialisation member
	ret.init = function(options){
		ret.dims={};
		// Initialise Indexes Object for each dimension - should indexes and dims be combined
		o.dims = ['src'].concat(o.dims); // add src at start of dims - src shoud not be passed in
		o.dims.forEach(function(e,i,a){ // dims will be indexed
			// incorporate dim breakdown
			ret.dims[e] = { 'val' : i };  //associative map
			ret.dims[i] = { 'val' : e }; //ordered map
		});
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
	ret.segment = function(key){ //range can be single value or array with 2 values - index and offset
		var k = ret.extKey(key); //returns { obj : fullKey, id : idString, filter : minKey }
		ret.activeCache(src[srcId[k["obj"]["src"]]]);
		var res = ret.segmentFromCache(k);
		return res;
	}
	// New function to set cache to active filter
	ret.activeCache = function(source){
		if(source.filtered()===true){
			var id = ret.idString(source['filter']['selected']);
			if(!ret.cache[id]){
				ret.cache[id] = {};
			}
			cache = ret.cache[id];
		} else {
			cache = ret.cache;
		}
	}
	// Function to support activeCache
	ret.idString = function(key){
		var d = [];
		if(!key['src']) { key['src'] = '_'; } // key has to have a src dim
		for(var i=0;i<o.dims.length;i++){
			d.push(o.all);
		}
		for(var k in key){ // would extend be better? - check k is in result
			if(ret.dims[k]){
				var v =  f(key[k]); // use f to resolve function here - need to make this generic - should I use extend?
				d[ret.dims[k].val] = v.label || v; // ensure order is correct
			} else {
				if(k.indexOf(o.fn)<1 && k!=='src' ){ // check on source not required
					console.log("Invalid key: " + k);
				}
			}
		}
		return d.join("|"); //full key and idString returned
	}
	// Extend key for all dimensions (include source dimension) and
	// include an id string in format <dimval1>|<dimval2>|... and
	// include filter which is minimum number of fields i.e. have a selection
	ret.extKey = function(key){ // new to address subFilter
		var d = [], filter = {}, subFilter = {};
		if(!key['src']) { key['src'] = '_'; } // key has to have a src dim
		for(var i=0;i<o.dims.length;i++){
			d.push(o.all);
		}
		for(var k in key){ // would extend be better? - check k is in result
			if(ret.dims[k]){ // key is in dimensions registered for provider
				var v =  f(key[k]); // use f to resolve function here - need to make this generic - should I use extend?
				if(v!==o.all){ filter[k] = v; } // populate filter with keys which have a value (or function)
				d[ret.dims[k].val] = v.label || v; // ensure order is correct
			} else {
				if(k.indexOf(o.fn)<1 && k!=='src'  && k!=='subFilter'){ // check on source not required
					console.log("Invalid key: " + k);
				}
			}
		}
		// New section for subFilter
		if(key['subFilter']){
			var sF = key['subFilter'], s = d.slice(0); // copy d
			for(var k in sF){ // would extend be better? - check k is in result
				if(ret.dims[k]){
					var v =  f(sF[k]); // use f to resolve function here - need to make this generic - should I use extend?
					if(v!==o.all){ subFilter[k] = v; }
					s[ret.dims[k].val] = v.label || v; // ensure order is correct
				}
			}
			d = d.concat(s); // Extend subFilter id to main id - SHOULD THIS BE d = s.concat(d)?
		}
		// Encode filters - new finctionality not yet implemented
		/*if(src[key[src]].encoded()){
			src[key[src]].encodeFilter();
		}*/
		return { "obj" : key, "id" : d.join("|"), "filter" :  filter, "subFilter" : subFilter }; //full key and idString returned
	}
	// Access cache - return if found otherwise fill cachs
	ret.segmentFromCache = function(key){ //cache will use string key
		//Debugging
		/*if(cache[key["id"]]) {
			console.log("returned from cache with key: " + key["id"]);
		} else {
			console.log("updated cache with key: " + key["id"]);
		}*/
		return cache[key["id"]] ? cache[key["id"]] : ret.fillCache(key);
	}
	// Fill cache by accessing source objects
	ret.fillCache = function(key){  //should be a private function
		var res, k = key.obj, id = key.id, 	s = srcId[key["obj"]["src"] || '_'];
		if(k.xfn){ //check if there is a calculation function
			if(k.xfn.fn){
				if(calc[k.xfn.fn]){
					res = calc[k.xfn.fn](key);
				}
			} else if(calc[k.xfn]){ //is it a calculated field - check definitions?
				res = calc[k.xfn](key);
			} else {
				console.log("Error - transform function not logged");
			}
		} else {
			res = ret.src[s].getValues(key);
		}
		return ret.cacheOut(id,k,res.value);
	}
	// Overridable function to update cache and return value
	ret.cacheOut = function(id,key,result){
		//if(typeof(result)==='object'){
		//	return ret.fillCacheFromObject(id,key,result);
		//}
		return cache[id] = result;
	}
	// Enumerate result to update cache
	ret.fillCacheFromObject = function(id,key,result){
		for(var mre in result){
			if(has(result,mre)){
				var idString = replaceMreInId(id,mre);
				cache[idString] = result[mre];
				// cache[replaceMreInId(id,mre)] = result[mre];
			}
		}
		return cache[id];
	}
	// Replace measure dimension in cache id string
	function replaceMreInId(id,mre){
		var s = id.split('|');
		s[ret.dims[o.tgt].val] = mre;
		//var s = id.split('|')[ret.dims[o.tgt].val]=mre;
		return s.join('|');
	}
	// function to return population of array objects without summarisation
	ret.getPopulation = function(key){ //same interface as previous - key has already been processed though fullkey function
		var s = srcId[key["src"] || '_'];
		return src[s].getPopulation(key);
	}
	// Function to perform of Total calculations - new version - separates numerator and divisor keys
	var ofTot = function(transform){
		return function(key){
			var tfm = $.extend({},key['obj'][transform]); // jQuery extend might be expensive
			var base = $.extend({},key['obj']);
			delete base[transform]; // should not use delete
			//if(base['subFilter']) { delete base['subFilter']; } // should not use delete - perhaps should delete for numerator or just override?
			var numKey = $.extend({},base,tfm.args[0]);
			var divKey = $.extend({},base,tfm.args[1]); //console.log(divKey);
			var val = ret.segment(numKey); //console.log('ofTot'); console.log(val);
			var div = ret.segment(divKey); //console.log(div);
			var vals = [];
			for(var i=0;i<val.length;i++){
				vals.push(div[i]===0 ? 0 : val[i]/div[i] );
			}
			return { id : key['id'], obj: key['obj'], value : vals }
		}
	}
	// Register function
	calc['ofTotal'] = ofTot('xfn');
	// Function to perform batch update with incrmental filter
	ret.xFilter = function(dim,value,source){
		if(!dim){ return resetFilters(); }
		if(!key['src']) { key['src'] = '_'; } // key has to have a src dim
		var k = ret.extKey(key); //returns { obj : fullKey, id : idString, filter : minKey }
		var pop, newFilter  = mergeWithActive(dim,value);
		if(value='_'){
			pop = ret.getPopulation(newFilter);
		} else {
			pop = ret.filter(newFilter);
		}
		sumDimensionAndUpdateCache();
		return;
	}
	// Function entry point
	return ret.init(o);
}

//*******************************************************************************
// dProvider extension to deal with arrays
//*******************************************************************************
function dProviderArray(options){
	// Preliminary items - defaults - call base function
	var def = {}
	var ret = dProvider(extend(def,options));  //inital set up from dFilterBase
	var cache = ret.cache, calc = ret.calc, srcId = ret.srcId, src = ret.src, o = ret.options;

	ret.init = function(options){
		// Extend defaults
		return ret;
	}
	// Principal access point - overwritten
	ret.segment = function(key,range){ //range can be single value or array with 2 values - index and offset
		var k = ret.extKey(key); //returns { obj : fullKey, id : idString, filter : minKey }
		ret.activeCache(src[srcId[k["obj"]["src"]]]);
		var res = ret.segmentFromCache(k);
		var r = range;
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
		return (!range ? res : res.slice(r0,r1));
		return res;
	}

	ret.segmentSubAnalyse = function(key,range,dimToAnalyse){
		//console.log('segmentSubAnalyse ' + dimToAnalyse);
		var res = [], k = $.extend( true, {}, key), s = srcId[key["src"] || '_'];
		ret.src[s].range(dimToAnalyse).forEach(function(e,i,a){
			k[dimToAnalyse] = e;
			res.push({
				key: displayNames[dimToAnalyse] ? displayNames[dimToAnalyse][e] || e : e,
				values: ret.segment(k,range).map(function(d,i){
					return { x: pouDisplay(i,"shortmonths") , y:d }
					})
			});
		});
		return res;
	}

	return ret.init(o);
}


/***********************************************************************************/
