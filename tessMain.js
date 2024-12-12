'use strict';

import { makeHillGarden, initHillGarden, radians, advanceSeason, makeCube} from './cgIShape.js';

//import { mat3, mat3d, mat3n, mat4, quat, utils } from '../FinalProject/wgpu-matrix/dist/3.x/wgpu-matrix.module.js';
  // Global variables that are set and used
  // across the application
let verticesSize,
    vertices,
    adapter,
    gl,
    colorAttachment,
    colorTextureView,
    colorTexture,
    depthTexture,
    code,
    computeCode,
    shaderDesc,
    colorState,
    shaderModule,
    pipeline,
    renderPassDesc,
    commandEncoder,
    passEncoder,
    device,
    drawingTop,
    drawingLeft,
    canvas,
    bary,
    points,
    uniformValues,
    uniformDistanceValues,
    uniformBindGroup,
    indices,
    colors;

export { colors, points, bary, indices };

  // buffers
  let myVertexBuffer = null;
  let myBaryBuffer = null;
  let myColorBuffer = null;
  let myIndexBuffer = null;
  let uniformBuffer;
  let uniformDistanceBuffer;

  // Other globals with default values;
  var division1 = 3;
  var division2 = 1;
  var updateDisplay = true;
  var anglesReset = [0.0, 0.0, 0.0, 0.0];
  var angles = [0.0, 0.0, 0.0, 0.0];
  var distance = [0.0, 0.0, 0.0, 0.0];
  var angleInc = 5.0;
  var distanceInc = 0.05;
  
  // Shapes we can draw
  var CUBE = 1;
  var CYLINDER = 2;
  var CONE = 3;
  var COMPUTECUBE = 4;
  var curShape = CUBE;

