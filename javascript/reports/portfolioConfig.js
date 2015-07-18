//var periods = periodsCreate(201201,35);
var periods = { mth : [201312,201412,201503,201506], ndx : { 201312 : 0, 201412 : 1, 201503 : 2, 201506: 3}};
console.log(periods);

var dims = {
    "dpd":{"display":"Arrears","value":0},
    "forborne":{"display":"Forborne","value":1},
    "secured":{"display":"Secured","value":2},
    "mre":{"display":"Measure","value":3},
    "prt":{"display":"Portfolio","value":4},
    "ent":{"display":"Division","value":5},
    "sector":{"display":"Sector","value":6},
    "repay_type":{"display":"Repayment","value":7},
    "sec_ctry":{"display":"Country (sec)","value":8},
    "region":{"display":"Region (sec)","value":9},
    "loan_size_band":{"display":"Loan Size","value":10},
    "dpd_band":{"display":"Arrs (detail)","value":11},
    "ltv_band":{"display":"iLTV Band","value":12},
    "orig_band":{"display":"Vintage","value":13},
    "npl":{"display":"NPL","value":14},
    "defaulted":{"display":"Default","value":15},
    "impaired":{"display":"Impaired","value":16},
    "neg_eq":{"display":"Neg. Eq.","value":17},
    "int_rate_type":{"display":"Rate Type","value":18},
    "fb":{"display":"Forb. Type","value":19},
    "sale":{"display":"Sale Agreed","value":20},
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
    "ent":["Core","Non-core"],
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

//Buttons for popup chart - NEED to change so updates from dataDims names
var popBtns = ['prt','ent','sector','sec_ctry','region','ltv_band','neg_eq','loan_size_band','orig_band'];
var popBtnsA = ['repay_type','int_rate_type','dpd','dpd_band','forborne','fb','npl','defaulted','impaired'];

// Change this to construct from list adding in dims and dimOrder an
var filterDimsOld = [
    {"name":"prt","display":"Portfolio","order":["HL","BTL","Commercial","CHL","IoM","Consumer"],"colours":null, 'hide' : true },
    {"name":"ent","display":"Division","order":["Core","Non-core"],"colours":palettes['binary'].slice(0)},
    {"name":"sector","display":"Sector","order":["RRE IE","Comm RRE IE","RRE RoW","Comm RRE RoW","Comm CRE IE","Current Account","VISA","Term Lending","NCU"],"colours":null},
    //{"name":"sec_ctry","display":"Security (ctry)","order":["IE","GB","IM","FR","Missing","NA"],"colours":null},
    {"name":"region","display":"Region","order":["Dublin","Leinster","Cork","Munster","Connacht","Ulster","London","South East","GB","IM","FR","Missing","NA"],"colours":null},
    {"name":"repay_type","display":"Repayment","order":["C&I","Part C&I","I/O","Rev"],"colours":null},
    {"name":"int_rate_type","display":"Rate Type","order":["Tracker","Variable","Fixed"],"colours":null},
    //{"name":"int_rate_band","display":"Yield","order":["=0","0<1.0","1.0<=2.0","2.0<=5.0","5.0<=10.0","10.0<=20.0","NA"],"colours":null},
    {"name":"orig_band","display":"Originated","order":["-<2001","2002-2004","2005-2008","2009-2011","2012<-\t"],"colours":null},
    //{"name":"rem_term_band","display":"Term (rem)","order":["<-1yr","1-5yrs","5-10yrs","10-20yrs","20-30yrs",">30yrs"],"colours":null},
    {"name":"loan_size_band","display":"Loan Size","order":["0-<1k","1K-<2K","2K-<5K","5K-<10K","10K-<20K","20K-<50K","50K-<100K","100K-<250K","250K-<500K","500K-<1M","1M-high"],"colours":null},
    {"name":"ltv_band","display":"iLTV","order":["<=70","70-<100","100-<120","120-<150","150+","LTVexclusions","NA"],"colours":null},
    {"name":"neg_eq","display":"Neg. Equity","order":["Y","N"],"colours":palettes['binary'].slice(0)},
    {"name":"dpd","display":"Arrears","order":[">90",">30",">0","UTD"],"colours":["#08306b","#08519c","#4292c6","#6baed6"]},
    {"name":"dpd_band","display":"Arrs (det)","order":["360<","180-360","90-180","60-90","30-60","0-30","UTD"],"colours":null, 'hide' : true},
    {"name":"forborne","display":"Forborne","order":["Y","N"],"colours":palettes['binary'].slice(0)},
    {"name":"fb","display":"Forb. Type","order":["No","Term extension","Capitalisation","Hybrid",">I/O","I/O","<I/O","Split","Zero","Other"],"colours":null, 'hide' : true},
    {"name":"npl","display":"NPL","order":["Y","N"],"colours":palettes['binary'].slice(0)},
    {"name":"defaulted","display":"Defaulted","order":["Y","N"],"colours":palettes['binary'].slice(0)},
    {"name":"impaired","display":"Impaired","order":["Y","N"],"colours":palettes['binary'].slice(0)},
];

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
