//
// fill in code that creates the triangles for a cube with dimensions 0.5x0.5x0.5
// on each side (and the origin in the center of the cube). with an equal
// number of subdivisions along each cube face as given by the parameter
//subdivisions
//
import {points, bary, indices, colors } from './tessMain.js';
import { vec4, mat4 } from './wgpu-matrix/dist/3.x/wgpu-matrix.module.js';

let rowRadiusLst = [0.0];
var hillHeight = 2.5;
var hillDiameter = 5.0;
var hillOriginY = -1.5;

var season = 0.3;

var maxTrees = 10;

class Tree {
    constructor(origin, trunkHeight, height, color, branchCount, diameter, trans, rotAngles) {
        this.origin = origin;
        this.trunkHeight = trunkHeight;
        this.height = height;
        this.color = color;
        this.branchCount = branchCount;
        this.diameter = diameter;
        this.trans = trans;
        this.rotAngles = rotAngles;
    }
}

var trees;

function makeCube (subdivisions)  {
    
    // fill in your code here.
    // delete the code below first.
    // NOTE: your triangles need to be clockwise for the 
    // pipeline not to cull them!

    var width = 0.5;

    //front face
    drawCubeFace([-0.25, -0.25, -0.25], width, width, 0, subdivisions)
    //draw back face
    drawCubeFace([width / 2, -0.25, width/2], -width, width, 0, subdivisions);

    //draw left face
    drawCubeFace([-0.25, -0.25, width/2], 0, width, -width, subdivisions);
    //right face
    drawCubeFace([width/2, -0.25, -0.25], 0, width, width, subdivisions)

    //draw top face
    drawCubeFace([-0.25, width / 2, -0.25], width, 0, width, subdivisions);
    //draw bottom face
    drawCubeFace([-0.25, -0.25, width/2], width, 0, -width, subdivisions);


}

// draw a whole cube face
function drawCubeFace(originCoord, xChange, yChange, zChange, subdivisions) {
    polyOriginCoord = [0, 0, 0];
    for (var r = 0; r < subdivisions; r++) {
        for (var c = 0; c < subdivisions; c++) {
            if (yChange == 0) {
                polyOriginCoord = [originCoord[0] + r * xChange / subdivisions, originCoord[1] + c * yChange / subdivisions, originCoord[2] + c * zChange / subdivisions];
            }
            else if (xChange == 0) {
                polyOriginCoord = [originCoord[0] + r * xChange / subdivisions, originCoord[1] + c * yChange / subdivisions, originCoord[2] + r * zChange / subdivisions];
            }
            else {
                polyOriginCoord = [originCoord[0] + r * xChange / subdivisions, originCoord[1] + c * yChange / subdivisions, originCoord[2] + r * zChange / subdivisions];
            }
            drawSquarePolygon(polyOriginCoord, xChange / subdivisions, yChange / subdivisions, zChange / subdivisions);
        }
    }
}

//draw a column of cylinder faces
function drawCylinderFace(originCoord, xChange, yChange, zChange, subdivisions, color = [1, 0, 0], trans = undefined, offset = undefined) {
    var polyOriginCoord = [0, 0, 0];
    for (var c = 0; c < subdivisions; c++) {
        if (xChange == 0) {
            polyOriginCoord = [originCoord[0], originCoord[1] + c * yChange / subdivisions, originCoord[2]];
        }
        else {
            polyOriginCoord = [originCoord[0], originCoord[1] + c * yChange / subdivisions, originCoord[2]];
        }
        drawSquarePolygon(polyOriginCoord, xChange, yChange / subdivisions, zChange, color, trans, offset);
    }
}

