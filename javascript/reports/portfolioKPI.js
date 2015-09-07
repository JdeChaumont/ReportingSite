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
var iter = 0;
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
    ret.dimSelected = function(){ //if(++iter>4) return 'dpd'; return 'prt'};
        return state.rptDim()};
    ret.s = function(){return (state.rptRange() > 0 ? 0 : ret.c() );};
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


function loadReport(){

    $(".splash").slideUp('slow');

    dataNew = payLoad();
    console.log(dataNew);
    console.log(dataNew.data[0]);

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
        ["Group Overview","Arrears Performance", "Forbearance", "Rate Characteristics", "Loan Size distribution","Loan to Value", "Geographic Distribution", "Marimekko"],null,
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
    dReport( { 'container' : '#rpt1', 'body' : { 'id' : 'rptArrears'}, 'title' : { 'html' : 'Arrears Profile' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt2', 'body' : { 'id' : 'rptFB'}, 'title' : { 'html' : 'Forbearance' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt3', 'body' : { 'id' : 'rptRate'}, 'title' : { 'html' : 'Rate\\Repayment Characteristics' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt4', 'body' : { 'id' : 'rptLoanSize'}, 'title' : { 'html' : 'Loan Size Profile' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt5', 'body' : { 'id' : 'rptLTV'}, 'title' : { 'html' : 'Indexed Loan To Value Profile' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt6', 'body' : { 'id' : 'rptGeo'}, 'title' : { 'html' : 'Geographic Distribution' }, 'controls' : [ { 'class' : 'btn-group pull-right rptPage'} ] } );
    dReport( { 'container' : '#rpt7', 'body' : { 'id' : 'mekkoChart', 'style' : 'display:block;padding:0'}, 'controlsContainer' : { 'style' : 'padding:0;display:block;margin-left:30px;margin-right:auto' },'controls' : [ {'id':'mekkoV','class':"wrapper-dropdown-1"},{'id':'mekkoH','class':"wrapper-dropdown-1"} ] } );
    // Hack - because cannot dynamically determine DOM type
    d3.select('#mekkoChart').append('svg');
    var rptPortfolio = stateElement(state, "prt", css,["All","HL","BTL","Commercial","CHL","IoM","Consumer"],["_","d","a","c","b","e","f"],null,0,[0,4,1,3,2,5,6]);
    //var rptPeriod = stateElement(state, "rptPeriod", cssBtnSm,["Q413","Q114","Q214","Q314","Q414","Q115","Q215"],[0,1,2,3,4,5,6],null,6);
    var rptPeriod = stateElementDropdown(state, "rptPeriod", "dropdown-style",["Q4 2013","Q1 2014","Q2 2014","Q3 2014","Q4 2014","Q1 2015","Q2 2015"].reverse(),[0,1,2,3,4,5,6].reverse(),null,0);//,"font-size:10pt;padding-top:5px;height:30px");
    var rptUOM = stateElement(state, "uom", css,["€", "#","Provision"],['bal','count','prv']);
    var rptDim = stateElement(state, "rptDim", css,["Portfolio","Division","Region","Arrears","Repayment","Rate Type","LTV"],["prt","ent","region","dpd_band","repay_type","int_rate_type","ltv_band"],null,0,[0,1,2,3,4,5,6]);
    var rptRange = stateElement(state, "rptRange", css,["Current","All"],[0,1]);

    //*******************************************************************************
    // Set-up Data
    //*******************************************************************************
    dataDims = dataNew['dims'];
    dataDims = ['mre'].concat(dataDims); // Hack to add here - could check for tgt in dProvider and add there
    dimsEncoded = dataNew['dimsEncoded'];
    console.log(JSON.stringify(dimsEncoded));

    //var dpdMap = { "g":"UTD", "a":">0", "c":">30", "e":">30" };  // VERY BRITTLE - USES ENCODED WHICH CHANGE - CHANGED BELOW
    var dpdMap = encodeValueMap('dpd_band',{ "UTD":"UTD", "0-30":">0", "30-60":">30", "60-90":">30" });
    var dimsToAddToFilter = [
        { 'name' : 'dpd', 'derivedFrom' : 'dpd_band', 'grpFn' : grpCategories(dpdMap,">90") },
        { 'name' : 'forborne', 'derivedFrom' : 'fb', 'grpFn' : grpCategories(encodeValueMap('fb',{ "No":"N"}),"Y") },
        { 'name' : 'secured', 'derivedFrom' : 'ltv_band', 'grpFn' : grpCategories(encodeValueMap('ltv_band',{ "LTVexclusions":"N","NA":"N"}),"Y") },
        { 'name' : 'arrs', 'derivedFrom' : 'dpd_band', 'grpFn' : grpCategories(encodeValueMap('dpd_band',{ "UTD":"N" }),"Y") },
    ];
    dataDims = ['dpd','forborne','secured','arrs'].concat(dataDims);
    // console.log(dataDims);

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

    console.log(JSON.stringify(printDims()));
    console.log(JSON.stringify(printMres()));
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
        return selectedDims.map(function(e,i,a){
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
        'cubes' : [['prt','ent','sector','repay_type','int_rate_type']],
        'measures' : dataNew['measures'], //['count','bal','arrs','prv','ew_DiA','ew_iLTV','ew_int_rate','ew_rem_term','ew_TOB']
        'val' : ['bal','count','prv']
        });
    // console.log(dbData);
    pxf = dProviderArray({ 'dims' : dataDims, 'src' : [{"id" : "_", "data" : dbData }], 'periods' : numPeriods});

    //*******************************************************************************
    //New filter functonality
    //*******************************************************************************

    var filterOptions = {
        'state' : state //should we hook up handlers directly
        ,'source' : dbData //not provider
        ,'container' : '#filterChart svg'
        ,'containerCtrls' : '#filter'
        ,palette : colorbrewer['Blues'][9].reverse()
        ,'dims' : filterDims
        ,'dimsEncoded' : dimsEncoded
    }

    var mainFilter = dDimFilterDropdown(filterOptions);
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

    //*******************************************************************************
    //Step 4.2 - Initialise Dashboards
    //*******************************************************************************
    //Initalise reports
    var reportDef0 = rptDef0();
    var reportDef1 = rptDef1();
    var reportDef2 = rptDef2();
    var reportDef3 = rptDef3();
    var reportDef4 = rptDef4();
    var reportDef5 = rptDef5();
    var reportDef6 = rptDef6();

    var rptDiv = rpts[reportDef0.name] = rpts[reportDef0.ref] = jdcGrid({source : pxf, def: reportDef0, pageCtrl : state['rptPage'] });
    var rptArrs = rpts[reportDef1.name] = rpts[reportDef1.ref] = jdcGrid({source : pxf, def: reportDef1, pageCtrl : state['rptPage'] });
    var rptFB = rpts[reportDef2.name] = rpts[reportDef2.ref] = jdcGrid({source : pxf, def: reportDef2, pageCtrl : state['rptPage'] });
    var rptRate = rpts[reportDef3.name] = rpts[reportDef3.ref] = jdcGrid({source : pxf, def: reportDef3, pageCtrl : state['rptPage'] });
    var rptLoanSize = rpts[reportDef4.name] = rpts[reportDef4.ref] = jdcGrid({source : pxf, def: reportDef4, pageCtrl : state['rptPage'] });
    var rptLTV = rpts[reportDef5.name] = rpts[reportDef5.ref] = jdcGrid({source : pxf, def: reportDef5, pageCtrl : state['rptPage'] });
    var rptGeo = rpts[reportDef6.name] = rpts[reportDef6.ref] = jdcGrid({source : pxf, def: reportDef6, pageCtrl : state['rptPage'] });

    //state.addView({ref:0, update:function(){return 0;}},0);
    state.addView(rptDiv,0);
    state.addView(rptArrs,1);
    state.addView(rptFB,2);
    state.addView(rptRate,3);
    state.addView(rptLoanSize,4);
    state.addView(rptLTV,5);
    state.addView(rptGeo,6);

    //*******************************************************************************
    //Initialise KPI Dashboards
    //*******************************************************************************
    //KPI Helper functions
    function growth(metric,interval){
        return metric[def.c()]/metric[def.c()-interval]-1;
    }
    function prefix(text){
        return function(value){
            return text+value;
        }
    }
    function suffix(text){
        return function(value){
            return value+text;
        }
    }
    function splitFigure(value){
        var i = 0, magnitudes = ['k','m','bn','%'];
        do {
            m = value.indexOf(magnitudes[i++]);
        } while (m<0);
        if(m<0) return value;
        return value.substring(0,m).trim()+"<div class='suffix'>"+value.substring(m)+"</div>";
    }
    //KPI Templates
    function kpiCells(title, kpiDefn){
        return [
            { type : 'cell', css : 'title', style :  '', value : function(){ return title; }, tooltip : 'Portfolio Selected' },
        	{
                type : 'cell',
                css : 'kpi',
                style :  '',
                key : kpiDefn,
                value : function(d){ var tgt = d['kpi']['value']; return tgt[def.c()]; },
                valueApply : [rptFmt2,splitFigure],
                tooltip : "Key Indicator",
                eventHandlers : { 'click' : cellClicked }
            },
            { type : 'cell', css : 'stat', style :  '', value : function(d){ return (d['kpi']['value'][def.c()]/d['all']['value'][def.c()]); }, valueApply : [fp], tooltip : "% Total" },
        	{ type : 'sparkbar', css : 'sparkline', style :  '', value : function(d){
                return cellSeries(d['kpi']['value'].slice(0,def.c()+1)); }//return d['core'][0].slice(def.c,-13) }
                , tooltip : "Trend" } ,
            { type : 'cell', css : 'stat', style :  '', value : function(d){ return growth(d['kpi']['value'],1); }, valueApply : [rptFmt2,prefix("Qtr:")], tooltip : "Quarterly Growth" },
            { type : 'cell', css : 'stat', style :  '', value : function(d){ return growth(d['kpi']['value'],4); }, valueApply : [rptFmt2,prefix("Yr:")], tooltip : "Annual Growth" },
            { type : 'sparkline', css : 'sparkline', style :  '', value : function(d){
                return cellSeries(d['kpi']['value'].slice(0,def.c()+1)); }//return d['core'][0].slice(def.c,-13) }
                , tooltip : "Trend" } ,
            {
                type : 'stacked',
                css : 'chart',
                style :  '',
                value : function(d){ return d['stack']['value'].map(function(e,i,a){ return { key : e['key'], values : e['values'].slice(def.s(),def.c()+1) }; }) },
                object : 'chart',
                tooltip : "Sub-analysis",
                keysOrdered : true
            }
        ];
    }
    //KPI Templates
    function kpiFactory(ref,name,container,kpiDefn,title){
        var ret = {};
        ret['ref'] = ref;
        ret['name'] = name;
        ret['container'] = container;
        ret['source'] = pxf;
        ret['dims'] = filterDims;
        ret['palette'] = name;
        ret['data'] = {
            kpi : { key :kpiDefn },
            all : { key : kpiDefnAll },
            stack : { key : function(d){
                return sortDims(d.segmentSubAnalyse(kpiDefn,null,def.dimSelected()),dimsOrdered[def.dimSelected()]); }
            }
        }
        ret['cells'] = kpiCells(title,kpiDefn);
        return ret;
    }
    //KPI Definitions
    var kpiDefnAll = defaultDims(dataDims,state,{ mre : def.u});
    var kpiStacks = [
            { 'ref' : 0, 'name' : 'kpiAll', 'defn' : kpiDefnAll, 'title' : 'Portfolio'},
            { 'ref' : 1, 'name' : 'kpiPL', 'defn' : defaultDims(dataDims,state,{ mre : def.u, npl : 'a'}), 'title' : 'Performing'},
            { 'ref' : 2, 'name' : 'kpiFB', 'defn' : defaultDims(dataDims,state,{ mre : def.u, forborne : 'Y'}), 'title' : 'Forborne'},
            { 'ref' : 3, 'name' : 'kpiArr', 'defn' : defaultDims(dataDims,state,{ mre : def.u, arrs : 'Y'}), 'title' : 'Arrears'},
            { 'ref' : 4, 'name' : 'kpi90plus', 'defn' : defaultDims(dataDims,state,{ mre : def.u, dpd : '>90'}), 'title' : '90 plus'},
            { 'ref' : 5, 'name' : 'kpiNPL', 'defn' : defaultDims(dataDims,state,{ mre : def.u, npl : 'b'}), 'title' : 'NPL'},
            { 'ref' : 6, 'name' : 'kpiImp', 'defn' : defaultDims(dataDims,state,{ mre : def.u, impaired : 'b'}), 'title' : 'Impaired'},
            //{ 'ref' : 7, 'name' : 'kpiCls', 'defn' : kpiDefnAll, 'title' : 'Closures'}
    ];

    var kpi = d3.select("#kpiStack").selectAll('div').data(kpiStacks); //console.log(kpi);
    var kpiEnter = kpi.enter().append('div')
        .attr('id',function(d){ return d['name']; })
        .attr('class','kpiStack'); //console.log(kpiEnter);

    kpiStacks.forEach(function(e,i,a){
        var opts = kpiFactory(e['ref'],e['name'],'#'+e['name'],e['defn'],e['title']);
        var rpt = rpts[opts.name] = rpts[opts.ref] = dKPI( opts );
        state.addView(rpt,0);
    });

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
        initialValue : 'prt'
    }

    var ddMekkoV = {
        container : '#mekkoV',
        type : '.wrapper-dropdown-1',
        events : { 'changed' : function(e){ mekko.update(); } },
        label : 'Vertical: ',
        values : mekkoDims.map(function(e,i,a){ return e['name'];}),
        map : mekkoDims.map(function(e,i,a){ return e['value'];}),
        initialValue : 'repay_type'
    }

    var ddH = new DropDown(ddMekkoH);
    var ddV = new DropDown(ddMekkoV);

    var mekkoV = function(){ return ddV.getMappedValue(); }
    var mekkoH = function(){ return ddH.getMappedValue(); }

    $(document).click(function() {
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

    var rptMekko = rpts["rpt7"] = rpts[7] = mekko;
    state.addView({ref:7, update:rptMekko.update },7); // will add to views and update called when view is active

    //*******************************************************************************
    //Step 5 - Set-up event handler and finalise
    //*******************************************************************************
    $(window) //move this to bottom
        .bind( 'hashchange', function(e) { anchor.onHashchange(e);  } )
    anchor.changeAnchorPart({report:"0"});
    //updateReport();
    $('#top-banner').slideUp(2000);

    // Test kpi update
    /*$(document).click(function() {
        // all dropdowns
        //alert('Title clicked');
        kpiTest.update(); console.log(kpiTest);
        return;
    });*/
    // Testing
    $(document).click(function() {
        console.log(pxf.dimsValues());
        return;
    });
}

function updateReport(){
    var tempAnchor, anchorMapInit = {};
    try { tempAnchor = $.uriAnchor.makeAnchorMap(); }
    catch ( error ) {
        anchor.changeAnchorPart({report:0});
    }
    console.log(tempAnchor);
    if(!tempAnchor||!tempAnchor["report"]) {
        anchor.changeAnchorPart({prt:"0",report:"0"});
    } else {
        for(var k in tempAnchor){
            if(k.indexOf('s_')===-1&&tempAnchor.hasOwnProperty(k)){
                anchorMapInit[k] = tempAnchor[k];
            }
        }
        console.log(anchorMapInit);
        anchor.changeAnchorPart(anchorMapInit); //- this won't work
    }
}
