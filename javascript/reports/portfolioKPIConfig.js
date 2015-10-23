//var periods = periodsCreate(201201,35);
var periods = { mth : [201312,201403,201406,201409,201412,201503,201506], ndx : { 201312 : 0, 201403 : 1, 201406 : 2, 201409 : 3, 201412 : 4, 201503 : 5, 201406 : 6}};
console.log(periods);

var dimsDisplay = {
    "dpd":"Arrears",
    "forborne":"Forborne",
    "secured":"Secured",
    "mre":"Measure",
    "prt":"Portfolio",
    "ent":"Division",
    "sector":"Sector",
    "repay_type":"Repayment",
    "sec_ctry":"Country (sec)",
    "region":"Region (sec)",
    "loan_size_band":"Loan Size",
    "dpd_band":"Arrs (detail)",
    "ltv_band":"iLTV Band",
    "orig_band":"Vintage",
    "npl":"NPL",
    "defaulted":"Default",
    "impaired":"Impaired",
    "neg_eq":"Neg. Eq.",
    "int_rate_type":"Rate Type",
    "fb":"Forb. Type",
    "sale":"Sale Agreed"
};

var dims = {
    "dpd":{"display":"Arrs (Cat)","value":0},
    "forborne":{"display":"Forborne","value":1},
    "secured":{"display":"Secured","value":2},
    "arrs" : {"display":"Arrears","value":3},
    "mre":{"display":"Measure","value":4},
    "prt":{"display":"Portfolio","value":5},
    "ent":{"display":"Division","value":6},
    "sector":{"display":"Sector","value":7},
    "repay_type":{"display":"Repayment","value":8},
    "sec_ctry":{"display":"Country (sec)","value":9},
    "region":{"display":"Region (sec)","value":10},
    "loan_size_band":{"display":"Loan Size","value":11},
    "dpd_band":{"display":"Arrs (detail)","value":12},
    "ltv_band":{"display":"iLTV Band","value":13},
    "orig_band":{"display":"Vintage","value":14},
    "npl":{"display":"NPL","value":15},
    "defaulted":{"display":"Default","value":16},
    "impaired":{"display":"Impaired","value":17},
    "neg_eq":{"display":"Neg. Eq.","value":18},
    "int_rate_type":{"display":"Rate Type","value":19},
    "fb":{"display":"Forb. Type","value":20},
    "sale":{"display":"Sale Agreed","value":21},
    };

var mres = {
    "count":{"display":"Count","value":0},
    "bal":{"display":"Balance","value":1},
    "arrs":{"display":"Arrears","value":2},
    "prv":{"display":"Provision","value":3},
    "ew_DiA":{"display":"Days In Arrears","value":4},
    "ew_iLTV":{"display":"iLTV","value":5},
    "ew_int_rate":{"display":"Interest Rate","value":6},
    "ew_rem_term":{"display":"Rem. Term","value":7},
    "ew_TOB":{"display":"Time On Book","value":8}
    };

var dimOrder = {
    "dpd":[">90",">30",">0","UTD"],
    "forborne":["Y","N"],
    "secured":null,
    "mre":null,
    "prt":["HL","BTL","Commercial","CHL","IoM","Consumer"],
    "ent":["Core","Non-Core"],
    "sector":["RRE IE","Comm RRE IE","RRE RoW","Comm RRE RoW","Comm CRE IE","Current Account","VISA","Term Lending","NCU"],
    "repay_type":["C&I","Part C&I","I/O","Rev"],
    "sec_ctry":["IE","GB","IM","FR","Missing","NA"],
    "region":["Dublin","Leinster","Cork","Munster","Connacht","Ulster","London","South East","GB","IM","FR","Missing","NA"],
    "loan_size_band":["0-<1k","1K-<2K","2K-<5K","5K-<10K","10K-<20K","20K-<50K","50K-<100K","100K-<250K","250K-<500K","500K-<1M","1M-high"],
    "dpd_band":["360<","180-360","90-180","60-90","30-60","0-30","UTD"],
    "ltv_band":["<=70","70-<100","100-<120","120-<150","150+","LTVexclusions","NA"],
    "orig_band":["-<2001","2002-2004","2005-2008","2009-2011","2012<-\t"],
    "npl":["Y","N"],
    "defaulted":["Y","N"],
    "impaired":["Y","N"],
    "neg_eq":["Y","N"],
    "int_rate_type":["Tracker","Variable","Fixed"],
    "fb":["No","Term extension","Capitalisation","Hybrid",">I/O","I/O","<I/O","Split","Zero","Other"].reverse(),
    "sale":["N","Y"]
}

