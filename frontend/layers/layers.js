var wms_layers = [];

var format_TOLEDOPARCELS_0 = new ol.format.GeoJSON();
var features_TOLEDOPARCELS_0 = format_TOLEDOPARCELS_0.readFeatures(json_TOLEDOPARCELS_0, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_TOLEDOPARCELS_0 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_TOLEDOPARCELS_0.addFeatures(features_TOLEDOPARCELS_0);
var lyr_TOLEDOPARCELS_0 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_TOLEDOPARCELS_0, 
                style: style_TOLEDOPARCELS_0,
                popuplayertitle: 'TOLEDO PARCELS',
                interactive: true,
    title: 'TOLEDO PARCELS<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_0.png" /> Agricultural<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_1.png" /> Commercial<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_2.png" /> INDUSTRIAL<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_3.png" /> RESIDENTIAL<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_4.png" /> TREES/IMPROVEMENTS<br />\
    <img src="New Parcels/styles/legend/TOLEDOPARCELS_0_5.png" /> <br />' });

lyr_TOLEDOPARCELS_0.setVisible(true);
var layersList = [lyr_TOLEDOPARCELS_0];
lyr_TOLEDOPARCELS_0.set('fieldAliases', {'fid': 'fid', 'PIN': 'PIN', 'SERVER PIN': 'SERVER PIN', 'NEW PIN': 'NEW PIN', 'Assessors Data_Barangay': 'Assessors Data_Barangay', 'Assessors Data_SectionNo': 'Assessors Data_SectionNo', 'Assessors Data_CadastralSurveyNo': 'Assessors Data_CadastralSurveyNo', 'Assessors Data_Title No.': 'Assessors Data_Title No.', 'Assessors Data_DeclarationNo': 'Assessors Data_DeclarationNo', 'Assessors Data_PARCEL NO': 'Assessors Data_PARCEL NO', 'Assessors Data_SERVER PIN': 'Assessors Data_SERVER PIN', 'Assessors Data_DisplayName': 'Assessors Data_DisplayName', 'Assessors Data_OwnerAddress': 'Assessors Data_OwnerAddress', 'Assessors Data_TotalArea': 'Assessors Data_TotalArea', 'Assessors Data_Unit': 'Assessors Data_Unit', 'Assessors Data_TotalMarketValue': 'Assessors Data_TotalMarketValue', 'Assessors Data_TotalAssessedValue': 'Assessors Data_TotalAssessedValue', 'Assessors Data_ActualUseName': 'Assessors Data_ActualUseName', });
lyr_TOLEDOPARCELS_0.set('fieldImages', {'fid': 'TextEdit', 'PIN': 'TextEdit', 'SERVER PIN': 'TextEdit', 'NEW PIN': 'TextEdit', 'Assessors Data_Barangay': 'TextEdit', 'Assessors Data_SectionNo': 'TextEdit', 'Assessors Data_CadastralSurveyNo': 'TextEdit', 'Assessors Data_Title No.': 'TextEdit', 'Assessors Data_DeclarationNo': 'TextEdit', 'Assessors Data_PARCEL NO': 'TextEdit', 'Assessors Data_SERVER PIN': 'TextEdit', 'Assessors Data_DisplayName': 'TextEdit', 'Assessors Data_OwnerAddress': 'TextEdit', 'Assessors Data_TotalArea': 'TextEdit', 'Assessors Data_Unit': 'TextEdit', 'Assessors Data_TotalMarketValue': 'TextEdit', 'Assessors Data_TotalAssessedValue': 'TextEdit', 'Assessors Data_ActualUseName': 'TextEdit', });
lyr_TOLEDOPARCELS_0.set('fieldLabels', {'fid': 'inline label - always visible', 'PIN': 'inline label - always visible', 'SERVER PIN': 'inline label - always visible', 'NEW PIN': 'inline label - always visible', 'Assessors Data_Barangay': 'inline label - always visible', 'Assessors Data_SectionNo': 'inline label - always visible', 'Assessors Data_CadastralSurveyNo': 'inline label - always visible', 'Assessors Data_Title No.': 'inline label - always visible', 'Assessors Data_DeclarationNo': 'inline label - always visible', 'Assessors Data_PARCEL NO': 'inline label - always visible', 'Assessors Data_SERVER PIN': 'inline label - always visible', 'Assessors Data_DisplayName': 'inline label - always visible', 'Assessors Data_OwnerAddress': 'inline label - always visible', 'Assessors Data_TotalArea': 'inline label - always visible', 'Assessors Data_Unit': 'inline label - always visible', 'Assessors Data_TotalMarketValue': 'inline label - always visible', 'Assessors Data_TotalAssessedValue': 'inline label - always visible', 'Assessors Data_ActualUseName': 'inline label - always visible', });
lyr_TOLEDOPARCELS_0.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});