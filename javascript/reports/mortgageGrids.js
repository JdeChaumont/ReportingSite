//*******************************************************************************
// Grid/Report definitions
//*******************************************************************************
function defaultDims(dims,state,override){ // inflates a key based on dims registered in state
    var ret = {};
    for(var e, i=0, a=dims, n=a.length; i<n; i+=1){ e = a[i];
        ret[e] = state[e]||'_';
    }
    if(override){
        for(var k in override){
            ret[k] = override[k];
        }
    }
    return ret;
}
// Helper function to reset filter
function setDims(dims,state,override,exclude){ // inflates a key based on dims registered in state
    var ret = {};
    for(var e, i=0, a=dims, n=a.length; i<n; i+=1){ e = a[i];
        if(exclude&&exclude.hasOwnProperty(e)){
            // do nothing
        } else {
            ret[e] = '_';
        }
    }
    if(override){
        for(var k in override){
            ret[k] = override[k];
        }
    }
    //console.log(ret);
    return ret;
}

// Helper functions to help with encoded/decoding - won't work for subFilters
function encodeKey(key){
    for(var k in key){
        if(dimsEncoded[k]&&dimsEncoded[k]['values'][key[k]]){
            key[k] = dimsEncoded[k]['values'][key[k]];
        }
    }
}

function encodeKeys(rowsOrCols){
    if(rowsOrCols){
        rowsOrCols.forEach(function(e,i,a){
            if(e['key']){
                encodeKey(e['key']);
                if(e['key']['subFilter']){
                    encodeKey(e['key']['subFilter']);
                }
            }
        })
    }
}

function encodeDef(def){
    if(def['cols']){
        encodeKeys(def['cols']);
    }
    if(def['rows']){
        encodeKeys(def['rows']);
    }
    return def;
}

//console.log(defaultDims(dataDims,state));

function portfolioColumns(){
    return  [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                //{ display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"}, chartType : nv.models.sparkbarPlus },
                { display : "#", format : fd, key : { mre : "count"} },
                { display : "Avg €", format : fc, key : ofTotalHelper( { mre : "bal" }, "Avg", [ { mre : "bal" }, { mre : "count" } ]), page : '0' },
                { display : "Balance", format : fv, key : { mre : "bal"} },
                // Default Page
                { display : "% of Total", format : fp, key : ofTotalHelper( { mre : "bal" }, "OfTotalArr", [ {  mre : "bal" }, setDims(dataDims,state,{ mre : "bal"}) ]), page : '0' },
                //{ display : "% of All", format : fp, key : ofTotalHelper( { mre : "bal" }, "OfTotal", [ { mre : "bal" }, setDims(dataDims,state,{mre : "bal"},{'dpd_band' : 1, npl : 1} ) ]), page : '0' },
                { display : "Provision", format : fv, key : { mre : "prv"}, page : '0'  },
                { display : "Prov Rate", format : fp, key : ofTotalHelper( { mre : "prv" }, "prvRate", [ { mre : "prv" }, { mre : "bal"} ]), page : '0' },
                // Page 1 - Financial Characteristics
                { display : "Avg Yield %", format : fmt(',.2f','',1), key : ofTotalHelper( { mre : "ew_int_rate" }, "iRate", [ { mre : "ew_int_rate" }, { mre : "bal"} ]), page : '1' },
                { display : "Avg Term <BR> (remaining)", key : ofTotalHelper( { mre : "ew_rem_term" }, "remTerm", [ { mre : "ew_rem_term" }, { mre : "bal"} ]), page : '1' },
                { display : "Avg Time <BR> on Book", key : ofTotalHelper( { mre : "ew_TOB" }, "TOB", [ { mre : "ew_TOB" }, { mre : "bal"} ]), page : '1' },
                { display : "Avg Days <BR> in Arrears", key : ofTotalHelper( { mre : "ew_DiA" }, "DiA", [ { mre : "ew_DiA" }, { mre : "bal"} ]), page : '1' },
                { display : "iLTV %", key : ofTotalHelper( { mre : "ew_iLTV" }, "iLTV", [ { mre : "ew_iLTV", secured : "Y" }, { mre : "bal", secured : "Y"} ]), page : '1' },
                // Page 2 - KPI's - % Arrears, >90, NPL, Forborne, Closure
                { display : "Arrears %", format : fp, key : ofTotalHelper( { mre : "bal" }, "ArrsPc", [ { mre : "bal", subFilter : { dpd : xfFilter('dpd','Arrs',function(d){return d!=="UTD";}) }  }, { mre : "bal" } ]), page : '2' },
                { display : ">90 days %", format : fp, key : ofTotalHelper( { mre : "bal" }, "90PlusPc", [ { mre : "bal", subFilter : { dpd : ">90"  }}, { mre : "bal" } ]), page : '2'  },
                { display : "NPL %", format : fp, key : ofTotalHelper( { mre : "bal" }, "NPLPc", [ { mre : "bal", subFilter : { npl : "b"  }}, { mre : "bal" } ]), page : '2'  },
                { display : "Forborne %", format : fp, key : ofTotalHelper( { mre : "bal" }, "FbPc", [ { mre : "bal", subFilter : { forborne : "Y"}}, { mre : "bal" } ]), page : '2' },

            ];
}

