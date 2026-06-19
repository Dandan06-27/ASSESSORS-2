var labelOpacity = 1.0;

var createTextStyle = function(feature, resolution, labelText, labelFont,
                               labelFill, placement, bufferColor,
                               bufferWidth) {

    if (feature.hide || !labelText) {
        return; 
    } 

    if (bufferWidth == 0) {
        var bufferStyle = null;
    } else {
        var bufferStyle = new ol.style.Stroke({
            color: bufferColor,
            width: bufferWidth
        })
    }
    
    // Apply opacity to the label fill color
    var fillColor = labelFill;
    if (fillColor.includes('rgb')) {
        // Handle rgba format - modify or create with opacity
        var rgbMatch = fillColor.match(/rgba?\((.*?)\)/);
        if (rgbMatch) {
            var colorParts = rgbMatch[1].split(',');
            if (colorParts.length === 3) {
                // rgb format - convert to rgba with opacity
                fillColor = 'rgba(' + colorParts[0] + ',' + colorParts[1] + ',' + colorParts[2] + ',' + labelOpacity + ')';
            } else if (colorParts.length === 4) {
                // rgba format - replace alpha with new opacity
                fillColor = 'rgba(' + colorParts[0] + ',' + colorParts[1] + ',' + colorParts[2] + ',' + labelOpacity + ')';
            }
        }
    }
    
    var textStyle = new ol.style.Text({
        font: labelFont,
        text: labelText,
        textBaseline: "middle",
        textAlign: "left",
        offsetX: 8,
        offsetY: 3,
        placement: placement,
        maxAngle: 0,
        fill: new ol.style.Fill({
          color: fillColor
        }),
        stroke: bufferStyle
    });

    return textStyle;
};

function stripe(stripeWidth, gapWidth, angle, color) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    canvas.width = screen.width;
    canvas.height = stripeWidth + gapWidth;
    context.fillStyle = color;
    context.lineWidth = stripeWidth;
    context.fillRect(0, 0, canvas.width, stripeWidth);
    innerPattern = context.createPattern(canvas, 'repeat');

    var outerCanvas = document.createElement('canvas');
    var outerContext = outerCanvas.getContext('2d');
    outerCanvas.width = screen.width;
    outerCanvas.height = screen.height;
    outerContext.rotate((Math.PI / 180) * angle);
    outerContext.translate(-(screen.width/2), -(screen.height/2));
    outerContext.fillStyle = innerPattern;
    outerContext.fillRect(0,0,screen.width,screen.height);

    return outerContext.createPattern(outerCanvas, 'no-repeat');
};
