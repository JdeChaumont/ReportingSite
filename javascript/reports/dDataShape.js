
function layoutStack(data, getY, getX){
    data.forEach(function(e,i,a){ // console.log(data);
      e.value =  stackLoop(e.values, e.key, getY, getX, e.sort);
    });

    /***********************************************************************************/
    /* Function to add stacked coordinates to array of data points data - note on stacks a single array */
    /* usage would be data.values = stack(data.values); */
    function stackLoop(data, series, getY, getX, sort){ //version where data is transformed - therefore mutable
        // console.log(data);
        var y = getY || function(d){ return d.y; }, x = getX || function(d){ return d.x; }, sum = 0;
        if(sort){
            data.sort(function(a,b){ return sort==='desc' ? y(b) - y(a) : y(a) - y(b); })
        }
        //console.log(data);
        for(var e, i=0, a=data, n=data.length; i<n; i+=1){ e = a[i]; // bring into line with functional convention
            if(!e.x){ e.x = x(e) || ( series || 0); } //create x if not already present - may not be a number
            if(!e.y){ e.y = y(e); } //create y if not already present
            e.y0 = (i>0 ? a[i-1].y + a[i-1].y0 : 0);
            e.y1 = (i>0 ? a[i-1].y + a[i-1].y1 : 0);
            sum+=e.y;
        }
        return sum;
    }

}

function layoutMekko(data, getVal,sort){
    var v = getVal || function(d){ return d.value; };
    var res = { 'value' : 0 };
    res['values'] = data.slice(0);
    // Sum values for total and series
    for(var e, i=0, a=res['values'], n=a.length; i<n; i+=1){ e = a[i];
        e['value'] = 0;
        for(var f, j=0, b=e['values'], o=b.length; j<o; j+=1){ f = b[j];
            e['value'] += v(f);
        }
        res['value'] += e['value'];
        e.seriesIndex = i;
    }
    // Set x,y and dx,dy for rectangles
    for(var e, i=0, a=res['values'], n=a.length; i<n; i+=1){ e = a[i];
        var last = a[i-1];
        //e.x = (i>0 ? v(last)/ res.value : 0);
        e.x = i>0 ? (last.x + last['values'][0].dx) : 0;
        for(var f, j=0, b=e['values'], o=b.length; j<o; j+=1){ f = b[j];
            f.seriesIndex = e.seriesIndex;
            var last = b[j-1];
            f.x = e.x;
            f.dx =  e.value;
            //f.y = (j > 0 ? ( last.y -  v(f) / e.value ) : ( e.value- v(f) ) / e.value); // first series at bottom
            f.y = (j > 0 ? (last.y +  last.dy) : 0);
            f.dy =  v(f) / e.value;
        }
    }
    //return (data = res);
    return res;
}
