var cor = {};

// Add trim function String
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/, ''); };
// Add return last element function to Array
Array.prototype.last = function(){
    if(this.length===0) return null;
    return this[this.length-1];
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
