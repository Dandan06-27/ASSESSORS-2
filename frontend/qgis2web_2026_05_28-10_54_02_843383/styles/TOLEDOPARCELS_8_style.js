var size = 0;
var placement = 'point';
function categories_TOLEDOPARCELS_8(feature, value, size, resolution, labelText,
                       labelFont, labelFill, bufferColor, bufferWidth,
                       placement) {
                var valueStr = (value !== null && value !== undefined) ? value.toString() : 'default';
                switch(valueStr) {case 'Agricultural':
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(86,156,24,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;
case 'Commercial':
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(255,39,215,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;
case 'INDUSTRIAL':
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(255,1,1,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;
case 'RESIDENTIAL':
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(1,18,255,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;
case 'TREES/IMPROVEMENTS':
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(239,127,239,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;
default:
                    return [ new ol.style.Style({
        stroke: new ol.style.Stroke({color: 'rgba(255,255,255,0.2)', lineDash: [9.5,1.9,3.8,1.9], lineCap: 'butt', lineJoin: 'miter', width: 1.9}),fill: new ol.style.Fill({color: 'rgba(0,0,0,0.2)'}),
        text: createTextStyle(feature, resolution, labelText, labelFont,
                              labelFill, placement, bufferColor,
                              bufferWidth)
    })];
                    break;}};

var style_TOLEDOPARCELS_8 = function(feature, resolution){
    var context = {
        feature: feature,
        variables: {}
    };
    
    var labelText = ""; 
    var value = feature.get("ActualUseName");
    var labelFont = "9.1px \'Segoe UI\', sans-serif";
    var labelFill = "#ec0000";
    var bufferColor = "#f4f4f4";
    var bufferWidth = 3.0;
    var textAlign = "left";
    var offsetX = 0;
    var offsetY = 0;
    var placement = 'point';
    if (feature.get("PIN") !== null && resolution > 0 && resolution < 0) {
        labelText = String(feature.get("PIN"));
    }
    
    var style = categories_TOLEDOPARCELS_8(feature, value, size, resolution, labelText,
                            labelFont, labelFill, bufferColor,
                            bufferWidth, placement);

    return style;
};

