      var app = {}; //makes it easier for creating global variables 
      var e_screenPoint;  //map click location

      require([
        "dojo/parser", "dojo/promise/all", "dojo/_base/connect", 
        "dojo/_base/array", "dojo/dom",
        "esri/config", "esri/map", "esri/geometry/Extent",
        "esri/tasks/query", "esri/tasks/QueryTask",
        "esri/layers/FeatureLayer",
        "esri/symbols/TextSymbol",
        "esri/layers/LabelClass",
        "esri/Color",
        "dijit/Dialog",
        "esri/dijit/Geocoder",
        "esri/dijit/HomeButton",
        "esri/dijit/LocateButton",
        "dijit/form/ToggleButton",
        "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
        "dojo/domReady!"
      ], function(
        parser, all, connect, 
        arrayUtils, dom,
        esriConfig, Map, Extent,
        Query, QueryTask, FeatureLayer, 
        TextSymbol, LabelClass, Color,
        Dialog,
        Geocoder, HomeButton, LocateButton,
        ToggleButton
      ) {
        // create layout dijits
        parser.parse();
        // specify proxy for request with URL lengths > 2k characters
        //esriConfig.defaults.io.proxyUrl = "/proxy";

        //Could replace feature layer with web map id here:  https://developers.arcgis.com/javascript/jssamples/ags_createwebmapid.html
        // with ...  https://www.arcgis.com/home/webmap/viewer.html?webmap=b117155dc05f4916ad8b50ab7824cff1
        
       
            app.map = new Map("map", {
                center: [-122.45, 47.25],
                zoom: 12,
                basemap: "topo",
                showLabels : true //very important that this must be set to true!
            });


            //Add geocoder
            //local geocoder example: https://developers.arcgis.com/javascript/sandbox/sandbox.html?sample=locator_service
            geocoder = new Geocoder({ 
              map: app.map, 
              arcgisGeocoder: {
                placeholder: "Search by address",
                suffix: ", Tacoma, Wa",
                sourceCountry: "USA"
              }          
              }, "search");
            geocoder.startup();
          
            //Show identify popup after address found
            geocoder.on("select", showLocationInfo);
            
            //Basemap toggle button
            new ToggleButton({
                showLabel: true,
                 checked: false,
                title: "Toggle Basemap",
                onChange: function (val) {
                  if (val) {
                    app.map.setBasemap("hybrid");
                    this.set("iconClass", "dijitButtonNode2"); //change button image
                  } else {
                    app.map.setBasemap("topo");
                    this.set("iconClass", "dijitButtonNode");
                  }  
                }
            },"BasemapToggle");
            
          //Home button
          var home = new HomeButton({
            map: app.map
          }, "HomeButton");
          home.startup();

          //Find my location button
          geoLocate = new LocateButton({
            //scale: 1128,
            map: app.map
          }, "LocateButton");
          geoLocate.startup();
          geoLocate.on("locate", useCurrentLocation);

          //Feature-Query Layer for Councilmanic Districts
          var featureLayer = new FeatureLayer("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Councilmanic_District_Query_Layer/FeatureServer/0",{
            mode: FeatureLayer.MODE_ONDEMAND,
            outFields: ["*"],
            opacity:.5
          });
            //Councilmanic Labels ---------------------------------------------------------------------
              // create a text symbol to define the style of labels
              var labelColor = new Color("#666");
              var councilmanicLabel = new TextSymbol().setColor(labelColor);
              councilmanicLabel.font.setSize("14pt");
              councilmanicLabel.font.setFamily("arial");

              //set label details within the JSON  
              var jsonLabel = {
                                "labelExpressionInfo": {"value": "District {DIST_ID}"}
                              };

              //create instance of LabelClass (note: multiple LabelClasses can be passed in as an array)
              var labelClass = new LabelClass(jsonLabel);
              labelClass.symbol = councilmanicLabel; // symbol also can be set in LabelClass' json

              featureLayer.setLabelingInfo([ labelClass ]);  //set labels
            //End Councilmanic Labels -----------------------------------------------------------------
  
          //Add Feature-Query Layer to map
          app.map.addLayer(featureLayer);

        //Query task and query for item1
        app.qtItem1 = new QueryTask("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Councilmanic_District_Query_Layer/FeatureServer/0");
        app.qItem1 = new Query();
        // query task and query for item2 
        app.qtItem2 = new QueryTask("https://services3.arcgis.com/SCwJH1pD8WSn5T5y/arcgis/rest/services/Tacoma_Neighborhood_Council_Districts/FeatureServer/0");
        app.qItem2 = new Query();

        app.qItem1.returnGeometry = app.qItem2.returnGeometry = true;
        app.qItem1.outFields = app.qItem2.outFields = ["*"];

        //Run query for popup on map click
        app.map.on("click", executeClick);

        //ZOOMING TO SELECTED DISTRICT
          //use URL paramet to update variables & run query
          if(window.location != null && window.location.search.length > 1 )
          {
            //Split URL to use as variables
            var urlParameters = window.location.search.substring(1);
            var params = urlParameters.split('&');
           
            var pairs = {};
            for(var i = 0, len = params.length; i < len; i++) {
              var pair = params[i].split('=');
              pairs[pair[0]] = pair[1];
            }
            if (pairs.District!=undefined && pairs.District!="") {
              //url formatted correctly
              app.qZoomDistrict = new Query();
              app.qZoomDistrict.where = 'District=' + pairs.District;
              app.qZoomDistrict.returnGeometry = true;
              app.qtItem1.execute(app.qZoomDistrict, handleZoomQueryResults);  //query for district
            }
        } 

        function useCurrentLocation(location){  
            //Use current location to query
            candidate_location = location.graphic.geometry; //reset for popup window
            //console.error(candidate_location);
            e_screenPoint = app.map.toScreen(candidate_location);  //for popup location
            executeQueries(location.graphic.geometry);   //query layer with geolocation
        };  

        function handleZoomQueryResults(results) {
          if (results.features.length>0){
            //zoom to first feature if any features found
            app.map.setExtent(results.features[0].geometry.getExtent());
                /*  Welcome popup - not used yet
                startDialog = new Dialog({
                    title: "<b>Welcome</b>",
                    content: "Find Council information by clicking map or searching by address.",
                    style: "text-align:center;font-family: Verdana, Geneva, Arial, Helvetica, sans-serif; width: 300px"
                });
                startDialog.show();   //popup welcome window
                */
          }
        }

        function executeClick(e) {
          //console.error(e);
          e_screenPoint = e.screenPoint;    //update map click location for infoWindow
          // create an extent from the mapPoint that was clicked
          // this is used to return features within 3 pixels of the click point
          point = e.mapPoint;
          pxWidth = app.map.extent.getWidth() / app.map.width;
          padding = 3 * pxWidth;
          qGeom = new Extent({
            "xmin": point.x - padding,
            "ymin": point.y - padding,
            "xmax": point.x + padding,
            "ymax": point.y + padding,
            "spatialReference": point.spatialReference
          });
          executeQueries(qGeom);

        }
        
        function executeQueries(qGeom) {
          // use the extent for the query geometry
          app.qItem1.geometry = app.qItem2.geometry = qGeom;
          
          item1 = app.qtItem1.execute(app.qItem1);
          item2 = app.qtItem2.execute(app.qItem2);
           promises = new all([item1, item2]);
          promises.then(handleQueryResults);
        }

        function handleQueryResults(results) {
          //console.log("queries finished: ", results);
          var item1, item2;

          // make sure both queries finished successfully
          if ( ! results[0].hasOwnProperty("features") ) {
            console.log("Query 1 failed.");
          }
          if ( ! results[1].hasOwnProperty("features") ) {
            console.log("Query 2 failed.");
          }

          // results from deferred lists are returned in the order they were created
          // so parcel results are first in the array and item2 results are second
          item1 = results[0].features;
          item2 = results[1].features;

          app.map.graphics.clear();

         
        //popup content
         if (item1.length==0 || item2.length==0) {      //Need to determine if length > 0 (outside City)
          var title = "";
          var content = "Nothing found - outside Tacoma.";
         } else {
              var title = "<b>District " + item1[0].attributes.District + "</b></div>";
              var content =  "<div class='esriViewPopup'><div class='mainSection'>" +
                "<a href='" + item1[0].attributes.WebPage + "' target='_blank'>" + item1[0].attributes.Councilmem + " - Position " +  item1[0].attributes.DIST_ID + "</a>" +
                "<br>" + item1[0].attributes.Councilm_3 + 
                "<br><a href='mailto:" + item1[0].attributes.Councilm_1 + "' target='_blank'>Email</a>" +

                "<br><br><a href='https://www.cityoftacoma.org/cms/one.aspx?portalId=169&pageId=10289' target='_blank'>Mayor Victoria Woodards</a>" +
                
                "<br><br><b>At-Large Councilmembers</b>" +
                "<br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=70230' target='_blank'>Lillian Hunter, Position 6</a>" +
                "<br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=95002' target='_blank'>Deputy Mayor Conor McCarthy, Position 7</a>" +
                "<br><a href='https://www.cityoftacoma.org/cms/One.aspx?portalId=169&pageId=92937' target='_blank'>Ryan Mello, Position 8</a>" +
                
                "<br><br><b>Support Staff</b>" +
                "<br>" + item1[0].attributes.Councilm_4 +
                "<br><a href='mailto:" + item1[0].attributes.Councilm_5 + "' target='_blank'>Email</a>" +
                
                "<br><br><a href='" + item2[0].attributes.URL + "' target='_blank'>" + item2[0].attributes.Neighborho + "</a>" +

                "</div></div>";
         }

        //smaller popup for smaller screens
        if (app.map.height<500) {
          app.map.infoWindow.resize(200,230);  
        }

        //open popup
        app.map.infoWindow.setTitle(title);  //need for black bar at top
        app.map.infoWindow.setContent(content);
        app.map.infoWindow.show(e_screenPoint); 
        }

        function showLocationInfo(evt) {
          //geocode results
          //address found - worse location will still be in center of Tacoma
          app.map.infoWindow.hide();  //close any open window

          e_screenPoint = evt.result.feature.geometry;   //update infoWindow point location      
          executeQueries(evt.result.feature.geometry);  //query data layers based on geocoded location
         }

       });