rptDef0 = function() {
    return encodeDef({
        ref: 0,
        name : "rpt0",
        container : "rptDivision",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Core", key : { ent : "Core" } },
                    { display : "Non-core", key : { ent : "Non-core" } },
                    { display : " ", css : "blank" },
                    { display : "Portfolios", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "HL", key : { prt : "HL" } },
                    { display : "BTL", key : { prt : "BTL" } },
                    { display : " ", css : "blank" },
                    { display : "Deleverage", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "Hold", key : { sale : "N" } },
                    { display : "Sale Agreed", key : { sale : "Y" } },


                    ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef1 = function() {
    return encodeDef({
        ref: 1,
        name : "rpt1",
        container : "rptArrears",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "UTD", key : { dpd_band : "UTD" } },
                    { display : "0-30 days", key : { dpd_band : "0-30" } },
                    { display : "30-60", key : { dpd_band : "30-60" } },
                    { display : "60-90", key : { dpd_band : "60-90" } },
                    { display : ">90", key : { dpd : ">90" } },
                    { display : " ", css : "blank" },
                    { display : "Non-performing", css : "blank" },
                    { display : "Total", key : { npl : "Y" } },
                    { display : " ", css : "blank" },
                    { display : "UTD", key : { npl : "Y", dpd : "UTD" } },
                    { display : "0-30 days", key : { npl : "Y", dpd : ">0" } },
                    { display : "30-90", key : { npl : "Y", dpd : ">30" } },
                    { display : "90-180", key : { npl : "Y", dpd_band : "90-180" } },
                    { display : "180-360", key : { npl : "Y", dpd_band : "180-360" } },
                    { display : "360-720", key : { npl : "Y", dpd_band : "360-720" } },
                    { display : "720+", key : { npl : "Y", dpd_band : "720+" } },
                    { display : " ", css : "blank" },
                    { display : "Performing", css : "blank" },
                    { display : "Total", key : { npl : "N" } },
                    { display : " ", css : "blank" },
                    { display : "UTD", key : { npl : "N", dpd : "UTD" } },
                    { display : "0-30 days", key : { npl : "N", dpd_band : "0-30" } },
                    { display : "30-60", key : { npl : "N", dpd_band : "30-60" } },
                    { display : "60-90", key : { npl : "N", dpd_band : "60-90" } },
                    { display : ">90", key : { npl : "N", dpd : ">90" } },

                    ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef2 = function() {
    return encodeDef({
        ref: 2,
        name : "rpt2",
        container : "rptFB",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Not Forborne", key : { forborne : "N" } },
                    { display : "Forborne", key : { forborne : "Y" } },
                    { display : " ", css : "blank" },
                    { display : "Measures", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "Term extension", key : { fb : "Term extension" } },
                    { display : "Capitalisation", key : { fb : "Capitalisation" } },
                    { display : "Hybrid", key : { fb : "Hybrid" } },
                    { display : ">I/O", key : { fb : ">I/O" } },
                    { display : "I/O", key : { fb : "I/O" } },
                    { display : "&lt;I/O", key : { fb : "<I/O" } },
                    { display : "Split", key : { fb : "Split" } },
                    { display : "Zero", key : { fb : "Zero" } },
                    { display : "Other", key : { fb : "Other" } },
                    { display : " ", css : "blank" },
                ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef3 = function() {
    return encodeDef({
        ref: 3,
        name : "rpt3",
        container : "rptRate",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Rate Type", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "Tracker", key : { int_rate_type : "Tracker" } },
                    { display : "Variable", key : { int_rate_type : "Variable" } },
                    { display : "Fixed", key : { int_rate_type : "Fixed" } },
                    { display : " ", css : "blank" },
                    /*{ display : "Yield", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "0%", key : { int_rate_band : "=0" } },
                    { display : ">0-<1%", key : { int_rate_band : "0<1.0" } },
                    { display : "1.0<=2.0%", key : { int_rate_band : "1.0<=2.0" } },
                    { display : "2.0<=5.0%", key : { int_rate_band : "2.0<=5.0" } },
                    { display : "5.0<=10.0%", key : { int_rate_band : "5.0<=10.0" } },
                    { display : "10.0<=20.0%", key : { int_rate_band : "10.0<=20.0" } },
                    { display : "Not Applicable", key : { int_rate_band : "NA" } },
                    { display : " ", css : "blank" },*/
                    { display : "Origination", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "pre-2002", key : { orig_band : "-<2001" } },
                    { display : "2002-2004", key : { orig_band : "2002-2004" } },
                    { display : "2005-2008", key : { orig_band : "2005-2008" } },
                    { display : "2009-2011", key : { orig_band : "2009-2011" } },
                    { display : "post-2011", key : { orig_band : "2012<-\t" } }
                ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef4 = function() {
    return encodeDef({
        ref: 4,
        name : "rpt4",
        container : "rptLoanSize",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Repayment Type", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "C&I", key : { repay_type : "C&I" } },
                    { display : "Part C&I", key : { repay_type : "Part C&I" } },
                    { display : "I/O", key : { repay_type : "I/O" } },
                    { display : " ", css : "blank" },
                    { display : "Loan Size", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "0-<5K", key : { loan_size_band : "0-<5k" } },
                    { display : "5K-<10K", key : { loan_size_band : "5K-<10K" } },
                    { display : "10K-<20K", key : { loan_size_band : "10K-<20K" } },
                    { display : "20K-<50K", key : { loan_size_band : "20K-<50K" } },
                    { display : "50K-<100K", key : { loan_size_band : "50K-<100K" } },
                    { display : "100K-<250K", key : { loan_size_band : "100K-<250K" } },
                    { display : "250K-<500K", key : { loan_size_band : "250K-<500K" } },
                    { display : "500K-<1M", key : { loan_size_band : "500K-<1M" } },
                    { display : "1M-high+", key : { loan_size_band : "1M-high" } }
                ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef5 = function() {
    return encodeDef({
        ref: 5,
        name : "rpt5",
        container : "rptLTV",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "0-70%", key : { ltv_band : "<=70" } },
                    { display : "70-<100%", key : { ltv_band : "70-<100" } },
                    { display : "100-<120", key : { ltv_band : "100-<120" } },
                    { display : "120-<150", key : { ltv_band : "120-<150" } },
                    { display : "150+", key : { ltv_band : "150+" } },
                    { display : "Exclusions", key : { ltv_band : "LTVexclusions" } },
                    { display : "N/A", key : { ltv_band : "NA" } },
                    { display : " ", css : "blank" },
                    { display : "Equity", css : "blank" },
                    { display : "Positive", key : { neg_eq : "N" } },
                    { display : "Negative", key : { neg_eq : "Y" } },
                    ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef6 = function() {
    return encodeDef({
        ref: 6,
        name : "rpt6",
        container : "rptGeo",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Ireland", key : { sec_ctry : "IE" } },
                    { display : "Missing", key : { sec_ctry : "Missing" } },
                    { display : " ", css : "blank" },
                    { display : "RoI", css : "blank" },
                    { display : "Dublin", key : { region : "Dublin" } },
                    { display : "Leinster (rest of)", key : { region : "Leinster" } },
                    { display : "Cork", key : { region : "Cork" } },
                    { display : "Munster (rest of)", key : { region : "Munster" } },
                    { display : "Connacht", key : { region : "Connacht" } },
                    { display : "Ulster", key : { region : "Ulster" } },
                    { display : " ", css : "blank" },
                ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef7 = function() {
    return encodeDef({
        ref: 7,
        name : "rpt7",
        container : "rptCounties",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" } //need to reserve space
                ].concat(
                    ["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny",
                    "Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan",
                    "Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"].map(function(e,i,a){
                        return { display : e, key : { sec_county : e } };
                    })
                ),
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

function highlightRow(e){
    d3.select(this).classed("activeRow",true);
}
function unhighlightRow(e){
    d3.select(this).classed("activeRow",false);
}
