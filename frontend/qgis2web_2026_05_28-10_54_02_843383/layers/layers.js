var wms_layers = [];

var format_AREAFEATURES_0 = new ol.format.GeoJSON();
var features_AREAFEATURES_0 = format_AREAFEATURES_0.readFeatures(json_AREAFEATURES_0, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_AREAFEATURES_0 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_AREAFEATURES_0.addFeatures(features_AREAFEATURES_0);
var lyr_AREAFEATURES_0 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_AREAFEATURES_0, 
                style: style_AREAFEATURES_0,
                popuplayertitle: 'AREA FEATURES',
                interactive: true,
                title: '<img src="styles/legend/AREAFEATURES_0.png" /> AREA FEATURES'
            });
var format_BRGYBOUNDARY2_1 = new ol.format.GeoJSON();
var features_BRGYBOUNDARY2_1 = format_BRGYBOUNDARY2_1.readFeatures(json_BRGYBOUNDARY2_1, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_BRGYBOUNDARY2_1 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_BRGYBOUNDARY2_1.addFeatures(features_BRGYBOUNDARY2_1);
var lyr_BRGYBOUNDARY2_1 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_BRGYBOUNDARY2_1, 
                style: style_BRGYBOUNDARY2_1,
                popuplayertitle: 'BRGY. BOUNDARY 2',
                interactive: true,
                title: '<img src="styles/legend/BRGYBOUNDARY2_1.png" /> BRGY. BOUNDARY 2'
            });
var format_CEBECOPOST_2 = new ol.format.GeoJSON();
var features_CEBECOPOST_2 = format_CEBECOPOST_2.readFeatures(json_CEBECOPOST_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_CEBECOPOST_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_CEBECOPOST_2.addFeatures(features_CEBECOPOST_2);
var lyr_CEBECOPOST_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_CEBECOPOST_2,
maxResolution:8.401339845678589,
 minResolution:0.028004466152261962,

                style: style_CEBECOPOST_2,
                popuplayertitle: 'CEBECO POST',
                interactive: true,
    title: 'CEBECO POST<br />\
    <img src="styles/legend/CEBECOPOST_2_0.png" /> OK<br />\
    <img src="styles/legend/CEBECOPOST_2_1.png" /> PENDING<br />\
    <img src="styles/legend/CEBECOPOST_2_2.png" /> <br />' });
var format_ATLSTENEMENTPERBATGY_3 = new ol.format.GeoJSON();
var features_ATLSTENEMENTPERBATGY_3 = format_ATLSTENEMENTPERBATGY_3.readFeatures(json_ATLSTENEMENTPERBATGY_3, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_ATLSTENEMENTPERBATGY_3 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_ATLSTENEMENTPERBATGY_3.addFeatures(features_ATLSTENEMENTPERBATGY_3);
var lyr_ATLSTENEMENTPERBATGY_3 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_ATLSTENEMENTPERBATGY_3, 
                style: style_ATLSTENEMENTPERBATGY_3,
                popuplayertitle: 'ATLS TENEMENT PER BATGY.',
                interactive: true,
                title: '<img src="styles/legend/ATLSTENEMENTPERBATGY_3.png" /> ATLS TENEMENT PER BATGY.'
            });
var format_BARANGAYPARTITION_4 = new ol.format.GeoJSON();
var features_BARANGAYPARTITION_4 = format_BARANGAYPARTITION_4.readFeatures(json_BARANGAYPARTITION_4, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_BARANGAYPARTITION_4 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_BARANGAYPARTITION_4.addFeatures(features_BARANGAYPARTITION_4);
var lyr_BARANGAYPARTITION_4 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_BARANGAYPARTITION_4, 
                style: style_BARANGAYPARTITION_4,
                popuplayertitle: 'BARANGAY PARTITION',
                interactive: true,
                title: '<img src="styles/legend/BARANGAYPARTITION_4.png" /> BARANGAY PARTITION'
            });
var format_LINEFEATURES_5 = new ol.format.GeoJSON();
var features_LINEFEATURES_5 = format_LINEFEATURES_5.readFeatures(json_LINEFEATURES_5, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_LINEFEATURES_5 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_LINEFEATURES_5.addFeatures(features_LINEFEATURES_5);
var lyr_LINEFEATURES_5 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_LINEFEATURES_5, 
                style: style_LINEFEATURES_5,
                popuplayertitle: 'LINE FEATURES',
                interactive: true,
                title: '<img src="styles/legend/LINEFEATURES_5.png" /> LINE FEATURES'
            });
