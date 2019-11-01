var app={},e_screenPoint;
require("dojo/parser dojo/promise/all dojo/_base/connect dojo/_base/array dojo/dom esri/config esri/map esri/geometry/Extent esri/tasks/query esri/tasks/QueryTask esri/layers/FeatureLayer esri/symbols/TextSymbol esri/layers/LabelClass esri/Color dijit/Dialog esri/dijit/Geocoder esri/dijit/HomeButton esri/dijit/LocateButton dijit/form/ToggleButton dijit/layout/BorderContainer dijit/layout/ContentPane dojo/domReady!".split(" "),function(e,m,x,y,z,A,n,p,h,f,l,b,d,g,B,q,r,t,u){function v(a){0<a.features.length&&
app.map.setExtent(a.features[0].geometry.getExtent())}function k(a){app.qItem1.geometry=app.qItem2.geometry=a;item1=app.qtItem1.execute(app.qItem1);item2=app.qtItem2.execute(app.qItem2);promises=new m([item1,item2]);promises.then(w)}function w(a){a[0].hasOwnProperty("features")||console.log("Query 1 failed.");a[1].hasOwnProperty("features")||console.log("Query 2 failed.");var c=a[0].features;var b=a[1].features;app.map.graphics.clear();0==c.length||0==b.length?(a="",c="Nothing found - outside Tacoma."):
(a="<b>District "+c[0].attributes.District+"</b></div>",c="<div class='esriViewPopup'><div class='mainSection'><a href='"+c[0].attributes.WebPage+"' target='_blank'>"+c[0].attributes.Councilmem+" - Position "+c[0].attributes.DIST_ID+"</a><br>"+c[0].attributes.Councilm_3+"<br><a href='mailto:"+c[0].attributes.Councilm_1+"' target='_blank'>Email</a><br><br><a href='https://www.cityoftacoma.org/cms/one.aspx?portalId=169&pageId=10289' target='_blank'>Mayor Victoria Woodards</a><br><br><b>At-Large Councilmembers</b><br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=70230' target='_blank'>Lillian Hunter, Position 6</a><br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=95002' target='_blank'>Deputy Mayor Conor McCarthy, Position 7</a><br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=92937' target='_blank'>Ryan Mello, Position 8</a><br><br><b>Support Staff</b><br>"+
c[0].attributes.Councilm_4+"<br><a href='mailto:"+c[0].attributes.Councilm_5+"' target='_blank'>Email</a><br><br><a href='"+b[0].attributes.URL+"' target='_blank'>"+b[0].attributes.Neighborho+"</a></div></div>");500>app.map.height&&app.map.infoWindow.resize(200,230);app.map.infoWindow.setTitle(a);app.map.infoWindow.setContent(c);app.map.infoWindow.show(e_screenPoint)}e.parse();app.map=new n("map",{center:[-122.45,47.25],zoom:12,basemap:"topo",showLabels:!0});geocoder=new q({map:app.map,arcgisGeocoder:{placeholder:"Search by address",
suffix:", Tacoma, Wa",sourceCountry:"USA"}},"search");geocoder.startup();geocoder.on("select",function(a){app.map.infoWindow.hide();e_screenPoint=a.result.feature.geometry;k(a.result.feature.geometry)});new u({showLabel:!0,checked:!1,title:"Toggle Basemap",onChange:function(a){a?(app.map.setBasemap("hybrid"),this.set("iconClass","dijitButtonNode2")):(app.map.setBasemap("topo"),this.set("iconClass","dijitButtonNode"))}},"BasemapToggle");(new r({map:app.map},"HomeButton")).startup();geoLocate=new t({map:app.map},
"LocateButton");geoLocate.startup();geoLocate.on("locate",function(a){candidate_location=a.graphic.geometry;e_screenPoint=app.map.toScreen(candidate_location);k(a.graphic.geometry)});e=new l("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Councilmanic_District_Query_Layer/FeatureServer/0",{mode:l.MODE_ONDEMAND,outFields:["*"],opacity:.5});g=new g("#666");b=(new b).setColor(g);b.font.setSize("14pt");b.font.setFamily("arial");d=new d({labelExpressionInfo:{value:"District {DIST_ID}"}});
d.symbol=b;e.setLabelingInfo([d]);app.map.addLayer(e);app.qtItem1=new f("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Councilmanic_District_Query_Layer/FeatureServer/0");app.qItem1=new h;app.qtItem2=new f("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Neighborhood_Council_Districts/FeatureServer/0");app.qItem2=new h;app.qItem1.returnGeometry=app.qItem2.returnGeometry=!0;app.qItem1.outFields=app.qItem2.outFields=["*"];app.map.on("click",function(a){e_screenPoint=
a.screenPoint;point=a.mapPoint;pxWidth=app.map.extent.getWidth()/app.map.width;padding=3*pxWidth;qGeom=new p({xmin:point.x-padding,ymin:point.y-padding,xmax:point.x+padding,ymax:point.y+padding,spatialReference:point.spatialReference});k(qGeom)});gcxAnalytics.configMap(app.map);if(null!=window.location&&1<window.location.search.length){f=window.location.search.substring(1).split("&");d={};b=0;for(g=f.length;b<g;b++)e=f[b].split("="),d[e[0]]=e[1];void 0!=d.District&&""!=d.District&&(app.qZoomDistrict=
new h,app.qZoomDistrict.where="District="+d.District,app.qZoomDistrict.returnGeometry=!0,app.qtItem1.execute(app.qZoomDistrict,v))}});