// set up the shader var's
function setShaderInfo() {
    // set up the shader code var's
    code = document.getElementById('shader').innerText;
    shaderDesc = { code: code };
    shaderModule = device.createShaderModule(shaderDesc);
    colorState = {
        format: 'bgra8unorm'
    };

    // set up depth
    // depth shading will be needed for 3d objects in the future
    depthTexture = device.createTexture({
        size: [canvas.width, canvas.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
}

  // Create a program with the appropriate vertex and fragment shaders
  async function initProgram() {

      // Check to see if WebGPU can run
      if (!navigator.gpu) {
          console.error("WebGPU not supported on this browser.");
          return;
      }

      // get webgpu browser software layer for graphics device
      adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
          console.error("No appropriate GPUAdapter found.");
          return;
      }

      // get the instantiation of webgpu on this device
      device = await adapter.requestDevice();
      if (!device) {
          console.error("Failed to request Device.");
          return;
      }

      // configure the canvas
      gl = canvas.getContext('webgpu');
      const canvasConfig = {
          device: device,
          // format is the pixel format
          format: navigator.gpu.getPreferredCanvasFormat(),
          // usage is set up for rendering to the canvas
          usage:
              GPUTextureUsage.RENDER_ATTACHMENT,
          alphaMode: 'opaque'
      };
      gl.configure(canvasConfig);
  }

  // general call to make and bind a new object based on current
  // settings..Basically a call to shape specfic calls in cgIshape.js
async function createNewShape() {

    console.log("inside create new shape: " + curShape);
    // Call the functions in an appropriate order
    setShaderInfo();

    // clear your points and elements
    points = [];
    indices = [];
    bary = [];
    colors = [];
    
    // make your shape based on type
    if (curShape == CUBE) makeCube(division1);
    else if (curShape == CYLINDER) makeCylinder([0, 0, 0], [0, 0, 0], division1, division2);
    else if (curShape == CONE) makeCone(division1, division2);
    else if (curShape == COMPUTECUBE) makeComputeCube(division1);
    else
        console.error(`Bad object type`);

    createPipeline();
}

async function createPipeline() {
    // create and bind vertex buffer

    // set up the attribute we'll use for the vertices
    const vertexAttribDesc = {
        shaderLocation: 0, // @location(0) in vertex shader
        offset: 0,
        format: 'float32x3' // 3 floats: x,y,z
    };

    // this sets up our buffer layout
    const vertexBufferLayoutDesc = {
        attributes: [vertexAttribDesc],
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3, // sizeof(float) * 3 floats
        stepMode: 'vertex'
    };

    // buffer layout and filling
    const vertexBufferDesc = {
        size: points.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    };
    myVertexBuffer = device.createBuffer(vertexBufferDesc);
    let writeArray =
        new Float32Array(myVertexBuffer.getMappedRange());

    writeArray.set(points); // this copies the buffer
    myVertexBuffer.unmap();

    // create and bind bary buffer
    const baryAttribDesc = {
        shaderLocation: 1, // @location(1) in vertex shader
        offset: 0,
        format: 'float32x3' // 3 floats: x,y,z
    };

    // this sets up our buffer layout
    const myBaryBufferLayoutDesc = {
        attributes: [baryAttribDesc],
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3, // 3 bary's
        stepMode: 'vertex'
    };

    // buffer layout and filling
    const myBaryBufferDesc = {
        size: bary.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    };
    myBaryBuffer = device.createBuffer(myBaryBufferDesc);
    let writeBaryArray =
        new Float32Array(myBaryBuffer.getMappedRange());

    writeBaryArray.set(bary); // this copies the buffer
    myBaryBuffer.unmap();


    //COLOR BUFFER
    // create and bind color buffer
    const colorAttribDesc = {
        shaderLocation: 2, // @location(1) in vertex shader
        offset: 0,
        format: 'float32x3' // 3 floats: r,g,b,a
    };

    // this sets up our buffer layout
    const myColorBufferLayoutDesc = {
        attributes: [colorAttribDesc],
        arrayStride: Float32Array.BYTES_PER_ELEMENT * 3, // 3 
        stepMode: 'vertex'
    };

    // buffer layout and filling
    const myColorBufferDesc = {
        size: colors.length * Float32Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    };
    myColorBuffer = device.createBuffer(myColorBufferDesc);
    let writeColorArray =
        new Float32Array(myColorBuffer.getMappedRange());

    writeColorArray.set(colors); // this copies the buffer
    myColorBuffer.unmap();

    // setup index buffer

    // first guarantee our mapped range is a multiple of 4
    // mainly necessary becauses uint16 is only 2 and not 4 bytes
    if (indices.length % 2 != 0) {
        indices.push(indices[indices.length - 1]);
    }
    const myIndexBufferDesc = {
        size: indices.length * Uint16Array.BYTES_PER_ELEMENT,
        usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    };
    myIndexBuffer = device.createBuffer(myIndexBufferDesc);
    let writeIndexArray =
        new Uint16Array(myIndexBuffer.getMappedRange());

    writeIndexArray.set(indices); // this copies the buffer
    myIndexBuffer.unmap();

    // Set up the uniform var
    let uniformBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: {},
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX,
                buffer: {}
            },
            {
                binding: 2,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 3,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
            {
                binding: 4,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
        ]
    });

    // set up the pipeline layout
    const pipelineLayoutDesc = { bindGroupLayouts: [uniformBindGroupLayout] };
    const layout = device.createPipelineLayout(pipelineLayoutDesc);

    // pipeline desc
    const pipelineDesc = {
        layout,
        vertex: {
            module: shaderModule,
            entryPoint: 'vs_main',
            buffers: [vertexBufferLayoutDesc, myBaryBufferLayoutDesc, myColorBufferLayoutDesc]
        },
        fragment: {
            module: shaderModule,
            entryPoint: 'fs_main',
            targets: [colorState]
        },
        depthStencil: {
            depthWriteEnabled: true,
            depthCompare: 'less',
            format: 'depth24plus',
        },
        primitive: {
            topology: 'triangle-list', //<- MUST change to draw lines! 
            frontFace: 'cw', // this doesn't matter for lines
            cullMode: 'back'
        }
    };

    pipeline = device.createRenderPipeline(pipelineDesc);

    uniformValues = new Float32Array(angles);
    uniformDistanceValues = new Float32Array(distance);

    uniformBuffer = device.createBuffer({
        size: uniformValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    uniformDistanceBuffer = device.createBuffer({
        size: uniformDistanceValues.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // copy the values from JavaScript to the GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    device.queue.writeBuffer(uniformDistanceBuffer, 0, uniformDistanceValues);

    //DELETE
    const kTextureWidth = 5;
    const kTextureHeight = 7;
    const p = [200, 57, 247, 255];  // pink
    const d = [252, 78, 252, 255];  // light pink
    const y = [255, 255, 0, 255];  // yellow
    const b = [159, 107, 232, 255];  // blue
    const textureData = new Uint8Array([
        b, p, p, p, y,
        b, d, d, d, y,
        b, d, d, d, y,
        b, d, y, y, y,
        b, d, d, d, y,
        b, d, d, d, y,
        b, p, p, p, y,
    ].flat());

    const texture = device.createTexture({
        label: 'yellow F on red',
        size: [kTextureWidth, kTextureHeight],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
        { texture },
        textureData,
        { bytesPerRow: kTextureWidth * 4 },
        { width: kTextureWidth, height: kTextureHeight },
    );

    const barkTextureWidth = 7;
    const barkTextureHeight = 7;
    const l = [92, 56, 21, 255]; //brown ish 
    const z = [171, 140, 2, 255];  // zellow
    const m = [0, 200, 200, 255];  // blue
    const barkTextureData = new Uint8Array([
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
        l, z, l, z, l, z, l,
    ].flat());

    const barkTexture = device.createTexture({
        label: 'a b c',
        size: [barkTextureWidth, barkTextureHeight],
        format: 'rgba8unorm',
        usage:
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_DST,
    });
    device.queue.writeTexture(
        { texture: barkTexture },
        barkTextureData,
        { bytesPerRow: barkTextureWidth * 4 },
        { width: barkTextureWidth, height: barkTextureHeight },
    );

    const sampler = device.createSampler({
        addressModeU: 'clamp-to-edge',
        addressModeU: 'clamp-to-edge',
        magFilter: 'linear',
    })


    uniformBindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: { buffer: uniformBuffer },

            },
            {
                binding: 1,
                resource: { buffer: uniformDistanceBuffer },
            },
            {
                binding: 2,
                resource: sampler
            },
            {
                binding: 3,
                resource: texture.createView()
            },
            {
                binding: 4,
                resource: barkTexture.createView()
            },
        ],
    });



    // indicate a redraw is required.
    updateDisplay = true;
}

// general call to make and bind a new object based on current
// settings..Basically a call to shape specfic calls in cgIshape.js
async function createHillGarden() {

    console.log("inside create new shape: " + curShape);
    // Call the functions in an appropriate order
    setShaderInfo();

    // clear your points and elements
    points = [];
    indices = [];
    bary = [];
    colors = [];

    makeHillGarden();

    // create and bind vertex buffer

    createPipeline();
}

// We call draw to render to our canvas
function draw() {
    //console.log("inside draw");
    //console.log("angles: " + angles[0] + " " +angles[1] + " " + angles[2]);

    // set up color info
    colorTexture = gl.getCurrentTexture();
    colorTextureView = colorTexture.createView();
    

    // a color attachment ia like a buffer to hold color info
    colorAttachment = {
        view: colorTextureView,
        clearValue: { r: 0.6, g: 0.8, b: 1.0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store'
    };

    renderPassDesc = {
        colorAttachments: [colorAttachment],
        depthStencilAttachment: {
            view: depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    };

    // convert to radians before sending to shader
    uniformValues[0] = radians(angles[0]);
    uniformValues[1] = radians(angles[1]);
    uniformValues[2] = radians(angles[2]);
    uniformDistanceValues[0] = distance[0];
    uniformDistanceValues[1] = distance[1];
    uniformDistanceValues[2] = distance[2];

    // copy the values from JavaScript to the GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues);
    device.queue.writeBuffer(uniformDistanceBuffer, 0, uniformDistanceValues);

    // create the render pass
    commandEncoder = device.createCommandEncoder();
    passEncoder = commandEncoder.beginRenderPass(renderPassDesc);
    passEncoder.setViewport(0, 0,canvas.width, canvas.height, 0, 1);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniformBindGroup);
    passEncoder.setVertexBuffer(0, myVertexBuffer);
    passEncoder.setVertexBuffer(1, myBaryBuffer);
    passEncoder.setVertexBuffer(2, myColorBuffer);
    passEncoder.setIndexBuffer(myIndexBuffer, "uint16");
    passEncoder.drawIndexed(indices.length, 1);
    passEncoder.end();

    // submit the pass to the device
    device.queue.submit([commandEncoder.finish()]);
}

function update() {
    console.log("update");

    createHillGarden();
    draw();
    makeCube(2);
}



async function handleKey(event) {
    var key = event.key;

    //  incremental rotation
    if (key == 'z')
        angles[1] += angleInc;
    else if (key == 'x')
        angles[1] -= angleInc;
    else if (key == "ArrowUp" && distance[2] < 1)
        distance[2] += distanceInc;
    else if (key == "ArrowDown" && distance[2] > -1)
        distance[2] -= distanceInc;
    else if ((key == "ArrowLeft" || key == 'a') && distance[0] > -4)
        distance[0] -= distanceInc;
    else if ((key == "ArrowRight" || key == 'd') && distance[0] < 4)
        distance[0] += distanceInc;
    else if (key == 'w' && distance[1] < 2)
        distance[1] += distanceInc;
    else if (key == 's' && distance[1] > -2)
        distance[1] -= distanceInc;

    else if (key == "Enter") {
        advanceSeason();
    }


    // shape selection
    else if (key == '1' || key == 'c') {
        curShape = CUBE;
    }
    else if (key == '2' || key == 'C') {
        curShape = CYLINDER;
    }
    else if (key == '3' || key == 'n') {
        curShape = CONE;
    } else if (key == '4') {
        curShape = COMPUTECUBE;
    }

    // tessellation control
    else if (key == '+') {
        division1 = division1 + 1;
    }
    else if (key == '=') {
        division2 = division2 + 1;
    }
    else if (key == '-') {
        if (division1 > 1) {
            division1 = division1 - 1;
        }
    }
    else if (key == '_') {
        if (division2 > 1) {
            division2 = division2 - 1;
        }
    }

    // reset
    else if (key == 'r' || key == 'R') {
        angles[0] = anglesReset[0];
        angles[1] = anglesReset[1];
        angles[2] = anglesReset[2];
    }
    

    update();
}

  // Entry point to our application
async function init() {
    // Retrieve the canvas
    canvas = document.querySelector("canvas");

    // deal with keypress
    window.addEventListener('keydown', handleKey, false);

    // Read, compile, and link your shaders
    await initProgram();

    initHillGarden();

    // create and bind your current object
    createHillGarden();

    // do a draw
    draw();


}

function fetchAndCreateBitmap(url) {
    // Create an async helper function
    const fetchHelper = async () => {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const blob = await response.blob(); // Get the response as a blob
        return createImageBitmap(blob, {colorSpaceConversion: 'none'});   
    };

    // Use the helper and handle the promise
    return fetchHelper()
        .then((bitmap) => {
            console.log("Bitmap created:", bitmap); // Use the bitmap
            return bitmap; // Return the bitmap for further use
        })
        .catch((error) => {
            console.error("Error fetching or creating bitmap:", error);
        });
}


window.onload = init;