//draw two triangles to create a single square shape
function drawSquarePolygon(originCoord, xChange, yChange, zChange, color = [1, 0, 0], trans = undefined, offset = undefined) {
    var xOrigin = originCoord[0];
    var yOrigin = originCoord[1];
    var zOrigin = originCoord[2];

    if (yChange != 0) {
        //top triangle
        addTriangle(xOrigin, yOrigin, zOrigin,
            xOrigin, yOrigin + yChange, zOrigin,
            xOrigin + xChange, yOrigin + yChange, zOrigin + zChange,
            color,
            trans, offset)

        //bottom triangle
        addTriangle(xOrigin, yOrigin, zOrigin,
            xOrigin + xChange, yOrigin + yChange, zOrigin + zChange,
            xOrigin + xChange, yOrigin, zOrigin + zChange,
            color,
            trans, offset)
    }
    else {
        //top triangle
        addTriangle(xOrigin, yOrigin, zOrigin,
            xOrigin, yOrigin + yChange, zOrigin + zChange,
            xOrigin + xChange, yOrigin + yChange, zOrigin + zChange,
            color,
            trans, offset)
        //draw bottom triangle
        addTriangle(xOrigin, yOrigin, zOrigin,
            xOrigin + xChange, yOrigin + yChange, zOrigin + zChange,
            xOrigin + xChange, yOrigin, zOrigin,
            color,
            trans, offset)
    }
}

function makeTree(n) {
    const tree = trees[n];
    //get root point-- slightly under some  point on the hill
    let origin = tree.origin;

    let treeHeight = tree.height;
    let branchCount = tree.branchCount;
    let trunkHeight = tree.trunkHeight;
    let color = tree.color;
    let diameter = tree.diameter;
    let rotAngles = tree.rotAngles;

    //make trunk with a random length
    //makeBranch(origin.slice(), [0, 0, 0], diameter, trunkHeight, 7, 1, color, 0, true, rotAngles);
    //make rest of tree w branches
    let treeOrigin = origin.slice();
    treeOrigin.y += tree.trunkHeight / 2;
    var trans = tree.trans;
    makeBranch(treeOrigin, [0, 0, 0], diameter, treeHeight, 5, 1, color, branchCount, trans, rotAngles);
}

//code that creates the triangles for a cylinder with diameter 0.5
// and height of 0.5 (centered at the origin) with the number of subdivisions
// around the base and top of the cylinder (given by radialdivision) and
// the number of subdivisions along the surface of the cylinder given by
//heightdivision.
function makeBranch(origin, angle, diameter, height, radialdivision, heightdivision, color = [1, 0, 0], branchCount, trans, rotAngles, isTrunk = false) {

    //we are given origin of BOTTOM of cylinder, adjust this to be the middle
    //origin[1] = origin[1] + height / 2;

    //interpolate season and bark color to get seasonal bark!

    var offset = [];
    offset.push(-origin[0]);
    offset.push(-origin[1]);
    offset.push(-origin[2]);

    //we are given origin of BOTTOM of cylinder, adjust this to be the middle 
    origin[1] = origin[1] + height / 2;

    //draw top circle
    var xRadialPoints = [];
    var zRadialPoints = [];
    //TODO fix bug where it randomly grabs other points???
    let topCircleOrigin = origin.slice();
    topCircleOrigin.y += height / 2;
    var lst = drawCircle(topCircleOrigin, radialdivision, diameter, false, color, trans, offset);
    xRadialPoints = lst[0];
    zRadialPoints = lst[1];
    //TODO do a transformation on the branches so that they are spitting off at an angle instead of simply being next to them
    //x rotation

    
    for (var i = 0; i < radialdivision; i++) {
        drawCylinderFace(
            [xRadialPoints[i] + origin[0], -height / 2 + origin[1], zRadialPoints[i] + origin[2]],
            xRadialPoints[(i + 1) % radialdivision] - xRadialPoints[i],
            height,
            zRadialPoints[(i + 1) % radialdivision] - zRadialPoints[i],
            heightdivision,
            color,
            trans, offset);
    }

    var rot = mat4.copy(trans);
    var dir = vec4.create(0, height, 0, 0);
    dir = vec4.transformMat4(dir, rot);

    //drawCircle([origin[0], -height / 2 + origin[1], origin[2]], radialdivision, diameter, true, color, trans, offset);

    if (branchCount > 0) {
        var newDiameter = diameter / 2;
        var leftOrigin = [origin[0], origin[1] - height/2, origin[2]];
        for (var i = 0; i < 3; i++) {
            leftOrigin[i] += dir[i];
        }
        //get modified x and y w/ angle

        //TODO: add to new origin w/ unit vector of angle * height
        var newHeight = height / 2;
        var newAngle = angle;
        branchCount = branchCount - 1;

        // calculate transform mat of left branch
        var leftTrans = mat4.copy(trans);
        leftTrans = fullRotate(leftTrans, rotAngles);
        makeBranch(leftOrigin, newAngle, newDiameter, newHeight, radialdivision, heightdivision, color, branchCount, leftTrans, [20, 90, 45]);

        //calculate transform mat of right branch
        var rightTrans = mat4.copy(trans);
        rotAngles[2] = -rotAngles[2];
        rightTrans = fullRotate(rightTrans, rotAngles);

        var rightOrigin = [origin[0], origin[1] - height / 2, origin[2]];
        for (var i = 0; i < 3; i++) {
            rightOrigin[i] += dir[i];
        }
        makeBranch(rightOrigin, newAngle, newDiameter, newHeight, radialdivision, heightdivision, color, branchCount, rightTrans, [20, 90, 45]);
    }
    else if (!isTrunk){
        var newOrigin = [origin[0], origin[1] - height / 2, origin[2]];
        for (var i = 0; i < 3; i++) {
            newOrigin[i] += dir[i];
        }
        var leafDiameter = 3*diameter + 0.05;
        makeLeaf(newOrigin, leafDiameter);
    }
}


