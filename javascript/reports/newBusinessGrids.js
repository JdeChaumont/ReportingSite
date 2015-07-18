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
    if(dimsEncoded){
        if(def['cols']){
            encodeKeys(def['cols']);
        }
        if(def['rows']){
            encodeKeys(def['rows']);
        }
        return def;
    }
    return def;
}

//console.log(defaultDims(dataDims,state));

function portfolioColumns(){
    return  [ 	{ display : "", css : "h4" }, //need to reserve space and set css
                //{ display : "Movement 13 mths", css : "sparkline" , key : { mre : "BlD"}, chartType : nv.models.sparkbarPlus },
                { display : "#", format : fd, key : { mre : "count"} },
                { display : "Avg €", format : fc, key : ofTotalHelper( { mre : "LOAN_AMOUNT" }, "Avg", [ { mre : "LOAN_AMOUNT" }, { mre : "count" } ]) },
                { display : "Balance", format : fv, key : { mre : "LOAN_AMOUNT"} },
                // Default Page
                { display : "% of Total", format : fp, key : ofTotalHelper( { mre : "LOAN_AMOUNT" }, "OfTotalArr", [ {  mre : "LOAN_AMOUNT" }, setDims(dataDims,state,{ mre : "LOAN_AMOUNT"}) ]), page : '0' },
                { display : "Avg Yield %", format : fmt(',.2f','',1), key : ofTotalHelper( { mre : "EW_INT_RATE" }, "iRate", [ { mre : "EW_INT_RATE" }, { mre : "LOAN_AMOUNT"} ]), page : '0' },
                // Page 1 - Financial Characteristics
                { display : "Avg Term", key : ofTotalHelper( { mre : "EW_TERM" }, "remTerm", [ { mre : "EW_TERM" }, { mre : "LOAN_AMOUNT"} ]), page : '1' },
                { display : "iLTV %", key : ofTotalHelper( { mre : "WEIGHTED_LTV_CALC" }, "iLTV", [ { mre : "WEIGHTED_LTV_CALC" }, { mre : "LOAN_AMOUNT"} ]), page : '1' },
                { display : "LTI", key : ofTotalHelper( { mre : "WEIGHTED_LTI_CALC" }, "LTI", [ { mre : "WEIGHTED_LTI_CALC" }, { mre : "LOAN_AMOUNT"} ]), page : '1' },
                // Page 2 - KPI's - % Arrears, >90, NPL, Forborne, Closure
                { display : ">3.5 LTI", format : fp, key : ofTotalHelper( { mre : "LOAN_AMOUNT" }, "LTIPc", [ { mre : "LOAN_AMOUNT", subFilter : { LTIGTReg : xfFilter('LTIGTReg','LTIGTRegY',function(d){return d!=="Y";}) }  }, { mre : "LOAN_AMOUNT" } ]), page : '2' },
                { display : ">80% LTV", format : fp, key : ofTotalHelper( { mre : "LOAN_AMOUNT" }, "LTVPc", [ { mre : "LOAN_AMOUNT", subFilter : { LTVGTReg : xfFilter('LTVGTReg','LTVGTRegY',function(d){return d!=="Y";}) }  }, { mre : "LOAN_AMOUNT" } ]), page : '2' },
                { display : ">100% LTV", format : fp, key : ofTotalHelper( { mre : "LOAN_AMOUNT" }, "NegEqPc", [ { mre : "LOAN_AMOUNT", subFilter : { LTVGT100 : xfFilter('LTVGT100','LTVGT100Y',function(d){return d!=="Y";}) }  }, { mre : "LOAN_AMOUNT" } ]), page : '2' },

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
                    { display : "LTV/LTI Eligible", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "First Time Buyer", key : { REPORTING_CATEGORY : "FTB" } },
                    { display : "Second Time Buyer", key : { REPORTING_CATEGORY : "STB" } },
                    { display : "Buy-to-Let", key : { REPORTING_CATEGORY : "BTL" } },
                    { display : " ", css : "blank" },
                    { display : "Other", css : "blank" },
                    { display : " ", css : "blank" },
                    { display : "Switcher", key : { REPORTING_CATEGORY : "Switch" } },
                    { display : "Negative Equity", key : { REPORTING_CATEGORY : "Neg. Eq." } },
                    { display : "CCMA", key : { REPORTING_CATEGORY : "CCMA" } },
                    ],
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef1 = function() {
    return encodeDef({
        ref: 1,
        name : "rpt1",
        container : "rptLoans",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Loan Size", css : "blank" },
                    { display : " ", css : "blank" },
                ].concat(["<=50K","50K-<=100K","100K-<=150K","150K-<=200K","200K-<=250K","250K-<=500K","500K-<=1M",">1M"].map(function(e,i,a){
                        return { display : e, key : { LOAN_SIZE_BANDS : e } };
                    })
                ).concat([ 	{ display : "", css : "blank" }, //need to reserve space
                            { display : "Term", css : "blank" },
                            { display : " ", css : "blank" }
                        ]
                ).concat(["<=5","6-10","11-15","16-20","21-25","26-30","31-35","36-40",">40"].map(function(e,i,a){
                        return { display : e, key : {TERM_BANDS : e } };
                    })

                ),
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef2 = function() {
    return encodeDef({
        ref: 2,
        name : "rpt2",
        container : "rptCredit",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                    { display : "Total", key : {  } },
                    { display : " ", css : "blank" },
                    { display : "Loan To Value", css : "blank" },
                    { display : " ", css : "blank" },
                ].concat(["<=50",">50<=55",">55<=60",">60<=65",">65<=70",">70<=75",">75<=80",">80<=85",">85<=90",">90<=95",">95<=100",">100%"].map(function(e,i,a){
                        return { display : e, key : { LTV_BAND : e } };
                    })
                ).concat([ 	{ display : " ", css : "blank" }, //need to reserve space
                            { display : "Loan To Income", css : "blank" },
                            { display : " ", css : "blank" }
                        ]
                ).concat(["<=1","1-2","2-2.5","2.5-3","3-3.5","3.5-4","4-4.5","4.5-5",">5"].map(function(e,i,a){
                        return { display : e, key : { LTI_BAND : e } };
                    })

                ),
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef3 = function() {
    return encodeDef({
        ref: 3,
        name : "rpt3",
        container : "rptRegions",
        key : defaultDims(dataDims,state,{'mre':'LOAN_AMOUNT'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" }, //need to reserve space
                        { display : "Broker", key : { BRANCH_REGION : "Broker" } },
                        { display : " ", css : "blank" },
                        { display : "Branches", css : "blank" }
                ].concat(
                    ["Dublin NW","North East","South","Dublin NE","CCMA","South East",
                    "Dublin South","West","East","South West","North West"].sort().map(function(e,i,a){
                        return { display : e, key : { BRANCH_REGION : e } };
                    })
                ),
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef4 = function() {
    return encodeDef({
        ref: 4,
        name : "rpt4",
        container : "rptCounties",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" } //need to reserve space
                ].concat(
                    ["Carlow","Cavan","Clare","Cork","Donegal","Dublin","Galway","Kerry","Kildare","Kilkenny",
                    "Laois","Leitrim","Limerick","Longford","Louth","Mayo","Meath","Monaghan",
                    "Offaly","Roscommon","Sligo","Tipperary","Waterford","Westmeath","Wexford","Wicklow"].map(function(e,i,a){
                        return { display : e, key : { COUNTY_AREA : e } };
                    })
                ),
        eventHandlers : { '.cell' : { click : cellClicked }, 'tr' : { mouseover : highlightRow, mouseout : unhighlightRow } }
    });
}

rptDef6 = function() {
    return encodeDef({
        ref: 6,
        name : "rpt6",
        container : "rptBranches",
        key : defaultDims(dataDims,state,{'mre':'bal'}),
        cols : portfolioColumns(),
        rows : [ 	{ display : "" } //need to reserve space
                ].concat(
                    regionsAndBranches['units'][selRegion()].map(function(e,i,a){
                        return { display : e.substr(0,20), key : { BRANCH_NAME : e } };
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
