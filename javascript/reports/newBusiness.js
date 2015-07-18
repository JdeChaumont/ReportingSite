//*******************************************************************************
// Configuration requirements
//*******************************************************************************
var targetDef = document.getElementById('spin2');
var spinner = spin();
//*******************************************************************************
// Configuration requirements
//*******************************************************************************
var utilsValues = {
    "shortmonths"	: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    "monthsletters"	: ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"],
    "fullmonths"	: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    "shortdays"		: ["M", "T", "W", "T", "F", "S", "S"],
    "fulldays" 		: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],

}
var numPeriods = periods.mth.length;

//*******************************************************************************
//Step 4 - Create Dashboard - moved from jdcGrid
//*******************************************************************************
//Defaults for report defnition - Helper function for accessing state properties
function reportDefaults(current,YTDMths){
    var ret = {};
    ret.e = function(){return state.entity();}; //this might be changed
    ret.p = function(){return state.portfolio();};
    ret.u = function(){return state.uom();};

    //ret.c = function(){return current;};
    ret.c = function(){return state.rptPeriod();};
    ret.l = function(){return current-1;};
    ret.ly = function(){return current-12;};
    ret.ytd = function(){return YTDMths;};

    return ret;
}
var def = reportDefaults(numPeriods-1,0);

$(document).ready(function(){
        if(!document.createElement('svg').getAttributeNS){
          document.write('Your browser does not support SVG!');
          return;
        }
});

// Global variable
var anchor,state,rpts = {}, dataDims, pxf, dataNew, dimsEncoded, displayNames;
var regionsAndBranches, selRegion;

    function displayFilters(key,long){
        var ret = "";
        //console.log(key);
        for(k in key){
            if(dims[k]){
                var v=f(key[k]);
                if(long===true || v!=='_'){
                    if(ret!==""){ ret+=" - ";};
                    var dimValue = v.label ||  v;
                    if(displayNames[k]) { dimValue = v.label || displayNames[k][v] || v; }
                    if(mres[v]) { dimValue = mres[v].display};
                    ret += dims[k].display + ": " + dimValue;
                }
            }
        }
        return ret;
    }