var format_PHLADM3_6 = new ol.format.GeoJSON();
var features_PHLADM3_6 = format_PHLADM3_6.readFeatures(json_PHLADM3_6, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PHLADM3_6 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PHLADM3_6.addFeatures(features_PHLADM3_6);
var lyr_PHLADM3_6 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_PHLADM3_6, 
                style: style_PHLADM3_6,
                popuplayertitle: 'PHL ADM3',
                interactive: true,
                title: '<img src="styles/legend/PHLADM3_6.png" /> PHL ADM3'
            });
var format_PSABUILDINGFOOTPRINT_7 = new ol.format.GeoJSON();
var features_PSABUILDINGFOOTPRINT_7 = format_PSABUILDINGFOOTPRINT_7.readFeatures(json_PSABUILDINGFOOTPRINT_7, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_PSABUILDINGFOOTPRINT_7 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_PSABUILDINGFOOTPRINT_7.addFeatures(features_PSABUILDINGFOOTPRINT_7);
cluster_PSABUILDINGFOOTPRINT_7 = new ol.source.Cluster({
  distance: 30,
  source: jsonSource_PSABUILDINGFOOTPRINT_7
});
var lyr_PSABUILDINGFOOTPRINT_7 = new ol.layer.Vector({
                declutter: false,
                source:cluster_PSABUILDINGFOOTPRINT_7,
maxResolution:0.28004466152261964,
 
                style: style_PSABUILDINGFOOTPRINT_7,
                popuplayertitle: 'PSA BUILDING FOOTPRINT',
                interactive: true,
                title: '<img src="styles/legend/PSABUILDINGFOOTPRINT_7.png" /> PSA BUILDING FOOTPRINT'
            });
var format_TOLEDOPARCELS_8 = new ol.format.GeoJSON();
var features_TOLEDOPARCELS_8 = format_TOLEDOPARCELS_8.readFeatures(json_TOLEDOPARCELS_8, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_TOLEDOPARCELS_8 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_TOLEDOPARCELS_8.addFeatures(features_TOLEDOPARCELS_8);
var lyr_TOLEDOPARCELS_8 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_TOLEDOPARCELS_8, 
                style: style_TOLEDOPARCELS_8,
                popuplayertitle: 'TOLEDO PARCELS',
                interactive: true,
    title: 'TOLEDO PARCELS<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_0.png" /> Agricultural<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_1.png" /> Commercial<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_2.png" /> INDUSTRIAL<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_3.png" /> RESIDENTIAL<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_4.png" /> TREES/IMPROVEMENTS<br />\
    <img src="styles/legend/TOLEDOPARCELS_8_5.png" /> <br />' });
var format_TOLEDOBASESHAPE_9 = new ol.format.GeoJSON();
var features_TOLEDOBASESHAPE_9 = format_TOLEDOBASESHAPE_9.readFeatures(json_TOLEDOBASESHAPE_9, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_TOLEDOBASESHAPE_9 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_TOLEDOBASESHAPE_9.addFeatures(features_TOLEDOBASESHAPE_9);
var lyr_TOLEDOBASESHAPE_9 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_TOLEDOBASESHAPE_9, 
                style: style_TOLEDOBASESHAPE_9,
                popuplayertitle: 'TOLEDO BASE SHAPE',
                interactive: true,
                title: '<img src="styles/legend/TOLEDOBASESHAPE_9.png" /> TOLEDO BASE SHAPE'
            });
var format_TOLEDOLANDUSEFINAL_10 = new ol.format.GeoJSON();
var features_TOLEDOLANDUSEFINAL_10 = format_TOLEDOLANDUSEFINAL_10.readFeatures(json_TOLEDOLANDUSEFINAL_10, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_TOLEDOLANDUSEFINAL_10 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_TOLEDOLANDUSEFINAL_10.addFeatures(features_TOLEDOLANDUSEFINAL_10);
var lyr_TOLEDOLANDUSEFINAL_10 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_TOLEDOLANDUSEFINAL_10, 
                style: style_TOLEDOLANDUSEFINAL_10,
                popuplayertitle: 'TOLEDOLANDUSEFINAL',
                interactive: true,
    title: 'TOLEDOLANDUSEFINAL<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_0.png" /> <br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_1.png" /> Agriculture<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_2.png" /> Cemetery<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_3.png" /> Commercial<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_4.png" /> Fishpond<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_5.png" /> Forest<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_6.png" /> Idle Lands<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_7.png" /> Industrial<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_8.png" /> Inlandwater<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_9.png" /> Institutional<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_10.png" /> Landfill<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_11.png" /> Mangroves<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_12.png" /> Mining<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_13.png" /> Parks and Recreation<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_14.png" /> Residential<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_15.png" /> Road<br />\
    <img src="styles/legend/TOLEDOLANDUSEFINAL_10_16.png" /> Tourism<br />' });