//TODO tie the color of the leaves to the individual season in some way
function makeLeaf(origin, diameter, color) {

    //generate color based on season
    //if season between 0.85 and 0.95, dont draw
    if (season > 0.65 && season < 1) {
        return;
    }
    if (season < 0.3) {
        diameter = diameter * (season/0.3);
    }
    var color = valueToColor(season);
    color[1] += 0.2;

    var xRadialPoints = [];
    var yRadialPoints = [];

    var radialdivision = 10;

    var radius = diameter;

    for (var i = 0; i < radialdivision; i++) {
        var x = radius * Math.cos(i * 2 * (Math.PI / radialdivision));
        var y = radius * Math.sin(i * 2 * (Math.PI / radialdivision));
        xRadialPoints[i] = x;
        yRadialPoints[i] = y;
    }
    addTriangle(origin[0], origin[1], origin[2],
        xRadialPoints[xRadialPoints.length - 1] + origin[0], origin[1] + yRadialPoints[yRadialPoints.length - 1], origin[2],
        xRadialPoints[0] + origin[0], origin[1] + yRadialPoints[0], origin[2],
        color);
    addTriangle(origin[0], origin[1], origin[2],
        xRadialPoints[0] + origin[0], origin[1] + yRadialPoints[0], origin[2],
        xRadialPoints[xRadialPoints.length - 1] + origin[0], origin[1] + yRadialPoints[yRadialPoints.length-1], origin[2],
        color);
    

    for (var i = 0; i < xRadialPoints.length - 1; i++) {
        addTriangle(origin[0], origin[1], origin[2],
            xRadialPoints[i] + origin[0], origin[1] + yRadialPoints[i], origin[2],
            xRadialPoints[i + 1] + origin[0], origin[1] + yRadialPoints[i + 1], origin[2],
            color);

        addTriangle(origin[0], origin[1], origin[2],
            xRadialPoints[i + 1] + origin[0], origin[1] + yRadialPoints[i + 1], origin[2],
            xRadialPoints[i] + origin[0], origin[1] + yRadialPoints[i], origin[2],
            color);
        
    }
}
function drawCircle(origin, radialdivision, diameter, clockwise, color = [1, 0, 0], trans = undefined, offset = undefined) {
    var radius = diameter / 2;

    var xRadialPoints = [];
    var zRadialPoints = [];

    for (var i = 0; i < radialdivision; i++) {
        var x = radius * Math.cos(i * 2 * (Math.PI / radialdivision));
        var z = radius * Math.sin(i * 2 * (Math.PI / radialdivision));
        xRadialPoints[i] = x;
        zRadialPoints[i] = z;
    }

    if (clockwise) {
        addTriangle(origin[0], origin[1], origin[2],
            xRadialPoints[xRadialPoints.length - 1] + origin[0], origin[1], zRadialPoints[zRadialPoints.length - 1] + origin[2],
            xRadialPoints[0] + origin[0], origin[1], zRadialPoints[0] + origin[2],
            color,
            trans, offset);
    }
    else {
        addTriangle(origin[0], origin[1], origin[2],
            xRadialPoints[0] + origin[0], origin[1], zRadialPoints[0] + origin[2],
            xRadialPoints[xRadialPoints.length - 1] + origin[0], origin[1], zRadialPoints[zRadialPoints.length - 1] + origin[2],
            color,
            trans, offset);
    }

    for (var i = 0; i < xRadialPoints.length - 1; i++) {
        if (clockwise) {
            addTriangle(origin[0], origin[1], origin[2],
                xRadialPoints[i] + origin[0], origin[1], origin[2] + zRadialPoints[i],
                xRadialPoints[i + 1] + origin[0], origin[1], origin[2] + zRadialPoints[i + 1],
                color,
                trans, offset);
        }
        else {
            addTriangle(origin[0], origin[1], origin[2],
                xRadialPoints[i + 1] + origin[0], origin[1], origin[2] + zRadialPoints[i + 1],
                xRadialPoints[i] + origin[0], origin[1], origin[2] + zRadialPoints[i],
                color,
                trans,offset);
        }
    }
    return [xRadialPoints, zRadialPoints];
}