function shapeNewBusinessData(){

    			function proper(d){
    				return d.toProperCase();
    			}
    			//var data = loadDSV(CSV,",");
    			//console.log(data[0]);

    			dataNew = payLoad(); // console.log(dataNew);
    			//console.log(dataNew);
    			//console.log(dataNew.data[0]);
                //console.log(JSON.stringify(dataNew['dims']));
                //console.log(JSON.stringify(dataNew['measures']));

    			var dims = ["APPLICATION_NUMBER","LTV_IN_SCOPE_FOR_REGS","LTI_IN_SCOPE_FOR_REGS","DATA_SETS","FUNDED_POST_REGS_FLAG","REPORTING_CATEGORY","STAGE_PAYMENT_FLAG","FUND_DATE","OFFER_DATE","RCC_AIP_DATE_CURRENT","MIN_RCC_AIP_DATE","APP_RECEIVED_DATE","CHANNEL","BRANCH_REGION","BRANCH_NAME","BROKER_NAME","BROKER_GROUP","LOAN_SIZE_BANDS","LOAN_TYPE","TOP_UP_FLAG","PROPERTY_STYLE","NUM_BEDROOMS","LIVING_AREA_SQ_M","COUNTY_AREA","LTV_BAND","LTV_BREACH_AMOUNT_BAND","LTV_BREACH_FLAG","LTI_BAND","LTI_BREACH_AMOUNT_BAND","LTI_BREACH_FLAG","DUAL_BREACH_FLAG","INTEREST_RATE","RATE_TYPE","PORTFOLIO","LOAN_TERM_YEARS","TERM_BANDS","AGE_OF_VAL_AT_FUNDING_IN_DAYS","FUND_MONTH","FUND_YEAR","OFFER_MONTH","OFFER_YEAR","APPLICATION_YEAR","APPLICATION_MONTH","IRB_CLASS","ACTUAL_SCORE","REPAYMENT_TYPE","comp_date","tDayOfWeek","daysOfWeek","monthsOfYear","tmonth","tyear","tWeekOfMonth","tWeekOfYear"];
    			var mres = ["LOAN_AMOUNT","CURRENT_LOAN_BALANCE","PROPERTY_VALUE","ACTUAL_LTV","WEIGHTED_LTV_CALC","ACTUAL_LTI","WEIGHTED_LTI_CALC","EW_INT_RATE","EW_TERM","OFFER_TO_FUND_IN_DAYS","LTV_BREACH_AMOUNT","LTI_BREACH_AMOUNT"];

                var dimsInclude = ["APPLICATION_NUMBER","LTV_IN_SCOPE_FOR_REGS","LTI_IN_SCOPE_FOR_REGS","DATA_SETS","FUNDED_POST_REGS_FLAG","REPORTING_CATEGORY","STAGE_PAYMENT_FLAG","FUND_DATE","OFFER_DATE","RCC_AIP_DATE_CURRENT","MIN_RCC_AIP_DATE","APP_RECEIVED_DATE","CHANNEL","BRANCH_REGION","BRANCH_NAME","BROKER_NAME","BROKER_GROUP","LOAN_SIZE_BANDS","LOAN_TYPE","TOP_UP_FLAG","PROPERTY_STYLE","NUM_BEDROOMS","LIVING_AREA_SQ_M","COUNTY_AREA","LTV_BAND","LTV_BREACH_AMOUNT_BAND","LTV_BREACH_FLAG","LTI_BAND","LTI_BREACH_AMOUNT_BAND","LTI_BREACH_FLAG","DUAL_BREACH_FLAG","INTEREST_RATE","RATE_TYPE","PORTFOLIO","LOAN_TERM_YEARS","TERM_BANDS","AGE_OF_VAL_AT_FUNDING_IN_DAYS","FUND_MONTH","FUND_YEAR","OFFER_MONTH","OFFER_YEAR","APPLICATION_YEAR","APPLICATION_MONTH","IRB_CLASS","ACTUAL_SCORE","REPAYMENT_TYPE","comp_date","tDayOfWeek","daysOfWeek","monthsOfYear","tmonth","tyear","tWeekOfMonth","tWeekOfYear"];
    			var dimIncludeTransform = [];
    			var dimsSpecial = ["FUND_DATE","OFFER_DATE","BROKER_NAME","APP_RECEIVED_DATE"];
    			var mresInclude = ["LOAN_AMOUNT","CURRENT_LOAN_BALANCE","PROPERTY_VALUE","ACTUAL_LTV","WEIGHTED_LTV_CALC","ACTUAL_LTI","WEIGHTED_LTI_CALC","EW_INT_RATE","EW_TERM","OFFER_TO_FUND_IN_DAYS","LTV_BREACH_AMOUNT","LTI_BREACH_AMOUNT"];

    			function updateRecord(tgt,src){
    				dims.forEach(function(e,i,a){
    					if(dimIncludeTransform[i]){
    						tgt[e] = dimIncludeTransform[i](src[e]);
    					} else {
    						tgt[e] = src[e];
    					}
    				});
    				mresInclude.forEach(function(e,i,a){
    					tgt['values'][e] = [];
    					tgt['values'][e].push(src[e]);
    				});
    			}

    			function createRecord(src,fld){
    				var ret = { set : fld,"values" : {} }; //console.log(src);
    				updateRecord(ret,src);
    				return ret;
    			}

                function processData(data){
                    ret = [];
                    data.forEach(function(e,i,a){
                        if(e["CHANNEL"]==="BROKER"){
    						e["BRANCH_NAME"]=e["BROKER_NAME"];
    					}
                        if(e["tyear"] === 2015){
                            ret.push(createRecord(e,e["DATA_SETS"]));
                        }
                    });
                    ret.forEach(function(e,i,a){
                        e["values"]["count"] = [1];
                        //e["values"]["ew_int_rate"] = [e["values"]["LOAN_AMOUNT"][0]*e["values"]["INTEREST_RATE"][0]];
                        //e["values"]["ew_term"] =  [e["values"]["LOAN_AMOUNT"][0]*e["values"]["LOAN_TERM_YEARS"][0]];
                        //e["loan_size_band"] = bandMetric(loan_size_bands,e["values"]["LOAN_AMOUNT"][0]);
                        //e["lti_band"] = bandMetric(lti_bands,e["values"]["ACTUAL_LTI"][0]);
                        //e["term_band"] = bandMetric(term_bands,e["values"]["LOAN_TERM_YEARS"][0]);
                        e["LTIGTReg"] = bandMetric(LTI_Reg_bands,e["values"]["ACTUAL_LTI"][0]);;
                        e["LTVGTReg"] = bandMetric(LTV_Reg_bands,e["values"]["ACTUAL_LTV"][0]);;
                        e["LTVGT100"] = bandMetric(LTV_100_bands,e["values"]["ACTUAL_LTV"][0]);;

                    });
                    return ret;
                }

    			var loan_size_bands ={
    				values : [5e4,1e5,2.5e5,5e5,1e6],
    				labels : ["<=50K","50K-<=100K","100K-<=250K","250K-<=500K","500K-<=1M",">1M"]
    			}
    			var lti_bands ={
    				values : [1.0,2.0,2.5,3.0,3.5,4.0,4.5,5.0],
    				labels : ["<=1","1-2","2-2.5","2.5-3","3-3.5","3.5-4","4-4.5","4.5-5",">5"]
    			}
                var term_bands ={
                    values : [5,10,15,20,25,30,35,40],
                    labels : ["<=5","5-10","10-15","15-20","20-25","25-30","30-35","35-40",">40"]
                }
                var LTI_Reg_bands ={
    				values : [3.5],
    				labels : ["N","Y"]
    			}
                var LTV_Reg_bands ={
    				values : [80],
    				labels : ["N","Y"]
    			}
                var LTV_100_bands ={
    				values : [100],
    				labels : ["N","Y"]
    			}

                var x = 0;
    			function bandMetric(bands,value){ //if(++x<100) { console.log(value); }
    				var vals = bands.values, labels = bands.labels;
    				if(value>vals[vals.length-1]){
    					return labels[labels.length-1];
    				}
    				for(var e, i=0, a=vals, n=a.length; i<n; i+=1){ e = a[i]; //if(x<100) { console.log(e) };
    					if(value<=e){
    						if(i===0){
    							return labels[0];
    						}
    						return labels[i-1];
    					}
    				}

    			}

                var data = processData(dataNew["data"]);
    			//console.log(data.length);
    			//console.log(data.slice(0,3));

    			//console.log(JSON.stringify(Object.keys(data[0])));
    			//console.log(JSON.stringify(Object.keys(data[0]['values'])));

    			var dimsTotal = ["APPLICATION_NUMBER","LTV_IN_SCOPE_FOR_REGS","LTI_IN_SCOPE_FOR_REGS","DATA_SETS","FUNDED_POST_REGS_FLAG","REPORTING_CATEGORY","STAGE_PAYMENT_FLAG","FUND_DATE","OFFER_DATE","RCC_AIP_DATE_CURRENT","MIN_RCC_AIP_DATE","APP_RECEIVED_DATE","CHANNEL","BRANCH_REGION","BRANCH_NAME","BROKER_NAME","BROKER_GROUP","LOAN_SIZE_BANDS","LOAN_TYPE","TOP_UP_FLAG","PROPERTY_STYLE","NUM_BEDROOMS","LIVING_AREA_SQ_M","COUNTY_AREA","LTV_BAND","LTV_BREACH_AMOUNT_BAND","LTV_BREACH_FLAG","LTI_BAND","LTI_BREACH_AMOUNT_BAND","LTI_BREACH_FLAG","DUAL_BREACH_FLAG","INTEREST_RATE","RATE_TYPE","PORTFOLIO","LOAN_TERM_YEARS","TERM_BANDS","AGE_OF_VAL_AT_FUNDING_IN_DAYS","FUND_MONTH","FUND_YEAR","OFFER_MONTH","OFFER_YEAR","APPLICATION_YEAR","APPLICATION_MONTH","IRB_CLASS","ACTUAL_SCORE","REPAYMENT_TYPE","comp_date","tDayOfWeek","daysOfWeek","monthsOfYear","tmonth","tyear","tWeekOfMonth","tWeekOfYear"];
    			var mresTotal = ["LOAN_AMOUNT","CURRENT_LOAN_BALANCE","PROPERTY_VALUE","ACTUAL_LTV","WEIGHTED_LTV_CALC","ACTUAL_LTI","WEIGHTED_LTI_CALC","EW_INT_RATE","EW_TERM","OFFER_TO_FUND_IN_DAYS","LTV_BREACH_AMOUNT","LTI_BREACH_AMOUNT","ACTUAL_SCORE","LIVING_AREA_SQ_M","AGE_OF_VAL_AT_FUNDING_IN_DAYS"];

                var dimsToFilter = ["set","tDayOfWeek","daysOfWeek","monthsOfYear","tmonth","tyear","tWeekOfMonth","tWeekOfYear",
                "CHANNEL","BRANCH_REGION","BRANCH_NAME",
                "PORTFOLIO","REPORTING_CATEGORY","STAGE_PAYMENT_FLAG","LOAN_TYPE","TOP_UP_FLAG",
                "LOAN_SIZE_BANDS", "LTV_BAND","LTI_BAND","RATE_TYPE","TERM_BANDS","REPAYMENT_TYPE",
                "IRB_CLASS",
                "PROPERTY_STYLE","NUM_BEDROOMS", "COUNTY_AREA",
                "FUNDED_POST_REGS_FLAG","DUAL_BREACH_FLAG",
                "LTV_IN_SCOPE_FOR_REGS","LTV_BREACH_FLAG",
                "LTI_IN_SCOPE_FOR_REGS","LTI_BREACH_FLAG"];

                return { "dims":dimsToFilter, "measures":mresTotal, "data":data };

}


