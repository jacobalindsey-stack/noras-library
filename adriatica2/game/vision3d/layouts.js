// ADRIATICA — vision level layouts.
//
// A level IS this data. Code generates both the meshes and the walkable node
// graph from it, so the two cannot disagree. No Math.random anywhere: the
// same layout must build identically every time.
//
// CONVENTIONS
//   Units are 1 = one walkable tile. Y is up.
//   platform / pillar : `at` is the centre of the piece's TOP face.
//                       `size` is [width(x), height(y), depth(z)].
//                       The mesh hangs DOWN from `at`.
//   stair             : `at` is the centre of the FIRST step's top face.
//                       Rises 0.5 and advances 1.0 per step along `dir`.
//                       `dir` is 'N'(-z) 'S'(+z) 'E'(+x) 'W'(-x).
//                       To make a descending flight, author it from the
//                       bottom and point it uphill.
//   span              : `from`/`to` are top-surface points; `width` across.
//                       Axis-aligned only.
//   arch              : decorative. `at` is the centre of the opening at
//                       its base. Corbelled from boxes, no walkable nodes.
//
// Walkable nodes are snapped to a global half-integer lattice, so pieces
// join up automatically wherever they meet. Nothing is registered by hand.

// Placement, decided against the game as currently built:
//   Level 1 "The Gap"         -> replaces vision V1, fired from the underwater
//                                WAIT at Kasjuni. That wait is now gated on
//                                understoodRelief, so the museum always
//                                precedes the vision.
//   Level 2 "The Light Moves" -> replaces vision V4, fired from cave-deep,
//                                which is where the four voices first sound
//                                together. NOT the Kasjuni finale.
export const VISION_LEVELS = {
  V1: { level: 'gap', scene: 'underwater' },
  V4: { level: 'light', scene: 'cave-deep' },
};