function drawConePoint(origin, radialdivision, diameter, height, color = [1, 0, 0]) {
    var radius = diameter / 2;

    var xRadialPoints = [];
    var zRadialPoints = [];

    for (var i = 0; i < radialdivision; i++) {
        var x = radius * Math.cos(i * 2 * (Math.PI / radialdivision));
        var z = radius * Math.sin(i * 2 * (Math.PI / radialdivision));
        xRadialPoints[i] = x;
        zRadialPoints[i] = z;
    }

    addTriangle(
        xRadialPoints[xRadialPoints.length - 1] + origin[0], origin[1], zRadialPoints[zRadialPoints.length - 1] + origin[2],
        origin[0], origin[1] + height, origin[2],
        xRadialPoints[0] + origin[0], origin[1], zRadialPoints[0] + origin[2],
        color);

    for (var i = 0; i < xRadialPoints.length - 1; i++) {
        addTriangle(
            xRadialPoints[i] + origin[0], origin[1], origin[2] + zRadialPoints[i],
            origin[0], origin[1] + height, origin[2],
            xRadialPoints[i + 1] + origin[0], origin[1], origin[2] + zRadialPoints[i + 1],
            color);
    }

    return [xRadialPoints, zRadialPoints];
}

function drawHillColumn(topLeft, topRight, innerAngle, height, heightdivision, radialdivision, columnNumber, rowNumber, color = [1, 0, 0]) {

    //to calc bottom right and left points, use inner angle and row height
    //height = topleft[1] + rowHeight
    // bottom x and z can

    var rowHeight = height / heightdivision;

    //bottom right x and z 
    var bottomLeftY = topLeft[1] + rowHeight;

    var rowRadius = rowRadiusLst[rowNumber];

    let leftTheta = (columnNumber + 1) * 2 * (Math.PI / radialdivision);
    let rightTheta = columnNumber * 2 * (Math.PI / radialdivision);

    var bottomRightX = rowRadius * Math.cos(leftTheta);
    var bottomRightZ = rowRadius * Math.sin(leftTheta);

    //top triangle
    addTriangle(
        topRight[0], topRight[1], topRight[2],
        topLeft[0], topLeft[1], topLeft[2],
        bottomRightX, topLeft[1] - rowHeight, bottomRightZ,
        color);

    //bottom triangle 
    var bottomLeftX = rowRadius * Math.cos(rightTheta);
    var bottomLeftZ = rowRadius * Math.sin(rightTheta);
    addTriangle(
        bottomLeftX, topLeft[1] - rowHeight, bottomLeftZ,
        topRight[0], topRight[1], topRight[2],
        bottomRightX, topRight[1] - rowHeight, bottomRightZ,
        color);

    //check if should recurse
    if (rowNumber != heightdivision - 1) {
        drawHillColumn([bottomRightX, topLeft[1] - rowHeight, bottomRightZ], [bottomLeftX, topLeft[1] - rowHeight, bottomLeftZ], innerAngle, height, heightdivision, radialdivision, columnNumber, rowNumber + 1, color);
    }
}


