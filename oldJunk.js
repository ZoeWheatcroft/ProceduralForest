
//code that creates the triangles for a cylinder with diameter 0.5
// and height of 0.5 (centered at the origin) with the number of subdivisions
// around the base and top of the cylinder (given by radialdivision) and
// the number of subdivisions along the surface of the cylinder given by
//heightdivision.
function makeCylinder (origin, angle, diameter, height, radialdivision, heightdivision){

    //we are given origin of BOTTOM of cylinder, adjust this to be the middle 
    origin[1] = origin[1] + height / 2;

    //draw top circle
    xRadialPoints = [];
    zRadialPoints = [];
    xRadialPoints, zRadialPoints = drawCircle([origin[0], height/2 + origin[1], origin[2]], radialdivision, diameter, false);

    //drawCubeFace([xRadialPoints[0], 0, zRadialPoints[0]], xRadialPoints[radialdivision-1] - xRadialPoints[0], height, zRadialPoints[radialdivision-1] - zRadialPoints[0], heightdivision);
    //drawCubeFace([xRadialPoints[radialdivision-1], 0, zRadialPoints[radialdivision-1]], xRadialPoints[0] - xRadialPoints[radialdivision-1], height, zRadialPoints[0] - zRadialPoints[radialdivision-1], heightdivision);
    for (var i = 0; i < radialdivision; i++) {
        drawCylinderFace(
            [xRadialPoints[i] + origin[0], -height / 2 + origin[1], zRadialPoints[i] + origin[2]],
            xRadialPoints[(i + 1) % radialdivision] - xRadialPoints[i],
            height,
            zRadialPoints[(i + 1) % radialdivision] - zRadialPoints[i],
            heightdivision);
    }

    drawCircle([origin[0], -height / 2 + origin[1], origin[2]], radialdivision, diameter, true);
}