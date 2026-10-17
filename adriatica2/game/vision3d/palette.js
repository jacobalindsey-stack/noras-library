// ADRIATICA — vision level palettes.
// Hard-coded constants. Nothing here is generated, interpolated or derived.
// Level 1 is gold and deep umber ONLY. Level 2 is grey-brown, bone, cool
// stone shadow, and one warm white for light.

export const PALETTES = {
  gap: {
    name: 'The Gap (gold / umber)',
    goldLight: 0xf2cf76,
    goldMid:   0xd9a63f,
    goldDeep:  0xa8752a,
    umberMid:  0x6b4420,
    umberDeep: 0x3d2612,
    // Mira reads against gold stone, so she is the one near-white in the level.
    mira:      0xfdf3dc,
    void:      0x1b1008,
  },
  light: {
    name: 'The Light Moves (bone / stone)',
    warmWhite:  0xfff6e2,
    bone:       0xe8e0d0,
    greyBrown:  0x9a8d7c,
    greyDark:   0x6d6355,
    stoneShade: 0x4a4f57,
    mira:       0xfff9ec,
    void:       0x23262b,
  },
};

// Default colour per piece type, per palette. Layouts may override with
// a `color` key naming any slot above.
export const TYPE_COLORS = {
  gap: {
    platform: 'goldMid',
    stair:    'goldDeep',
    span:     'goldDeep',
    pillar:   'umberMid',
    arch:     'goldLight',
  },
  light: {
    platform: 'greyBrown',
    stair:    'greyDark',
    span:     'greyDark',
    pillar:   'stoneShade',
    arch:     'bone',
  },
};
