//*******************************************************************************
// Dependencies
// d3
// NVD3 - adjusted
// Various helper functions - formatting, values etc., - could be integrated
// css defnitions
//*******************************************************************************
//Helper functions
//*******************************************************************************
//Utility functions
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/, ''); };
//Helper functions from http://phrogz.net/fewer-lambdas-in-d3-js
// Create a function that returns a particular property of its parameter.
// If that property is a function, invoke it (and pass optional params).
function ƒ(name){
  var v,params=Array.prototype.slice.call(arguments,1);
  return function(o){
    return (typeof (v=o[name])==='function' ? v.apply(o,params) : v );
  };
}
// Return the first argument passed in
function I(d){ return d }
//Helper function to resolve functions or values
var f = function(o){ return (typeof(o)==='function' ? o() : o );};
//Helper function to sum array
var sum = function(array){
	return array.reduce( function(res, e, i, array){
				return res + e;
			});
}
// Walk object graph based on pipe delimited key
// May be better to flatten object
function wlk(o,k,delimiter){ //walk object
	var d=o, l=delimiter||".", p = k.split(l); //path default to .
	for(var i=0;i<p.length;i++){
         //should walk down data
        if(has(d,p[i])) {
        	d=d[p[i]];
        } else {
        	return null;
        }
    }
    return d;
}
function has(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}
//Fill array
function fillArray(len,value) {
  var arr = [], l = len || 1; v = value || 0;
  for (var i = 0; i < l; i++) {
    arr.push(v);
  };
  return arr;
}

function extend(a,b){
    for (var key in b){
        if(b.hasOwnProperty(key)){
            a[key] = b[key];
        }
    }
    return a;
}
// Returns a new object
function extendNew(a,b){
    var ret = {};
    for (var key in a){
        if(a.hasOwnProperty(key)){
            ret[key] = a[key];
        }
    }
    for (var key in b){
        if(b.hasOwnProperty(key)){
            ret[key] = b[key];
        }
    }
    return ret;
}

//*******************************************************************************
//Number formatting helpers - uses d3
//*******************************************************************************
function fmt(d3Spec,suffix,div){
	var f = d3.format(d3Spec);
	if(!div||div===0) { div=1e6;}
	return (function(value){ return (f(value/div).replace('-','(') + (value<0?')':' ') + suffix)} );
}
//Shorthand for accessing formats in report definitions
var fv = fmt(',.1f','m',1e6);
var fc = fmt(',.1f','k',1e3);
var fd = fmt(',.0f','',1);
var fp = fmt(',.1%','',1);
var fb = fmt(',.1f','bn',1e9);

//Helper function to determine number format for scale
function scaleNumberFormat(y){
	if(y<3){
		return fp;
	}
	if(y<3e3){
		return fd;
	}
	if(y<3e6){
		return fc;
	}
	if(y<3e9){
		return fv;
	}
	return fmt(',.1f','b',1e9);
}

//Helper function to determine number format for scale
function rptFmt(y){
	var absY = Math.abs(y);
	if(absY<2){
		return fp(y);
	}
	if(absY<1e5){
		return fd(y);
	}
	if(absY<2e6){
		return fc(y);
	}
	return fv(y);
}

//Helper function to determine number format for scale
function rptFmt2(y){
    if(y<1){
        return fp(y);
    }
    if(y<9e2){
        return fd(y);
    }
    if(y<9e5){
        return fc(y);
    }
    if(y<9e8){
        return fv(y);
    }
    return fmt(',.1f','bn',1e9)(y);
}

//Helper function to determine number format for scale
function rptFmtN(y){
    var absY = Math.abs(y);
    if(absY<1e5){
        return fmt(',.1f','',1)(y);
    }
    if(absY<2e6){
        return fc(y);
    }
    return fv(y);
}

//*******************************************************************************
//Generic highlight/unhighlight
//*******************************************************************************
//common handling functions to map and chart
function highlight(d){
	var item = d3.select(this);
	stateUpdate(item,"class","active",true);
	return false;
}
function unhighlight(d){
	var item = d3.select(this);
	stateUpdate(item,"class","active",false);
	return false;
}
//Helper functions - outside object
function stateUpdate(items,attr,attrPartValue,add){
	items.each(function(d,i) {
		var item = d3.select(this);
		attrUpdate(item,attr,attrPartValue,add);
	});
}
function attrUpdate(item,attr,attrPartValue,add){
	if(add)
	{
		item.attr(attr,function(d) { return (item.attr(attr) || "").trim() + " " + attrPartValue;})
	} else {
		item.attr(attr,function(d) { return item.attr(attr).replace(attrPartValue,"").trim();})
	}
}

//*******************************************************************************
// Miscellaneous
//*******************************************************************************
function now(){
    return (new Date()).getTime();
}

function debugTimer(group){
    var ret = {};
    ret['grp'] = group || "";
    ret['laps']  = [];
    ret['lap'] = function(output){
        var t1 = (new Date()).getTime();
        var t0 = ret['laps'][ret['laps'].length-1];
        ret['laps'].push(t1);
        if(output){ console.log( ret['grp'] + ": " + output+ ": " + (t1 - t0) + " ticks"); }
    }
    ret['laps'].push((new Date()).getTime());
    return ret;
}

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


// Stats function to add to array prototype
Array.prototype.stats = function(){
  var a=this, n = a.length,
          res = { "count":0, "sum":0, "mean":0, "median":0, "min":0, "max":0, "var":0, "stdDev":0,
        "decile1":0, "decile9":0, "quartile1":0, "quartile3":0, "mode":0 }, reduce;
  if(n>0){
    a.sort(ascending);
    res["count"]=n;
    reduce = a.reduce(function(r,e,i,a){ //Calculate sum, mode and count zeroes
          r["sum"]+=e;
          if(e===0) r["zeroes"]++;
          if(e!==r["last"]){
            r["last"]=e;
            r["count"]=0;
          } else {
            if(++r["count"]>r["modeCount"]){
              r["modeCount"]=r["count"];
              r["mode"]=e;
            }
          }
          return r;
    },{ "mode":0, "modeCount":0, "last":0, "count":0, "sum":0, "zeroes":0 });
    res["sum"] = reduce["sum"];
    res["mode"] = reduce["mode"];
    res["zeroes"] = reduce["zeroes"];
    res["mean"]=res["sum"]/res["count"];
    res["median"]=nthPercentile(50);
    res["min"]=a[0];
    res["max"]=a[n-1];
    res["var"]=a.reduce(function(r, e, i, a){ return Math.pow(e-res["mean"],2);},0)/(n-1);
    res["stdDev"]=Math.sqrt(res["var"]);
    res["decile1"]=nthPercentile(10);
    res["decile9"]=nthPercentile(90);
    res["quartile1"]=nthPercentile(25);
    res["quartile3"]=nthPercentile(75);
  }
  return res;

  function nthPercentile(nth){
    var d = (100/nth);
    var p = Math.floor(n/d);
    if(n%d===0||p===0){
      return a[p];
    } else {
        return (a[p-1]+a[p])/2.0;
    }
  }

  function ascending(a, b) {
    return a - b;
  }
}

Array.prototype.last = function(){
    if(this.length===0) return null;
    return this[this.length-1];
}
