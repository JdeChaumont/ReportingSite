var payLoad=function(){
					var key, result = [];
					var dims = ["prt","ent","sector","repay_type","sec_ctry","region","loan_size_band","dpd_band","ltv_band","orig_band","npl","defaulted","impaired","neg_eq","int_rate_type","fb","sale"];
					var mres = ["count","bal","arrs","prv","ew_DiA","ew_iLTV","ew_int_rate","ew_rem_term","ew_TOB"];
					var dimsEncoded = {"prt":{"length":6,"values":{"BTL":"a","CHL":"b","Commercial":"c","HL":"d","IoM":"e","Consumer":"f"},"count":{"BTL":32202,"CHL":9101,"Commercial":8264,"HL":104035,"IoM":1502,"Consumer":4438},"encoded":{"a":"BTL","b":"CHL","c":"Commercial","d":"HL","e":"IoM","f":"Consumer"}},"ent":{"length":2,"values":{"Core":"a","Non-core":"b"},"count":{"Core":135415,"Non-core":24127},"encoded":{"a":"Core","b":"Non-core"}},"sector":{"length":9,"values":{"RRE IE":"a","RRE RoW":"b","Comm CRE IE":"c","Comm RRE IE":"d","Comm RRE RoW":"e","Current Account":"f","VISA":"g","Term Lending":"h","NCU":"i"},"count":{"RRE IE":136237,"RRE RoW":10603,"Comm CRE IE":5571,"Comm RRE IE":2520,"Comm RRE RoW":173,"Current Account":855,"VISA":626,"Term Lending":1893,"NCU":1064},"encoded":{"a":"RRE IE","b":"RRE RoW","c":"Comm CRE IE","d":"Comm RRE IE","e":"Comm RRE RoW","f":"Current Account","g":"VISA","h":"Term Lending","i":"NCU"}},"repay_type":{"length":4,"values":{"C&I":"a","I/O":"b","Part C&I":"c","Rev":"d"},"count":{"C&I":114638,"I/O":32683,"Part C&I":10740,"Rev":1481},"encoded":{"a":"C&I","b":"I/O","c":"Part C&I","d":"Rev"}},"sec_ctry":{"length":6,"values":{"IE":"a","Missing":"b","GB":"c","FR":"d","IM":"e","NA":"f"},"count":{"IE":140872,"Missing":5770,"GB":7981,"FR":6,"IM":245,"NA":4668},"encoded":{"a":"IE","b":"Missing","c":"GB","d":"FR","e":"IM","f":"NA"}},"region":{"length":14,"values":{"Connacht":"a","Cork":"b","Dublin":"c","Leinster":"d","Munster":"e","Ulster":"f","Missing":"g","GB":"h","London":"i","South East":"j","FR":"k","IM":"l","NA":"m","Shortfall":"n"},"count":{"Connacht":17322,"Cork":16304,"Dublin":34321,"Leinster":38864,"Munster":21287,"Ulster":12463,"Missing":5770,"GB":3977,"London":2055,"South East":1949,"FR":6,"IM":245,"NA":4668,"Shortfall":311},"encoded":{"a":"Connacht","b":"Cork","c":"Dublin","d":"Leinster","e":"Munster","f":"Ulster","g":"Missing","h":"GB","i":"London","j":"South East","k":"FR","l":"IM","m":"NA","n":"Shortfall"}},"loan_size_band":{"length":11,"values":{"0-<1k":"a","100K-<250K":"b","10K-<20K":"c","1K-<2K":"d","1M-high":"e","20K-<50K":"f","250K-<500K":"g","2K-<5K":"h","500K-<1M":"i","50K-<100K":"j","5K-<10K":"k"},"count":{"0-<1k":1587,"100K-<250K":51016,"10K-<20K":10630,"1K-<2K":1585,"1M-high":3344,"20K-<50K":24118,"250K-<500K":21696,"2K-<5K":3296,"500K-<1M":6905,"50K-<100K":29592,"5K-<10K":5773},"encoded":{"a":"0-<1k","b":"100K-<250K","c":"10K-<20K","d":"1K-<2K","e":"1M-high","f":"20K-<50K","g":"250K-<500K","h":"2K-<5K","i":"500K-<1M","j":"50K-<100K","k":"5K-<10K"}},"dpd_band":{"length":7,"values":{"UTD":"a","0-30":"b","180-360":"c","30-60":"d","360<":"e","60-90":"f","90-180":"g"},"count":{"UTD":96596,"0-30":9816,"180-360":8357,"30-60":7029,"360<":25332,"60-90":4803,"90-180":7609},"encoded":{"a":"UTD","b":"0-30","c":"180-360","d":"30-60","e":"360<","f":"60-90","g":"90-180"}},"ltv_band":{"length":7,"values":{"<=70":"a","120-<150":"b","150+":"c","70-<100":"d","100-<120":"e","LTVexclusions":"f","NA":"g"},"count":{"<=70":62742,"120-<150":20262,"150+":14420,"70-<100":33696,"100-<120":21421,"LTVexclusions":2333,"NA":4668},"encoded":{"a":"<=70","b":"120-<150","c":"150+","d":"70-<100","e":"100-<120","f":"LTVexclusions","g":"NA"}},"orig_band":{"length":5,"values":{"-<2001":"a","2005-2008":"b","2002-2004":"c","2009-2011":"d","2012<-\t":"e"},"count":{"-<2001":21915,"2005-2008":90932,"2002-2004":32918,"2009-2011":9585,"2012<-\t":4192},"encoded":{"a":"-<2001","b":"2005-2008","c":"2002-2004","d":"2009-2011","e":"2012<-\t"}},"npl":{"length":2,"values":{"N":"a","Y":"b"},"count":{"N":77196,"Y":82346},"encoded":{"a":"N","b":"Y"}},"defaulted":{"length":2,"values":{"N":"a","Y":"b"},"count":{"N":78632,"Y":80910},"encoded":{"a":"N","b":"Y"}},"impaired":{"length":2,"values":{"N":"a","Y":"b"},"count":{"N":92418,"Y":67124},"encoded":{"a":"N","b":"Y"}},"neg_eq":{"length":3,"values":{"N":"a","Y":"b","NA":"c"},"count":{"N":102131,"Y":56105,"NA":1306},"encoded":{"a":"N","b":"Y","c":"NA"}},"int_rate_type":{"length":3,"values":{"Variable":"a","Tracker":"b","Fixed":"c"},"count":{"Variable":73545,"Tracker":77338,"Fixed":8659},"encoded":{"a":"Variable","b":"Tracker","c":"Fixed"}},"fb":{"length":10,"values":{"No":"a","Term extension":"b","Hybrid":"c","Capitalisation":"d","I/O":"e","Other":"f",">I/O":"g","<I/O":"h","Zero":"i","Split":"j"},"count":{"No":94313,"Term extension":6994,"Hybrid":3242,"Capitalisation":10010,"I/O":4616,"Other":11221,">I/O":13475,"<I/O":1319,"Zero":1543,"Split":12809},"encoded":{"a":"No","b":"Term extension","c":"Hybrid","d":"Capitalisation","e":"I/O","f":"Other","g":">I/O","h":"<I/O","i":"Zero","j":"Split"}},"sale":{"length":2,"values":{"N":"a","Y":"b"},"count":{"N":156220,"Y":3322},"encoded":{"a":"N","b":"Y"}}};
					var data = (function () {
									var temp = null;
									$.ajax({
										type: "GET",
										url: "ReportsData.svc/JSON/portdata",
										data: "{}",
										async: false,
										contentType: "application/json; charset=utf-8",
										dataType: "json",
										success: function (msg) {
											temp = JSON.parse(msg);
										}
									})
									return temp;
								})();
					
					for(k in data){
						var o = {};
						key = k.split('|');
						dims.forEach(function(e,i,a){
							o[e]=key[i];
						});
						o.values = {};
						mres.forEach(function(e,i,a){
							o["values"][e]=data[k][i];
						});
						result.push(o);
					}
					return { "dims":dims, "dimsEncoded":dimsEncoded, "measures":mres, "data":result };
				};