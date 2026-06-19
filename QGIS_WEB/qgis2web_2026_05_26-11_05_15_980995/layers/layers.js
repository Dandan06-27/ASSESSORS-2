var wms_layers = [];


        var lyr_GoogleSatelliteHybrid_0 = new ol.layer.Tile({
            'title': 'Google Satellite Hybrid',
            'opacity': 1.000000,
            
            
            source: new ol.source.XYZ({
            attributions: ' ',
                url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
            })
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
var format_BARANGAYPARTITION_2 = new ol.format.GeoJSON();
var features_BARANGAYPARTITION_2 = format_BARANGAYPARTITION_2.readFeatures(json_BARANGAYPARTITION_2, 
            {dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'});
var jsonSource_BARANGAYPARTITION_2 = new ol.source.Vector({
    attributions: ' ',
});
jsonSource_BARANGAYPARTITION_2.addFeatures(features_BARANGAYPARTITION_2);
var lyr_BARANGAYPARTITION_2 = new ol.layer.Vector({
                declutter: false,
                source:jsonSource_BARANGAYPARTITION_2, 
                style: style_BARANGAYPARTITION_2,
                popuplayertitle: 'BARANGAY PARTITION',
                interactive: true,
                title: '<img src="styles/legend/BARANGAYPARTITION_2.png" /> BARANGAY PARTITION'
            });

lyr_GoogleSatelliteHybrid_0.setVisible(true);lyr_BRGYBOUNDARY2_1.setVisible(true);lyr_BARANGAYPARTITION_2.setVisible(true);
var layersList = [lyr_GoogleSatelliteHybrid_0,lyr_BRGYBOUNDARY2_1,lyr_BARANGAYPARTITION_2];
lyr_BRGYBOUNDARY2_1.set('fieldAliases', {'Name': 'Name', 'descriptio': 'descriptio', 'timestamp': 'timestamp', 'begin': 'begin', 'end': 'end', 'altitudeMo': 'altitudeMo', 'tessellate': 'tessellate', 'extrude': 'extrude', 'visibility': 'visibility', 'drawOrder': 'drawOrder', 'icon': 'icon', });
lyr_BARANGAYPARTITION_2.set('fieldAliases', {'Area': 'Area', 'BARANGAY': 'BARANGAY', });
lyr_BRGYBOUNDARY2_1.set('fieldImages', {'Name': 'TextEdit', 'descriptio': 'TextEdit', 'timestamp': 'TextEdit', 'begin': 'TextEdit', 'end': 'TextEdit', 'altitudeMo': 'TextEdit', 'tessellate': 'TextEdit', 'extrude': 'TextEdit', 'visibility': 'TextEdit', 'drawOrder': 'TextEdit', 'icon': 'TextEdit', });
lyr_BARANGAYPARTITION_2.set('fieldImages', {'Area': 'TextEdit', 'BARANGAY': 'TextEdit', });
lyr_BRGYBOUNDARY2_1.set('fieldLabels', {'Name': 'inline label - always visible', 'descriptio': 'inline label - always visible', 'timestamp': 'inline label - always visible', 'begin': 'inline label - always visible', 'end': 'inline label - always visible', 'altitudeMo': 'inline label - always visible', 'tessellate': 'inline label - always visible', 'extrude': 'inline label - always visible', 'visibility': 'inline label - always visible', 'drawOrder': 'inline label - always visible', 'icon': 'inline label - always visible', });
lyr_BARANGAYPARTITION_2.set('fieldLabels', {'Area': 'inline label - always visible', 'BARANGAY': 'inline label - always visible', });
lyr_BARANGAYPARTITION_2.on('precompose', function(evt) {
    evt.context.globalCompositeOperation = 'normal';
});