lyr_AREAFEATURES_0.setVisible(false);lyr_BRGYBOUNDARY2_1.setVisible(false);lyr_CEBECOPOST_2.setVisible(false);lyr_ATLSTENEMENTPERBATGY_3.setVisible(false);lyr_BARANGAYPARTITION_4.setVisible(false);lyr_LINEFEATURES_5.setVisible(false);lyr_PHLADM3_6.setVisible(false);lyr_PSABUILDINGFOOTPRINT_7.setVisible(false);lyr_TOLEDOPARCELS_8.setVisible(false);lyr_TOLEDOBASESHAPE_9.setVisible(false);lyr_TOLEDOLANDUSEFINAL_10.setVisible(false);
var layersList = [lyr_AREAFEATURES_0,lyr_BRGYBOUNDARY2_1,lyr_CEBECOPOST_2,lyr_ATLSTENEMENTPERBATGY_3,lyr_BARANGAYPARTITION_4,lyr_LINEFEATURES_5,lyr_PHLADM3_6,lyr_PSABUILDINGFOOTPRINT_7,lyr_TOLEDOPARCELS_8,lyr_TOLEDOBASESHAPE_9,lyr_TOLEDOLANDUSEFINAL_10];
lyr_AREAFEATURES_0.set('fieldAliases', {'id': 'id', 'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', });
lyr_BRGYBOUNDARY2_1.set('fieldAliases', {'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', });
lyr_CEBECOPOST_2.set('fieldAliases', {'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', 'unnamed': 'BRGY', 'pole_hight': 'pole_hight', 'latitude': 'latitude', 'longhitude': 'longhitude', 'LOT NO.': 'LOT NO.', 'PIN': 'PIN', 'STATUS': 'STATUS', });
lyr_ATLSTENEMENTPERBATGY_3.set('fieldAliases', {'FID_Affect': 'FID_Affect', 'OBJECTID': 'OBJECTID', 'Barangay': 'Barangay', 'Area': 'Area', 'Shape_Leng': 'Shape_Leng', 'Shape_Area': 'Shape_Area', 'Class': 'Class', 'Cluster': 'Cluster', 'FID_Polygo': 'FID_Polygo', 'Name': 'Name', 'FolderPath': 'FolderPath', 'SymbolID': 'SymbolID', 'AltMode': 'AltMode', 'Base': 'Base', 'Clamped': 'Clamped', 'Extruded': 'Extruded', 'Snippet': 'Snippet', 'PopupInfo': 'PopupInfo', 'Shape_Le_1': 'Shape_Le_1', 'Shape_Ar_1': 'Shape_Ar_1', });
lyr_BARANGAYPARTITION_4.set('fieldAliases', {'Area': 'Area', 'BARANGAY': 'BARANGAY', });
lyr_LINEFEATURES_5.set('fieldAliases', {'id': 'id', 'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', });
lyr_PHLADM3_6.set('fieldAliases', {'ID_0': 'ID_0', 'ISO': 'ISO', 'NAME_0': 'NAME_0', 'ID_1': 'ID_1', 'NAME_1': 'NAME_1', 'ID_2': 'ID_2', 'NAME_2': 'NAME_2', 'ID_3': 'ID_3', 'NAME_3': 'NAME_3', 'VARNAME_3': 'VARNAME_3', 'NL_NAME_3': 'NL_NAME_3', 'HASC_3': 'HASC_3', 'TYPE_3': 'TYPE_3', 'ENGTYPE_3': 'ENGTYPE_3', 'VALIDFR_3': 'VALIDFR_3', 'VALIDTO_3': 'VALIDTO_3', 'REMARKS_3': 'REMARKS_3', 'Shape_Leng': 'Shape_Leng', 'Shape_Area': 'Shape_Area', });
lyr_PSABUILDINGFOOTPRINT_7.set('fieldAliases', {'FID_2251_b': 'FID_2251_b', 'BSN': 'BSN', 'Address': 'Address', 'Bldg_Name': 'Bldg_Name', 'Bldg_Type': 'Bldg_Type', 'Bldg_Form': 'Bldg_Form', 'No_of_Flr': 'No_of_Flr', 'Roof_Type': 'Roof_Type', 'Wall_Type': 'Wall_Type', 'Popcen_BSN': 'Popcen_BSN', 'HH_Head': 'HH_Head', 'IS_Ind': 'IS_Ind', 'Remarks': 'Remarks', 'Bldg_Image': 'Bldg_Image', 'Geoid': 'Geoid', 'GEOCODE': 'GEOCODE', 'FID_Toledo': 'FID_Toledo', 'Id': 'Id', 'Barangay': 'Barangay', });
lyr_TOLEDOPARCELS_8.set('fieldAliases', {'fid': 'fid', 'PIN': 'PIN', 'HISTORY ��': 'HISTORY ��', 'HISTORY _1': 'HISTORY _1', 'HISTORY _2': 'HISTORY _2', 'HISTORY _3': 'HISTORY _3', 'HISTORY _4': 'HISTORY _4', 'HISTORY _5': 'HISTORY _5', 'HISTORY _6': 'HISTORY _6', 'HISTORY _7': 'HISTORY _7', 'HISTORY _8': 'HISTORY _8', 'HISTORY _9': 'HISTORY _9', 'HISTORY 10': 'HISTORY 10', 'HISTORY 11': 'HISTORY 11', 'HISTORY 12': 'HISTORY 12', 'HISTORY 13': 'HISTORY 13', 'HISTORY 14': 'HISTORY 14', 'HISTORY 15': 'HISTORY 15', 'HISTORY 16': 'HISTORY 16', 'BarangayNa': 'BarangayNa', 'SectionNo': 'SectionNo', 'CadastralS': 'CadastralS', 'Title No.': 'Title No.', 'Declaratio': 'Declaratio', 'PARCEL NO': 'PARCEL NO', 'SERVER PIN': 'SERVER PIN', 'DisplayNam': 'DisplayNam', 'OwnerAddre': 'OwnerAddre', 'TotalArea': 'TotalArea', 'Unit': 'Unit', ' TotalMark': ' TotalMark', ' TotalAsse': ' TotalAsse', 'ActualUseN': 'ActualUseN', 'Remarks': 'Remarks', 'NEW PIN': 'NEW PIN', 'TAX DEC.': 'TAX DEC.', });
lyr_TOLEDOBASESHAPE_9.set('fieldAliases', {'Gen_LU2022': 'Gen_LU2022', 'SpcLU2022': 'SpcLU2022', 'Area': 'Area', 'Code': 'Code', });
lyr_TOLEDOLANDUSEFINAL_10.set('fieldAliases', {'Gen_LU2022': 'Gen_LU2022', 'SpcLU2022': 'SpcLU2022', 'Area': 'Area', 'Code': 'Code', });
lyr_AREAFEATURES_0.set('fieldImages', {'id': 'TextEdit', 'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMo': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', });
lyr_BRGYBOUNDARY2_1.set('fieldImages', {'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'TextEdit', 'begin': 'TextEdit', 'end': 'TextEdit', 'altitudeMo': 'TextEdit', 'tessellate': 'TextEdit', 'extrude': 'TextEdit', 'visibility': 'TextEdit', 'drawOrder': 'TextEdit', 'icon': 'TextEdit', });
lyr_CEBECOPOST_2.set('fieldImages', {'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'TextEdit', 'begin': 'TextEdit', 'end': 'TextEdit', 'altitudeMo': 'TextEdit', 'tessellate': 'TextEdit', 'extrude': 'TextEdit', 'visibility': 'TextEdit', 'drawOrder': 'TextEdit', 'icon': 'TextEdit', 'unnamed': 'TextEdit', 'pole_hight': 'TextEdit', 'latitude': 'TextEdit', 'longhitude': 'TextEdit', 'LOT NO.': 'TextEdit', 'PIN': 'TextEdit', 'STATUS': 'TextEdit', });
lyr_ATLSTENEMENTPERBATGY_3.set('fieldImages', {'FID_Affect': 'TextEdit', 'OBJECTID': 'TextEdit', 'Barangay': 'TextEdit', 'Area': 'TextEdit', 'Shape_Leng': 'TextEdit', 'Shape_Area': 'TextEdit', 'Class': 'TextEdit', 'Cluster': 'TextEdit', 'FID_Polygo': 'TextEdit', 'Name': 'TextEdit', 'FolderPath': 'TextEdit', 'SymbolID': 'TextEdit', 'AltMode': 'Range', 'Base': 'TextEdit', 'Clamped': 'Range', 'Extruded': 'Range', 'Snippet': 'TextEdit', 'PopupInfo': 'TextEdit', 'Shape_Le_1': 'TextEdit', 'Shape_Ar_1': 'TextEdit', });
lyr_BARANGAYPARTITION_4.set('fieldImages', {'Area': 'TextEdit', 'BARANGAY': 'TextEdit', });
lyr_LINEFEATURES_5.set('fieldImages', {'id': 'TextEdit', 'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'DateTime', 'begin': 'DateTime', 'end': 'DateTime', 'altitudeMo': 'TextEdit', 'tessellate': 'Range', 'extrude': 'Range', 'visibility': 'Range', 'drawOrder': 'Range', 'icon': 'TextEdit', });
lyr_PHLADM3_6.set('fieldImages', {'ID_0': 'Range', 'ISO': 'TextEdit', 'NAME_0': 'TextEdit', 'ID_1': 'Range', 'NAME_1': 'TextEdit', 'ID_2': 'Range', 'NAME_2': 'TextEdit', 'ID_3': 'Range', 'NAME_3': 'TextEdit', 'VARNAME_3': 'TextEdit', 'NL_NAME_3': 'TextEdit', 'HASC_3': 'TextEdit', 'TYPE_3': 'TextEdit', 'ENGTYPE_3': 'TextEdit', 'VALIDFR_3': 'TextEdit', 'VALIDTO_3': 'TextEdit', 'REMARKS_3': 'TextEdit', 'Shape_Leng': 'TextEdit', 'Shape_Area': 'TextEdit', });
lyr_PSABUILDINGFOOTPRINT_7.set('fieldImages', {'FID_2251_b': 'TextEdit', 'BSN': 'TextEdit', 'Address': 'TextEdit', 'Bldg_Name': 'TextEdit', 'Bldg_Type': 'TextEdit', 'Bldg_Form': 'TextEdit', 'No_of_Flr': 'TextEdit', 'Roof_Type': 'TextEdit', 'Wall_Type': 'TextEdit', 'Popcen_BSN': 'TextEdit', 'HH_Head': 'TextEdit', 'IS_Ind': 'TextEdit', 'Remarks': 'TextEdit', 'Bldg_Image': 'TextEdit', 'Geoid': 'TextEdit', 'GEOCODE': 'TextEdit', 'FID_Toledo': 'TextEdit', 'Id': 'TextEdit', 'Barangay': 'TextEdit', });
lyr_TOLEDOPARCELS_8.set('fieldImages', {'fid': 'TextEdit', 'PIN': 'TextEdit', 'HISTORY ��': 'TextEdit', 'HISTORY _1': 'TextEdit', 'HISTORY _2': 'TextEdit', 'HISTORY _3': 'TextEdit', 'HISTORY _4': 'TextEdit', 'HISTORY _5': 'TextEdit', 'HISTORY _6': 'TextEdit', 'HISTORY _7': 'TextEdit', 'HISTORY _8': 'TextEdit', 'HISTORY _9': 'TextEdit', 'HISTORY 10': 'TextEdit', 'HISTORY 11': 'TextEdit', 'HISTORY 12': 'TextEdit', 'HISTORY 13': 'TextEdit', 'HISTORY 14': 'TextEdit', 'HISTORY 15': 'TextEdit', 'HISTORY 16': 'TextEdit', 'BarangayNa': 'TextEdit', 'SectionNo': 'TextEdit', 'CadastralS': 'TextEdit', 'Title No.': 'TextEdit', 'Declaratio': 'TextEdit', 'PARCEL NO': 'TextEdit', 'SERVER PIN': 'TextEdit', 'DisplayNam': 'TextEdit', 'OwnerAddre': 'TextEdit', 'TotalArea': 'TextEdit', 'Unit': 'TextEdit', ' TotalMark': 'TextEdit', ' TotalAsse': 'TextEdit', 'ActualUseN': 'TextEdit', 'Remarks': 'TextEdit', 'NEW PIN': 'TextEdit', 'TAX DEC.': 'ExternalResource', });
lyr_TOLEDOBASESHAPE_9.set('fieldImages', {'Gen_LU2022': 'TextEdit', 'SpcLU2022': 'TextEdit', 'Area': 'TextEdit', 'Code': 'TextEdit', });
lyr_TOLEDOLANDUSEFINAL_10.set('fieldImages', {'Gen_LU2022': 'TextEdit', 'SpcLU2022': 'TextEdit', 'Area': 'TextEdit', 'Code': 'TextEdit', });
lyr_AREAFEATURES_0.set('fieldLabels', {'id': 'inline label - always visible', 'Name': 'inline label - always visible', 'descriptio': 'inline label - always visible', 'timestamp': 'inline label - always visible', 'begin': 'inline label - always visible', 'end': 'inline label - always visible', 'altitudeMo': 'inline label - always visible', 'tessellate': 'inline label - always visible', 'extrude': 'inline label - always visible', 'visibility': 'inline label - always visible', 'drawOrder': 'inline label - always visible', 'icon': 'inline label - always visible', });
lyr_BRGYBOUNDARY2_1.set('fieldLabels', {'Name': 'inline label - always visible', 'descriptio': 'inline label - always visible', 'timestamp': 'inline label - always visible', 'begin': 'inline label - always visible', 'end': 'inline label - always visible', 'altitudeMo': 'inline label - always visible', 'tessellate': 'inline label - always visible', 'extrude': 'inline label - always visible', 'visibility': 'inline label - always visible', 'drawOrder': 'inline label - always visible', 'icon': 'inline label - always visible', });
lyr_CEBECOPOST_2.set('fieldLabels', {'Name': 'inline label - always visible', 'descriptio': 'inline label - always visible', 'timestamp': 'inline label - always visible', 'begin': 'inline label - always visible', 'end': 'inline label - always visible', 'altitudeMo': 'inline label - always visible', 'tessellate': 'inline label - always visible', 'extrude': 'inline label - always visible', 'visibility': 'inline label - always visible', 'drawOrder': 'inline label - always visible', 'icon': 'inline label - always visible', 'unnamed': 'inline label - always visible', 'pole_hight': 'inline label - always visible', 'latitude': 'inline label - always visible', 'longhitude': 'inline label - always visible', 'LOT NO.': 'inline label - always visible', 'PIN': 'inline label - always visible', 'STATUS': 'inline label - always visible', });
lyr_ATLSTENEMENTPERBATGY_3.set('fieldLabels', {'FID_Affect': 'inline label - always visible', 'OBJECTID': 'inline label - always visible', 'Barangay': 'inline label - always visible', 'Area': 'inline label - always visible', 'Shape_Leng': 'inline label - always visible', 'Shape_Area': 'inline label - always visible', 'Class': 'inline label - always visible', 'Cluster': 'inline label - always visible', 'FID_Polygo': 'inline label - always visible', 'Name': 'inline label - always visible', 'FolderPath': 'inline label - always visible', 'SymbolID': 'inline label - always visible', 'AltMode': 'inline label - always visible', 'Base': 'inline label - always visible', 'Clamped': 'inline label - always visible', 'Extruded': 'inline label - always visible', 'Snippet': 'inline label - always visible', 'PopupInfo': 'inline label - always visible', 'Shape_Le_1': 'inline label - always visible', 'Shape_Ar_1': 'inline label - always visible', });
lyr_BARANGAYPARTITION_4.set('fieldLabels', {'Area': 'inline label - always visible', 'BARANGAY': 'inline label - always visible', });
lyr_LINEFEATURES_5.set('fieldLabels', {'id': 'inline label - always visible', 'Name': 'inline label - always visible', 'descriptio': 'inline label - always visible', 'timestamp': 'inline label - always visible', 'begin': 'inline label - always visible', 'end': 'inline label - always visible', 'altitudeMo': 'inline label - always visible', 'tessellate': 'inline label - always visible', 'extrude': 'inline label - always visible', 'visibility': 'inline label - always visible', 'drawOrder': 'inline label - always visible', 'icon': 'inline label - always visible', });
lyr_PHLADM3_6.set('fieldLabels', {'ID_0': 'inline label - always visible', 'ISO': 'inline label - always visible', 'NAME_0': 'inline label - always visible', 'ID_1': 'inline label - always visible', 'NAME_1': 'inline label - always visible', 'ID_2': 'inline label - always visible', 'NAME_2': 'inline label - always visible', 'ID_3': 'inline label - always visible', 'NAME_3': 'inline label - always visible', 'VARNAME_3': 'inline label - always visible', 'NL_NAME_3': 'inline label - always visible', 'HASC_3': 'inline label - always visible', 'TYPE_3': 'inline label - always visible', 'ENGTYPE_3': 'inline label - always visible', 'VALIDFR_3': 'inline label - always visible', 'VALIDTO_3': 'inline label - always visible', 'REMARKS_3': 'inline label - always visible', 'Shape_Leng': 'inline label - always visible', 'Shape_Area': 'inline label - always visible', });
lyr_PSABUILDINGFOOTPRINT_7.set('fieldLabels', {'FID_2251_b': 'inline label - always visible', 'BSN': 'inline label - always visible', 'Address': 'inline label - always visible', 'Bldg_Name': 'inline label - always visible', 'Bldg_Type': 'inline label - always visible', 'Bldg_Form': 'inline label - always visible', 'No_of_Flr': 'inline label - always visible', 'Roof_Type': 'inline label - always visible', 'Wall_Type': 'inline label - always visible', 'Popcen_BSN': 'inline label - always visible', 'HH_Head': 'inline label - always visible', 'IS_Ind': 'inline label - always visible', 'Remarks': 'inline label - always visible', 'Bldg_Image': 'inline label - always visible', 'Geoid': 'inline label - always visible', 'GEOCODE': 'inline label - always visible', 'FID_Toledo': 'inline label - always visible', 'Id': 'inline label - always visible', 'Barangay': 'inline label - always visible', });
lyr_TOLEDOPARCELS_8.set('fieldLabels', {'fid': 'inline label - always visible', 'PIN': 'inline label - always visible', 'HISTORY ��': 'inline label - always visible', 'HISTORY _1': 'inline label - always visible', 'HISTORY _2': 'inline label - always visible', 'HISTORY _3': 'inline label - always visible', 'HISTORY _4': 'inline label - always visible', 'HISTORY _5': 'inline label - always visible', 'HISTORY _6': 'inline label - always visible', 'HISTORY _7': 'inline label - always visible', 'HISTORY _8': 'inline label - always visible', 'HISTORY _9': 'inline label - always visible', 'HISTORY 10': 'inline label - always visible', 'HISTORY 11': 'inline label - always visible', 'HISTORY 12': 'inline label - always visible', 'HISTORY 13': 'inline label - always visible', 'HISTORY 14': 'inline label - always visible', 'HISTORY 15': 'inline label - always visible', 'HISTORY 16': 'inline label - always visible', 'BarangayNa': 'inline label - always visible', 'SectionNo': 'inline label - always visible', 'CadastralS': 'inline label - always visible', 'Title No.': 'inline label - always visible', 'Declaratio': 'inline label - always visible', 'PARCEL NO': 'inline label - always visible', 'SERVER PIN': 'inline label - always visible', 'DisplayNam': 'inline label - always visible', 'OwnerAddre': 'inline label - always visible', 'TotalArea': 'inline label - always visible', 'Unit': 'inline label - always visible', ' TotalMark': 'inline label - always visible', ' TotalAsse': 'inline label - always visible', 'ActualUseN': 'inline label - always visible', 'Remarks': 'inline label - always visible', 'NEW PIN': 'inline label - always visible', 'TAX DEC.': 'inline label - always visible', });
lyr_TOLEDOBASESHAPE_9.set('fieldLabels', {'Gen_LU2022': 'inline label - always visible', 'SpcLU2022': 'inline label - always visible', 'Area': 'inline label - always visible', 'Code': 'inline label - always visible', });
lyr_TOLEDOLANDUSEFINAL_10.set('fieldLabels', {'Gen_LU2022': 'inline label - always visible', 'SpcLU2022': 'inline label - always visible', 'Area': 'inline label - always visible', 'Code': 'inline label - always visible', });
lyr_TOLEDOLANDUSEFINAL_10.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});