function drawConeColumn(topLeft, topRight, innerAngle, height, heightdivision, radialdivision, columnNumber, rowNumber) {

    //to calc bottom right and left points, use inner angle and row height
    //height = topleft[1] + rowHeight
    // bottom x and z can

    var rowHeight = height / heightdivision;

    //bottom right x and z 
    bottomLeftY = topLeft[1] + rowHeight;

    rowRadius = (height/2 - (topLeft[1] - rowHeight)) * Math.tan((innerAngle)); //r = h * tan(x)

    let leftTheta = (columnNumber + 1) * 2 * (Math.PI / radialdivision);
    let rightTheta = columnNumber * 2 * (Math.PI / radialdivision);

    var bottomRightX = rowRadius * Math.cos(leftTheta);
    var bottomRightZ = rowRadius * Math.sin(leftTheta);

    //top triangle
    addTriangle(topLeft[0], topLeft[1], topLeft[2],
        topRight[0], topRight[1], topRight[2],
        bottomRightX, topLeft[1] - rowHeight, bottomRightZ);

    //bottom triangle 
    var bottomLeftX = rowRadius * Math.cos(rightTheta);
    var bottomLeftZ = rowRadius * Math.sin(rightTheta);
    addTriangle(topRight[0], topRight[1], topRight[2],
        bottomLeftX, topLeft[1] - rowHeight, bottomLeftZ,
        bottomRightX, topRight[1] - rowHeight, bottomRightZ);   

    //check if should recurse
    if (rowNumber != heightdivision -1) {
        drawConeColumn([bottomRightX, topLeft[1] - rowHeight, bottomRightZ], [bottomLeftX, topLeft[1] - rowHeight, bottomLeftZ], innerAngle, height, heightdivision, radialdivision, columnNumber, rowNumber + 1);
    }

}

//
// creates the triangles for a cone with diameter 0.5
// and height of 0.5 (centered at the origin) with the number of
// subdivisions around the base of the cone (given by radialdivision)
// and the number of subdivisions along the surface of the cone
//given by heightdivision.
//
function makeCone (radialdivision, heightdivision) {
    diameter = 0.5;
    height = 0.5;
    radius = diameter / 2;

    xRadialPoints = [];
    zRadialPoints = [];

    if (heightdivision <= 1) {
        xRadialPoints, zRadialPoints = drawConePoint([0, -height/2, 0], radialdivision, diameter, height);
        drawCircle([0, -height/2, 0], radialdivision, diameter, false);
        return;
    }

    var innerAngle = Math.atan(radius / height);
    console.log("inner angle : " + innerAngle);

    rowHeight = height / heightdivision;

    rowY = height / 2 - rowHeight;
    rowRadius = rowHeight * Math.tan(innerAngle); //r = h * tan(x)
    xRadialPoints, zRadialPoints = drawConePoint([0, height / 2 - rowHeight, 0], radialdivision, rowRadius * 2, rowHeight);

    ////draw a cone row 
    //for (var i = 0; i < radialdivision; i++) {
    //    rowY = height / 2 - rowHeight * i;
    //    rowRadius = rowHeight * i * Math.tan(innerAngle); //r = h * tan(x)
    //    drawSquarePolygon([xRadialPoints[i], rowY, zRadialPoints[i]], xRadialPoints[i] - xRadialPoints[(i + 1) % radialdivision], rowY, zRadialPoints[i] - zRadialPoints[(i + 1) % radialdivision])
    //}

    for (var i = 0; i < radialdivision; i++) {
        rowY = height / 2 - rowHeight;
        const topLeft = [xRadialPoints[(i + 1) % radialdivision], rowY, zRadialPoints[(i + 1) % radialdivision]];
        const topRight = [xRadialPoints[i], rowY, zRadialPoints[i]];
        drawConeColumn(topLeft, topRight, innerAngle, height, heightdivision, radialdivision, i, 1);
    }

    drawCircle([0, -height / 2, 0], radialdivision, diameter, false);

}