export const LAYOUTS = {
  // Checkpoint 3's proof: two platforms with NO world edge between them. The
  // goal platform is only reachable by turning to orbit 0, where its near
  // corner lands exactly on the start platform's far corner in screen space
  // (offset along that orbit's view ray: equal x/z, y = 1.1597x). At every
  // other orbit the join does not exist and the goal is unreachable. This is
  // the whole mechanic, isolated. Verified by the solver.
  trivial4: {
    palette: 'gap',
    viewSize: 22,
    start: [1.5, 0, 1.5],
    goal: [7.5, 6.958, 7.5],
    pieces: [
      { type: 'platform', at: [0, 0, 0], size: [4, 1, 4] },
      { type: 'platform', at: [7.5, 6.958, 7.5], size: [3, 1, 3], color: 'goldLight' },
      { type: 'pillar', at: [7.5, 5.958, 7.5], size: [0.7, 8, 0.7], color: 'umberDeep' },
    ],
  },

  // Checkpoint 1's probe. NOT Level 1 — a representative arrangement of
  // every piece type, at a range of depths, to judge the render pipeline.
  probe: {
    palette: 'gap',
    viewSize: 30,
    target: [4, 2.5, -6],
    pieces: [
      { type: 'platform', at: [0, 0, 0], size: [6, 1, 6], color: 'goldDeep' },
      { type: 'stair', at: [3.5, 0.5, -0.5], dir: 'E', length: 5 },
      { type: 'platform', at: [10, 2.5, -0.5], size: [4, 1, 6] },
      { type: 'pillar', at: [8.5, 1.5, -3], size: [0.7, 5, 0.7] },
      { type: 'pillar', at: [11.5, 1.5, 2], size: [0.7, 5, 0.7] },
      { type: 'stair', at: [10.5, 3, -3.5], dir: 'N', length: 5 },
      { type: 'platform', at: [10.5, 5, -10], size: [6, 1, 6], color: 'goldLight' },
      { type: 'arch', at: [10.5, 5, -10], span: 5, height: 4.5, depth: 1.4, thickness: 0.9 },
      { type: 'span', from: [7.5, 5, -10.5], to: [1.5, 5, -10.5], width: 1.6 },
      { type: 'platform', at: [-1, 5, -10.5], size: [4, 1, 4] },
      // Folds back over the first terrace, two units above it.
      { type: 'stair', at: [-1.5, 2, -3.5], dir: 'N', length: 6 },
      { type: 'platform', at: [-1.5, 2, -1.5], size: [3, 1, 3], color: 'umberMid' },
      // Detached, deep in the fog.
      { type: 'platform', at: [10.5, 7.5, -19], size: [5, 1, 5], color: 'umberDeep' },
      { type: 'pillar', at: [10.5, 6.5, -19], size: [0.8, 6, 0.8], color: 'umberDeep' },
    ],
  },

  // Level 1 - "The Gap". Ascending terraces that join only when the camera
  // turns to that leg orbit, so climbing forces the whole rotation sequence.
  // Generated from view-ray offsets, then frozen here as data. Solver-checked.
  level1: {mode:"rotate",palette:"gap",viewSize:40,follow:true,followLift:3,fogNear:62,fogFar:150,start:[-2.5,0,-2.5],goal:[-0.5,41.748,12.5],figures:[{at:[-1.2,41.748,11],yaw:0.3},{at:[-0.4,41.748,10.6],yaw:0.1},{at:[0.4,41.748,11],yaw:-0.2},{at:[2,41.748,13.6],yaw:2.4,color:"umberMid"}],target:[0,18.787,6],pieces:[{type:"platform",at:[0,0,0],size:[6,1,6],color:"goldDeep"},{type:"pillar",at:[0,-1,0],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[3.6,-0.3,0],size:[1.2,0.4,4.2],color:"umberMid",walkable:false},{type:"platform",at:[6,6.958,6],size:[4,1,5],color:"goldMid"},{type:"pillar",at:[6,5.958,6],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[8.6,6.658,6],size:[1.2,0.4,3.5],color:"umberMid",walkable:false},{type:"platform",at:[0,13.916,12],size:[5,1,4],color:"goldMid"},{type:"pillar",at:[0,12.916,12],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[3.1,13.616,12],size:[1.2,0.4,2.8],color:"umberMid",walkable:false},{type:"platform",at:[-6,20.874,6],size:[4,1,4],color:"goldMid"},{type:"pillar",at:[-6,19.874,6],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[-3.4,20.574,6],size:[1.2,0.4,2.8],color:"umberMid",walkable:false},{type:"platform",at:[0,27.832,0],size:[5,1,5],color:"goldMid"},{type:"pillar",at:[0,26.832,0],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[3.1,27.532,0],size:[1.2,0.4,3.5],color:"umberMid",walkable:false},{type:"platform",at:[6,34.79,6],size:[4,1,5],color:"goldLight"},{type:"pillar",at:[6,33.79,6],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[8.6,34.49,6],size:[1.2,0.4,3.5],color:"umberMid",walkable:false},{type:"platform",at:[0,41.748,12],size:[6,1,5],color:"goldLight"},{type:"pillar",at:[0,40.748,12],size:[0.8,7,0.8],color:"umberDeep"},{type:"platform",at:[3.6,41.448,12],size:[1.2,0.4,3.5],color:"umberMid",walkable:false},{type:"arch",at:[6,6.958,3.1],span:3,height:4.5,depth:1.2,thickness:0.8},{type:"arch",at:[-6,20.874,3.6],span:3,height:4.5,depth:1.2,thickness:0.8},{type:"arch",at:[0,27.832,-2.9],span:4,height:4.5,depth:1.2,thickness:0.8},{type:"platform",at:[-6,3,-12],size:[2.5,1,2.5],color:"umberMid",walkable:false},{type:"pillar",at:[-6,2,-12],size:[0.6,9,0.6],color:"umberDeep"},{type:"platform",at:[14,7,4],size:[2.5,1,2.5],color:"umberDeep",walkable:false},{type:"pillar",at:[14,6,4],size:[0.6,9,0.6],color:"umberDeep"},{type:"platform",at:[-10,10,6],size:[2.5,1,2.5],color:"umberMid",walkable:false},{type:"pillar",at:[-10,9,6],size:[0.6,9,0.6],color:"umberDeep"},{type:"platform",at:[18,12,-8],size:[2.5,1,2.5],color:"umberDeep",walkable:false},{type:"pillar",at:[18,11,-8],size:[0.6,9,0.6],color:"umberDeep"},{type:"platform",at:[6,15,-14],size:[2.5,1,2.5],color:"umberMid",walkable:false},{type:"pillar",at:[6,14,-14],size:[0.6,9,0.6],color:"umberDeep"},{type:"platform",at:[22,16,10],size:[2.5,1,2.5],color:"umberDeep",walkable:false},{type:"pillar",at:[22,15,10],size:[0.6,9,0.6],color:"umberDeep"},{type:"span",from:[0,13.416,12],to:[5,13.416,12],width:1.2,thickness:0.4,walkable:false},{type:"platform",at:[-3.6,-0.3,0],size:[1.2,0.4,3.6],color:"umberMid",walkable:false},{type:"platform",at:[-3.1,13.616,12],size:[1.2,0.4,2.4],color:"umberMid",walkable:false},{type:"platform",at:[-3.1,27.532,0],size:[1.2,0.4,3],color:"umberMid",walkable:false},{type:"platform",at:[-3.6,41.448,12],size:[1.2,0.4,3],color:"umberMid",walkable:false}]},

  // Level 2 - "The Light Moves". A staircase-ramp descending into Vela Spila.
  // Two shafts of light sweep a loop over the stone; she may only stand where
  // light is, so the walkable set is a moving shape. The final ledge lights
  // only after several seconds of stillness. Camera fixed - no rotation here.
  level2: {mode:"light",palette:"light",viewSize:30,fogNear:48,fogFar:130,start:[0,6,-6],goal:[0,-2,10],finalLedge:[0,-2,10],figures:[{at:[-1.2,-2,10.9],yaw:3,color:"greyBrown"},{at:[-0.4,-2,11.3],yaw:3.1,color:"greyBrown"},{at:[0.5,-2,10.9],yaw:3.2,color:"greyBrown"},{at:[2.2,-2,8.6],yaw:0.4,color:"stoneShade"}],target:[0,2,4],lights:[{path:[[-3,-6],[3,-6],[3,12],[-3,12]],radius:3.6,period:22,phase:0},{path:[[-3,-6],[3,-6],[3,12],[-3,12]],radius:3.2,period:22,phase:0.5}],pieces:[{type:"platform",at:[0,6,-6],size:[9,1,1],color:"greyDark"},{type:"platform",at:[0,5.5,-5],size:[9,1,1],color:"greyBrown"},{type:"platform",at:[0,5,-4],size:[9,1,1],color:"greyDark"},{type:"platform",at:[0,4.5,-3],size:[9,1,1],color:"greyBrown"},{type:"platform",at:[0,4,-2],size:[9,1,1],color:"greyDark"},{type:"platform",at:[0,3.5,-1],size:[9,1,1],color:"greyBrown"},{type:"platform",at:[0,3,0],size:[9,1,1],color:"greyDark"},{type:"platform",at:[0,2.5,1],size:[9,1,1],color:"greyBrown"},{type:"platform",at:[0,2,2],size:[9,1,1],color:"greyDark"},{type:"platform",at:[0,1.5,3],size:[9,1,1],color:"greyBrown"},{type:"platform",at:[0,1,4],size:[8,1,1],color:"greyDark"},{type:"platform",at:[0,0.5,5],size:[7,1,1],color:"greyBrown"},{type:"platform",at:[0,0,6],size:[6,1,1],color:"greyDark"},{type:"platform",at:[0,-0.5,7],size:[5,1,1],color:"greyBrown"},{type:"platform",at:[0,-1,8],size:[4,1,1],color:"greyDark"},{type:"platform",at:[0,-1.5,9],size:[3,1,1],color:"greyBrown"},{type:"platform",at:[0,-2,10],size:[3,1,1],color:"bone"},{type:"platform",at:[-5.5,15,8.5],size:[7,1.4,3],color:"stoneShade",walkable:false},{type:"platform",at:[6,15,8.5],size:[6,1.4,3],color:"stoneShade",walkable:false},{type:"platform",at:[0,15,-5.5],size:[18,1.4,5],color:"stoneShade",walkable:false},{type:"platform",at:[0,15,13.5],size:[18,1.4,5],color:"stoneShade",walkable:false},{type:"platform",at:[-3,15,3],size:[4,1.4,2],color:"stoneShade",walkable:false},{type:"platform",at:[0,15,7.5],size:[18,1.4,3],color:"stoneShade",walkable:false},{type:"platform",at:[-11,5,4],size:[1.5,22,24],color:"stoneShade",walkable:false},{type:"platform",at:[11,5,4],size:[1.5,22,24],color:"stoneShade",walkable:false},{type:"platform",at:[0,5,17],size:[24,22,1.5],color:"stoneShade",walkable:false},{type:"pillar",at:[-6,14,1],size:[0.8,9,0.8],color:"greyDark"},{type:"pillar",at:[7,14,-2],size:[0.8,9,0.8],color:"greyDark"},{type:"pillar",at:[-3,14,12],size:[0.8,9,0.8],color:"greyDark"},{type:"pillar",at:[5,14,9],size:[0.8,9,0.8],color:"greyDark"}]},
};