function loadReport(){

    $(".splash").slideUp('slow');

    dataNew = shapeNewBusinessData(); // console.log(dataNew);
    console.log(dataNew);
    //console.log(dataNew.data[0]);

    //*******************************************************************************
    // Create User Interface
    //*******************************************************************************
    anchor = anchorManager(); //then attach handler
    state = stateManager(anchor,dataNew["data"]);

    //Sets up buttons and adds them to state object
    var css = "btn btn-custom";
    var cssBtnSm = "btn btn-custom btn-sm";
    //*******************************************************************************
    //Report Buttons
    //*******************************************************************************
    //Changed to dropdown
    var report = stateElementDropdown(state, "report", "dropdown-style",
        ["Group Overview ","Loan Characteristics", "Credit Characteristics", "Regions", "Counties", "Marimekko","Branches"],null,
        [reportChange("rpt"),outputStyle("rpt")]); //Additional Handler to fade in/out pages


    //Handler to add to report state to test output of getComputedStyle
    function outputStyle(id){
        return function(stateObj,refNo){
            return function(){
                var selector = "#" + id + stateObj["controls"][refNo] + " .table" ;
                var element = $(selector)[0];
            }
        }
    }

    //*******************************************************************************
    // Back to UI creation
    //*******************************************************************************
    // 20150708 - New functionality to generate the report structures from js - needs to be done before report controls are created
    dReport( { 'container' : '#rpt0', 'body' : { 'id' : 'rptDivision'}, 'title' : { 'html' : 'Group Profile' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt1', 'body' : { 'id' : 'rptLoans'}, 'title' : { 'html' : 'Loan Characteristics' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt2', 'body' : { 'id' : 'rptCredit'}, 'title' : { 'html' : 'Credit Characteristics' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt3', 'body' : { 'id' : 'rptRegions'}, 'title' : { 'html' : 'Regions' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt4', 'body' : { 'id' : 'rptCounties'}, 'title' : { 'html' : 'Counties' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt5', 'body' : { 'id' : 'mekkoChart', 'style' : 'display:block;padding:0'}, 'controlsContainer' : { 'style' : 'padding:0;display:block;margin-left:30px;margin-right:auto' },'controls' : [ {'id':'mekkoV','class':"wrapper-dropdown-1"},{'id':'mekkoH','class':"wrapper-dropdown-1"} ] } );
    // Hack - because cannot dynamically determine DOM type
    d3.select('#mekkoChart').append('svg');
    dReport( { 'container' : '#rpt6', 'body' : { 'id' : 'rptBranches'}, 'title' : { 'html' : 'Branches' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'},{'id':'selRegion','class':"wrapper-dropdown-1"} ] } );

    var rptPortfolio = stateElement(state, "set", css,["All","Applications","Offers","Funded"],["_","Application","Offer","Funded"],null,1,[0,3,2,1]);
    var rptPeriod = stateElement(state, "rptPeriod", cssBtnSm,["YTD 2015"],[0],null,0);
    var rptUOM = stateElement(state, "uom", cssBtnSm,["€", "#"],['LOAN_AMOUNT','count']);

    //*******************************************************************************
    // Set-up Data
    //*******************************************************************************
    dataDims = dataNew['dims'];
    dataDims = ['mre'].concat(dataDims); // Hack to add here - could check for tgt in dProvider and add there
    dimsEncoded = dataNew['dimsEncoded'];
    console.log(JSON.stringify(dimsEncoded));

    var dimsToAddToFilter = [];

    // Helper functions to help with encoded/decoding
    function encodeValueMap(dim, valueMap){
        var ret = {};
        for(var k in valueMap){
            if(dimsEncoded[dim]){
                var mappedValue = dimsEncoded[dim]['values'][k];
                if(mappedValue) {
                    ret[mappedValue] = valueMap[k];
                }
            }
        }
        return ret;
    }

    //*******************************************************************************
    // Helper Functions to print out dims and measures
    //*******************************************************************************
    function printDims(){
        var ret = [];
        dataDims.forEach(function(e,i,a){
            ret.push( {'name' : e, 'value' : i} );
        });
        return ret;
    };

    function printDims(){
        var ret = {};
        dataDims.forEach(function(e,i,a){
            ret[e] = {'display' : e, 'value' : i};
        });
        return ret;
    };

    function printMres(){
        var ret = {};
        dataNew['measures'].forEach(function(e,i,a){
            ret[e] = {'display' : e, 'value' : i};
        });
        return ret;
    };

    function printDimsRanges(dimsRanges,dimsExclude){
        var ret = {};
        Object.keys(dimsRanges).forEach(function(e,i,a){
            if(!dimsExclude||dimsExclude.indexOf(e)<0){
                ret[e]=[];
                Object.keys(dimsRanges[e]).forEach(function(f,j,b){
                    ret[e].push(f);
                });
            }
        });
        return ret;
    };

    //console.log(JSON.stringify(printDims()));
    //console.log(JSON.stringify(printMres()));
    //*******************************************************************************
    // Helper Functions for pop up chart
    //*******************************************************************************
    //Only used in cell clicked
    function createDisplayNames(){
        var res = {};
        for(var k in dimsEncoded){
            res[k] = dimsEncoded[k]['encoded'];
        }
        return res;
    }
    displayNames = createDisplayNames();

    function dimBtns(selectedDims){
        return selectedDims.map(function(e,i,a){ //console.log(e);
            return {'name' : dims[e]['display'], 'value' : dims[e]['value']};
        });
    }

    function popupSlice(e){
        updatePopupChart(this.value);
        return false;
    }
    //Needs work to show which are active buttons
    createButtonSet('#popupSlice',dimBtns(popBtns),cssBtnSm,{ click : popupSlice });
    createButtonSet('#popupSliceA',dimBtns(popBtnsA),cssBtnSm,{ click : popupSlice });

    //*******************************************************************************
    // Main data filter/provider
    //*******************************************************************************
    var dbData = dFilterArray({
        'data' : state.data,
        'dims' : dataDims,
        'dimsToAdd'  : dimsToAddToFilter,
        'dimsEncoded' : dimsEncoded,
        'periods' : numPeriods,
        'filtered' : true,
        'cubes' : [],
        'measures' : ["count","LOAN_AMOUNT","CURRENT_LOAN_BALANCE","PROPERTY_VALUE","ACTUAL_LTV","LTV_BREACH_AMOUNT","LTI_BREACH_AMOUNT","WEIGHTED_LTV_CALC","ACTUAL_LTI","WEIGHTED_LTI_CALC","INTEREST_RATE","LOAN_TERM_YEARS","AGE_OF_VAL_AT_FUNDING_IN_DAYS","OFFER_TO_FUND_IN_DAYS"],
        'val' : ['LOAN_AMOUNT','count']
        });
    //console.log(dbData);
    var dimOrderSort = ["BRANCH_REGION","BRANCH_NAME"];
    //console.log(JSON.stringify(printDimsRanges(dbData['filter']['indexes'],dimOrderSort)));
    var dimOrderSort = ["BRANCH_REGION","BRANCH_NAME"];
    dimOrderSort.forEach(function(e,i,a){
        filterDims.forEach(function(f,j,b){
            if(f['name']===e){
                f['order'] = Object.keys(dbData['filter']['indexes'][e]).sort();
            }
        });
    });
    //console.log(filterDims);

    pxf = dProviderArray({ 'dims' : dataDims, 'src' : [{"id" : "_", "data" : dbData }], 'periods' : numPeriods});

    //*******************************************************************************
    //New filter functonality
    //*******************************************************************************

    var filterOptions = {
        'state' : state //should we hook up handlers directly
        ,'source' : dbData //not provider
        ,'container' : '#filterChart svg'
        ,palette : colorbrewer['Blues'][9].reverse()
        ,'dims' : filterDims
        , 'dimsEncoded' : dimsEncoded
    }

    var mainFilter = dDimFilter(filterOptions);
    //console.log(mainFilter);

    // Button Functionality for dDimFilter - to go into dDimFilter
    var resetGraph = d3.selectAll(".reset")
                    .on("click",reset);
    // to go into dDimFilter
    var backGraph = d3.selectAll(".back")
                    .on("click",back);

    function reset(e){ // this needs to change anchor part - should be built into dimFilter
        mainFilter.reset();
    }

    function back(e){ // this needs to change anchor part - should be built into dimFilter
        mainFilter.back();
    }

    // Expand dDimFilter Functionality
    $(".expand").click(function(){
        $("#filterChart").toggleClass("out");
        $("#rptMove").toggleClass("hidden");
        $(".rptPage").toggleClass("hidden");
        $(".expand").html("<<");
        $(".activeTab").fadeOut('fast', // select all active pages
            function(){
                $(".activePage").removeClass("activePage").addClass("inactivePage"); //rptPage
                if($("#filterChart.out").length===0){
                    $(".pg" + state["rptPage"]()).removeClass("inactivePage").addClass("activePage");
                    $(".expand").html(">>");
                }
            })
        .fadeIn('slow');
        mainFilter.chart.update();
    });

    // Expand dDimFilter Functionality
    $(".expandV").click(function(){
        if(mainFilter.expanded()===true){
            $(".expandV").html("Less Filters");
        } else {
            $(".expandV").html("More Filters");
        }
    });

    //*******************************************************************************
    //Page Buttons - inserted before report
    //*******************************************************************************
    function pageChange(id){
        return function(stateObj,refNo){
            return function(){
                // Change active page for all reports
                if(stateObj["updated"]===refNo){
                    $(".activeTab").fadeOut('fast', // select all active pages
                        function(){
                            $(".activePage").removeClass("activePage").addClass("inactivePage");
                            $("." + id + stateObj["controls"][refNo]).removeClass("inactivePage").addClass("activePage"); // only changing active report
                        })
                    .fadeIn('slow');
                }
            }
        }
    }
    var rptPage = stateElement(state, "rptPage", cssBtnSm,["Exposure","Stats", "KPI's"],["0", "1", "2"],[pageChange("pg")]);

    //
    //*******************************************************************************
    //Step 4.2 - Initialise Dashboards
    //*******************************************************************************
    //Initalise reports
    var reportDef0 = rptDef0();
    var reportDef1 = rptDef1();
    var reportDef2 = rptDef2();
    var reportDef3 = rptDef3();
    var reportDef4 = rptDef4();

    var rptGrp = rpts[reportDef0.name] = rpts[reportDef0.ref] = jdcGrid({source : pxf, def: reportDef0, pageCtrl : state['rptPage'] });
    var rptLoans = rpts[reportDef1.name] = rpts[reportDef1.ref] = jdcGrid({source : pxf, def: reportDef1, pageCtrl : state['rptPage'] });
    var rptCredit = rpts[reportDef2.name] = rpts[reportDef2.ref] = jdcGrid({source : pxf, def: reportDef2, pageCtrl : state['rptPage'] });
    var rptRegions = rpts[reportDef3.name] = rpts[reportDef3.ref] = jdcGrid({source : pxf, def: reportDef3, pageCtrl : state['rptPage'] });
    var rptCounties = rpts[reportDef4.name] = rpts[reportDef4.ref] = jdcGrid({source : pxf, def: reportDef4, pageCtrl : state['rptPage'] });

    state.addView(rptGrp,0);
    state.addView(rptLoans,1);
    state.addView(rptCredit,2);
    state.addView(rptRegions,3);
    state.addView(rptCounties,4);

    //*******************************************************************************
    // Marimekko chart
    //*******************************************************************************
    //Dims for mekko dropdown to update chart

    /* console.log(JSON.stringify(filterDims.map(function(e,i,a){ // helper to create
        return { "name" : e['name'], "value" : e['name'] };
    }))); */

    var ddMekkoH = {
        container : '#mekkoH',
        type : '.wrapper-dropdown-1',
        events : { 'changed' : function(e){ mekko.update(); } },
        label : 'Horizontal: ',
        values : mekkoDims.map(function(e,i,a){ return e['name'];}),
        map : mekkoDims.map(function(e,i,a){ return e['value'];}),
        initialValue : 'monthsOfYear'
    }

    var ddMekkoV = {
        container : '#mekkoV',
        type : '.wrapper-dropdown-1',
        events : { 'changed' : function(e){ mekko.update(); } },
        label : 'Vertical: ',
        values : mekkoDims.map(function(e,i,a){ return e['name'];}),
        map : mekkoDims.map(function(e,i,a){ return e['value'];}),
        initialValue : 'CHANNEL'
    }

    var ddH = new DropDown(ddMekkoH);
    var ddV = new DropDown(ddMekkoV);

    var mekkoV = function(){ return ddV.getMappedValue(); }
    var mekkoH = function(){ return ddH.getMappedValue(); }

    $(document).click(function() { // move the end
        // all dropdowns
        $('.wrapper-dropdown-1').removeClass('active');
    });

    // Options for mekko
    var mekkoOptions = {
        'state' : state //should we hook up handlers directly
        ,'source' : dbData //not provider
        ,'container' : '#mekkoChart svg'
        //,palette : colorbrewer['Blues'][9].reverse()
        ,'dims' : filterDims
        ,'dimsEncoded' : dimsEncoded
        ,'filter' : [mekkoH,mekkoV]
    }

    var mekko = dDimMekko(mekkoOptions);
    //console.log(mekko);

    var rptMekko = rpts["rpt5"] = rpts[5] = mekko;
    state.addView({ref:5, update:rptMekko.update },5); // will add to views and update called when view is active

    //*******************************************************************************
    // Dynamic Grid
    //*******************************************************************************

    function getRegionsAndBranches(){
        var regionsBranches = dbData.groupBy(['BRANCH_REGION','BRANCH_NAME']); //console.log(regionsBranches);
        var res = {}, regions = [];
        regionsBranches.forEach(function(e,i,a){
            var region = e['BRANCH_REGION'];
            if(!res[region]){
                res[region] = [];
            }
            if(e['values']['count']>0){
                res[region].push(e['BRANCH_NAME']);
            }
        });
        return { 'regions' : Object.keys(res).sort(), 'units' : res }
    }

    regionsAndBranches = getRegionsAndBranches();

    var ddRegions = {
        container : '#selRegion',
        type : '.wrapper-dropdown-1',
        events : { 'changed' : function(e){ rptBranches.redraw(); } },
        label : 'Region: ',
        values : regionsAndBranches['regions'],
        map : regionsAndBranches['regions'],
        initialValue : 'Dublin NW'
    }

    var ddR = new DropDown(ddRegions);

    selRegion = function(){ return ddR.getMappedValue(); }

    $(document).click(function() {
        // all dropdowns
        $('.wrapper-dropdown-1').removeClass('active');
    });


    //var reportDef6 = rptDef6();
    var rptBranches = rpts["rpt6"] = rpts[6] = jdcGrid({source : pxf, def: rptDef6, pageCtrl : state['rptPage'] });;
    state.addView(rptBranches,6);


    //*******************************************************************************
    //Step 5 - Set-up event handler and finalise
    //*******************************************************************************
    $(window) //move this to bottom
        .bind( 'hashchange', function(e) { anchor.onHashchange(e);  } )
    anchor.changeAnchorPart({set:1,report:0});

    $('#top-banner').slideUp(1500);
}