function makeHill(radialdivision, heightdivision) {
    var diameter = hillDiameter;
    var height = hillHeight;
    
    var radius = diameter / 2;

    var xRadialPoints = [];
    var zRadialPoints = [];

    var color = valueToColor(season + Math.random() * 0.05);

    if (heightdivision <= 1) {
        var result = drawConePoint([0, -height / 2, 0], radialdivision, diameter, height, color);
        xRadialPoints = result[0];
        zRadialPoints = result[1];
        drawCircle([0, -height / 2, 0], radialdivision, diameter, true, color);
        return;
    }

    var innerAngle = Math.atan(radius / height);

    var rowHeight = height / heightdivision;

    var rowY = height / 2 - rowHeight;
    var rowRadius = rowHeight * Math.tan(innerAngle); //r = h * tan(x)
    var result = drawConePoint([0, height / 2 - rowHeight + hillOriginY, 0], radialdivision, rowRadius * 2, rowHeight, color);
    xRadialPoints = result[0];
    zRadialPoints = result[1];

    //gen rowRadiusLst if needs to be 
    if (rowRadiusLst[0] == [0.0]) {
        rowRadiusLst = [];
        for (var i = 0; i < heightdivision; i++) {
            var rad = 0;
            if (i == 0) {
                rad = (height / 2 - (rowY - rowHeight * (i))) * Math.tan((innerAngle));
            }
            else {
                rad = rowRadiusLst[i - 1];
            }
            if (i < 6) {
                rad = Math.random() * (rad * 1.5) + rad;
                rad = Math.min(rad, diameter / 2 * ((i + 1) / heightdivision))
            }
            else {
                rad = Math.random() * (rad * 0.1) + rad;
                rad = Math.min(rad, diameter/2*((i+1)/heightdivision))
            }
            
            rowRadiusLst[i] = rad;
        }
    }

    for (var i = 0; i < radialdivision; i++) {
        rowY = height / 2 - rowHeight + hillOriginY;
        const topLeft = [xRadialPoints[(i + 1) % radialdivision], rowY, zRadialPoints[(i + 1) % radialdivision]];
        const topRight = [xRadialPoints[i], rowY, zRadialPoints[i]];
        drawHillColumn(topLeft, topRight, innerAngle, height, heightdivision, radialdivision, i, 1, color);
    }

}

export function radians(degrees)
{
  var pi = Math.PI;
  return degrees * (pi/180);
}

function addTriangle (x0,y0,z0,x1,y1,z1,x2,y2,z2, color = [0.2, 0.7, 0.5], transformMat = undefined, offsetTrans = undefined) {

    if (transformMat == undefined) {
        transformMat = mat4.identity();
    }
    if (offsetTrans == undefined) {
        offsetTrans = [0, 0, 0];
    }
    
    var nverts = points.length / 3;

    //transform vertex 
    var v0 = vec4.create(x0, y0, z0, 1);

    //translate to offset from origin
    for (var i = 0; i < 3; i++) {
        v0[i] += offsetTrans[i];
    }

    v0 = vec4.transformMat4(v0, transformMat);

    //translate back
    for (var i = 0; i < 3; i++) {
        v0[i] -= offsetTrans[i];
    }

    // push first vertex
    points.push(v0[0]);  bary.push (1.0);
    points.push(v0[1]);  bary.push (0.0);
    points.push(v0[2]);  bary.push (0.0);
    indices.push(nverts);
    nverts++;

    colors.push(color[0]);
    colors.push(color[1]);
    colors.push(color[2]);

    var v1 = vec4.create(x1, y1, z1, 1);
    //translate to offset from origin
    for (var i = 0; i < 3; i++) {
        v1[i] += offsetTrans[i];
    }
    v1 = vec4.transformMat4(v1, transformMat);
    //translate back
    for (var i = 0; i < 3; i++) {
        v1[i] -= offsetTrans[i];
    }
    // push second vertex
    points.push(v1[0]); bary.push (0.0);
    points.push(v1[1]); bary.push (1.0);
    points.push(v1[2]); bary.push (0.0);
    indices.push(nverts);
    nverts++

    colors.push(color[0]);
    colors.push(color[1]);
    colors.push(color[2]);

    var v2 = vec4.create(x2, y2, z2, 1);
    //translate to offset from origin
    for (var i = 0; i < 3; i++) {
        v2[i] += offsetTrans[i];
    }
    v2 = vec4.transformMat4(v2, transformMat);
    //translate back
    for (var i = 0; i < 3; i++) {
        v2[i] -= offsetTrans[i];
    }
    // push third vertex
    points.push(v2[0]); bary.push (0.0);
    points.push(v2[1]); bary.push (0.0);
    points.push(v2[2]); bary.push (1.0);
    indices.push(nverts);
    nverts++;

    colors.push(color[0]);
    colors.push(color[1]);
    colors.push(color[2]);
}