var dimsOrdered = {};
Object.keys(dimOrder).forEach(function(e,i,a){ //console.log(e);
    dimsOrdered[e] = {};
    if(dimOrder[e]){
        dimOrder[e].forEach(function(f,j,b){
            dimsOrdered[e][f] = j;
        });
    }
}); //console.log(dimsOrdered);

// Really don't like this
function sortDims(data,dimOrder,key){
    if(!dimOrder)
        return data;
    data.forEach(function(e,i,a){
        e['order'] = dimOrder[e[key||'key']] || 0;
    }); // console.log(data);
    return data.sort(function(a,b){
        return a['order'] - b['order'];
    })
}

//Buttons for popup chart - NEED to change so updates from dataDims names
var popBtns = ['prt','ent','sector','sec_ctry','region','ltv_band','neg_eq','loan_size_band','orig_band'];
var popBtnsA = ['repay_type','int_rate_type','dpd','dpd_band','forborne','fb','npl','defaulted','impaired'];

var filterDimsNew = {
        "prt" : { "colours":null, 'hide' : true },
        "ent" : { "colours":palettes['binary'].slice(0)},
        "sale" : { "colours":palettes['binary'].slice(0) },
        "sector" : {"colours":null},
        "region" : {"colours":null},
        "repay_type" : {"colours":null},
        "int_rate_type" : {"colours":null},
        "orig_band" : {"colours":null},
        "loan_size_band" : {"colours":null},
        "ltv_band" : {"colours":null},
        "neg_eq" : {"colours":palettes['binary'].slice(0)},
        "dpd" : {"colours":["#08306b","#08519c","#4292c6","#6baed6"]},
        "dpd_band" : {"colours":null, 'hide' : true},
        "forborne" : {"colours":palettes['binary'].slice(0)},
        "fb" : {"colours":null, 'hide' : true},
        "npl" : { "colours":palettes['binary'].slice(0)},
        "defaulted" : {"colours":palettes['binary'].slice(0)},
        "impaired" : {"colours":palettes['binary'].slice(0)}
    };

var filterDims = [
    'prt',
    'ent',
    'sale',
    'sector',
    'region',
    'repay_type',
    'int_rate_type',
    'orig_band',
    'loan_size_band',
    'ltv_band',
    'neg_eq',
    'dpd',
    'dpd_band',
    'forborne',
    'fb',
    'npl',
    'defaulted',
    'impaired'
    ].map(function(e,i,a){
            var colours = null, hide = null;
            if(filterDimsNew[e]){
                colours = filterDimsNew[e]['colours'];
                hide = filterDimsNew[e]['hide'];
            }
            return {'name' : e, 'display' : dims[e]['display'], 'order' : dimOrder[e],  'colours' : colours, 'hide' : hide};
        });

var mekkoDims = [
    'prt',
    'ent',
    'sale',
    'sector',
    'region',
    'repay_type',
    'int_rate_type',
    'orig_band',
    'loan_size_band',
    'ltv_band',
    'neg_eq',
    'dpd',
    'dpd_band',
    'forborne',
    'fb',
    'npl',
    'defaulted',
    'impaired'
].map(function(e,i,a){
        return {'name' : dims[e]['display'], 'value' : e};
    });