function valueToColor(value) {
    // Ensure the value is clamped between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // Define the color stops: [value, [r, g, b]]
    const colorStops = [
        [0, [0.2, 0.7, 0.4]],    // Bright green at 0.125
        [0.375, [0, 0.3, 0]],  // Dark green at 0.375
        [0.625, [0.5, 0.2, 0]],// Rust color at 0.625
        [0.875, [0.7, 0.9, 1]],// Pale blue at 0.875
        [1, [0.2, 0.7, 0.4]]         // bright green
    ];

    // Find the two stops the value is between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];

    for (let i = 0; i < colorStops.length - 1; i++) {
        if (value >= colorStops[i][0] && value <= colorStops[i + 1][0]) {
            lowerStop = colorStops[i];
            upperStop = colorStops[i + 1];
            break;
        }
    }

    // Interpolate between the two stops
    const t = (value - lowerStop[0]) / (upperStop[0] - lowerStop[0]);
    const color = lowerStop[1].map((c, i) => c + t * (upperStop[1][i] - c));

    return color;
}

export function makeHillGarden() {
    makeHill(15, 20);

    for (var i = 0; i < trees.length; i++) {
        makeTree(i);
    }
}

function initTree() {
    var x = 0; var z = 0;
    var y = hillHeight / 2 - 0.02 + hillOriginY;
    var origin = [x, y, z];

    var treeHeight = 0.4 * Math.random() + 0.05;
    var branchCount = Math.round(Math.random() * 5) + 2;
    //TODO remove
    var trunkHeight = Math.random() * 0.05;
    var trunkHeight = Math.random() * 0.05;
    var diameter = Math.random() * 0.01 + 0.03;

    var seasonColor = valueToColor(season);
    var barkColor = [0.8, 0.4, 0.2];
    var color = barkColor;
    color = color.map((c, i) => c + 0.3 * (seasonColor[i] - c));

    var trans = mat4.identity();
    mat4.rotateY(trans, radians(90), trans);

    var rotAngles = [20, 90, 45];

    var tree = new Tree(origin, trunkHeight, treeHeight, color, branchCount, diameter, trans, rotAngles);

    trees.push(tree);
}

export function initHillGarden() {
    //init all the trees
    trees = [];
    var n = Math.round(Math.random() * maxTrees);
    //TODO: remove
    n = 1;
    for (var i = 0; i < n; i++) {
        initTree();
    }
    console.log(trees);
}


export function advanceSeason() {
    var seasonInc = 0.005;
    if (season + seasonInc > 1) {
        ageTrees();
    }
    season = (season + seasonInc) % 1;
}

function ageTrees() {
    for (var i = 0; i < trees.length; i++) {
        trees[i].branchCount += 1;
        trees[i].height += trees[i].height * 0.5;
        trees[i].diameter += trees[i].diameter * 0.05;
    }
}

//rotate a matrix by x, y, z, angles in the XYZ axises and return mat
function fullRotate(m, rotation) {
    mat4.rotateX(m, radians(rotation[0]), m);
    mat4.rotateY(m, radians(rotation[1]), m);
    mat4.rotateZ(m, radians(rotation[2]), m);
    return m;
}