import { light, dark, gradients, shadows, withAlpha } from '../../theme/colors';

// =============================================================================
// withAlpha utility
// =============================================================================

describe('withAlpha', () => {
  it('converts a 6-digit hex to rgba correctly', () => {
    expect(withAlpha('#FF0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(withAlpha('#00FF00', 0.75)).toBe('rgba(0, 255, 0, 0.75)');
    expect(withAlpha('#0000FF', 0.25)).toBe('rgba(0, 0, 255, 0.25)');
  });

  it('converts a 3-digit shorthand hex to rgba correctly', () => {
    expect(withAlpha('#F00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(withAlpha('#0F0', 0.75)).toBe('rgba(0, 255, 0, 0.75)');
    expect(withAlpha('#00F', 0.25)).toBe('rgba(0, 0, 255, 0.25)');
  });

  it('handles alpha of 0 (fully transparent)', () => {
    expect(withAlpha('#2B2018', 0)).toBe('rgba(43, 32, 24, 0)');
  });

  it('handles alpha of 1 (fully opaque)', () => {
    expect(withAlpha('#2B2018', 1)).toBe('rgba(43, 32, 24, 1)');
  });

  it('converts the actual theme colors correctly', () => {
    // Verify with the canvas color from light theme
    expect(withAlpha('#F2E7DB', 0.5)).toBe('rgba(242, 231, 219, 0.5)');
    // Verify with the accent primary from light theme
    expect(withAlpha('#1F4D3A', 0.8)).toBe('rgba(31, 77, 58, 0.8)');
  });
});

// =============================================================================
// Light mode tokens
// =============================================================================

describe('light color tokens', () => {
  const requiredKeys = [
    'canvas',
    'canvasElevated',
    'canvasDeep',
    'ink',
    'inkMuted',
    'inkFaint',
    'inkInverse',
    'accentPrimary',
    'accentPrimaryHover',
    'accentWarm',
    'accentCalm',
    'accentDanger',
    'border',
    'borderMuted',
    'borderStrong',
    'surfaceSubtle',
    'surfaceHover',
    'shadow',
    'shadowStrong',
    'overlay',
    'success',
    'statusSuccess',
    'statusError',
    'error',
  ];

  it('has all required semantic color keys', () => {
    for (const key of requiredKeys) {
      expect(light).toHaveProperty(key);
    }
  });

  it('has all mood color keys', () => {
    const moodKeys = [
      'moodEnergized',
      'moodCalm',
      'moodGood',
      'moodAnxious',
      'moodLow',
      'moodTough',
    ];
    for (const key of moodKeys) {
      expect(light).toHaveProperty(key);
    }
  });

  it('has all legacy alias keys', () => {
    const aliasKeys = [
      'text',
      'textPrimary',
      'textSecondary',
      'textTertiary',
      'textInverse',
      'primary',
      'actionPrimary',
      'actionSecondary',
      'actionDestructive',
      'background',
      'surface',
      'surfaceElevated',
      'card',
    ];
    for (const key of aliasKeys) {
      expect(light).toHaveProperty(key);
    }
  });

  it('all token values are non-empty strings', () => {
    for (const [key, value] of Object.entries(light)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Dark mode tokens
// =============================================================================

describe('dark color tokens', () => {
  const requiredKeys = [
    'canvas',
    'canvasElevated',
    'canvasDeep',
    'ink',
    'inkMuted',
    'inkFaint',
    'inkInverse',
    'accentPrimary',
    'accentPrimaryHover',
    'accentWarm',
    'accentCalm',
    'accentDanger',
    'border',
    'borderMuted',
    'borderStrong',
    'surfaceSubtle',
    'surfaceHover',
    'shadow',
    'shadowStrong',
    'overlay',
    'success',
    'statusSuccess',
    'statusError',
    'error',
  ];

  it('has all required semantic color keys', () => {
    for (const key of requiredKeys) {
      expect(dark).toHaveProperty(key);
    }
  });

  it('has all mood color keys', () => {
    const moodKeys = [
      'moodEnergized',
      'moodCalm',
      'moodGood',
      'moodAnxious',
      'moodLow',
      'moodTough',
    ];
    for (const key of moodKeys) {
      expect(dark).toHaveProperty(key);
    }
  });

  it('has all legacy alias keys', () => {
    const aliasKeys = [
      'text',
      'textPrimary',
      'textSecondary',
      'textTertiary',
      'textInverse',
      'primary',
      'actionPrimary',
      'actionSecondary',
      'actionDestructive',
      'background',
      'surface',
      'surfaceElevated',
      'card',
    ];
    for (const key of aliasKeys) {
      expect(dark).toHaveProperty(key);
    }
  });

  it('all token values are non-empty strings', () => {
    for (const [key, value] of Object.entries(dark)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// Light vs Dark comparison
// =============================================================================

describe('light vs dark tokens', () => {
  it('canvas values differ between light and dark', () => {
    expect(light.canvas).not.toBe(dark.canvas);
  });

  it('ink values differ between light and dark', () => {
    expect(light.ink).not.toBe(dark.ink);
  });

  it('accentPrimary values differ between light and dark', () => {
    expect(light.accentPrimary).not.toBe(dark.accentPrimary);
  });

  it('both token sets have matching keys (same shape)', () => {
    const lightKeys = Object.keys(light).sort();
    const darkKeys = Object.keys(dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });
});

// =============================================================================
// Alias consistency
// =============================================================================

describe('alias consistency', () => {
  it('light textPrimary equals light ink', () => {
    expect(light.textPrimary).toBe(light.ink);
  });

  it('light text equals light ink', () => {
    expect(light.text).toBe(light.ink);
  });

  it('light actionPrimary equals light accentPrimary', () => {
    expect(light.actionPrimary).toBe(light.accentPrimary);
  });

  it('light primary equals light accentPrimary', () => {
    expect(light.primary).toBe(light.accentPrimary);
  });

  it('light background equals light canvas', () => {
    expect(light.background).toBe(light.canvas);
  });

  it('light surface equals light canvasElevated', () => {
    expect(light.surface).toBe(light.canvasElevated);
  });

  it('light card equals light canvasElevated', () => {
    expect(light.card).toBe(light.canvasElevated);
  });

  it('light textSecondary equals light inkMuted', () => {
    expect(light.textSecondary).toBe(light.inkMuted);
  });

  it('light textTertiary equals light inkFaint', () => {
    expect(light.textTertiary).toBe(light.inkFaint);
  });

  it('light actionDestructive equals light accentDanger', () => {
    expect(light.actionDestructive).toBe(light.accentDanger);
  });

  it('dark textPrimary equals dark ink', () => {
    expect(dark.textPrimary).toBe(dark.ink);
  });

  it('dark actionPrimary equals dark accentPrimary', () => {
    expect(dark.actionPrimary).toBe(dark.accentPrimary);
  });

  it('dark background equals dark canvas', () => {
    expect(dark.background).toBe(dark.canvas);
  });

  it('dark surface equals dark canvasElevated', () => {
    expect(dark.surface).toBe(dark.canvasElevated);
  });
});

// =============================================================================
// Gradients
// =============================================================================

describe('gradients', () => {
  it('has light and dark gradient objects', () => {
    expect(gradients).toHaveProperty('light');
    expect(gradients).toHaveProperty('dark');
  });

  it('light gradients have morning, evening, and calm arrays', () => {
    expect(gradients.light).toHaveProperty('morning');
    expect(gradients.light).toHaveProperty('evening');
    expect(gradients.light).toHaveProperty('calm');
  });

  it('dark gradients have morning, evening, and calm arrays', () => {
    expect(gradients.dark).toHaveProperty('morning');
    expect(gradients.dark).toHaveProperty('evening');
    expect(gradients.dark).toHaveProperty('calm');
  });

  it('each gradient is an array of exactly 2 color strings', () => {
    const allGradients = [
      ...Object.values(gradients.light),
      ...Object.values(gradients.dark),
    ];
    for (const gradient of allGradients) {
      expect(gradient).toHaveLength(2);
      expect(typeof gradient[0]).toBe('string');
      expect(typeof gradient[1]).toBe('string');
    }
  });

  it('light and dark gradient sets have the same keys', () => {
    const lightKeys = Object.keys(gradients.light).sort();
    const darkKeys = Object.keys(gradients.dark).sort();
    expect(lightKeys).toEqual(darkKeys);
  });
});

// =============================================================================
// Shadows
// =============================================================================

describe('shadows', () => {
  it('has light and dark shadow objects', () => {
    expect(shadows).toHaveProperty('light');
    expect(shadows).toHaveProperty('dark');
  });

  it('light shadows have sm, md, and lg sizes', () => {
    expect(shadows.light).toHaveProperty('sm');
    expect(shadows.light).toHaveProperty('md');
    expect(shadows.light).toHaveProperty('lg');
  });

  it('dark shadows have sm, md, and lg sizes', () => {
    expect(shadows.dark).toHaveProperty('sm');
    expect(shadows.dark).toHaveProperty('md');
    expect(shadows.dark).toHaveProperty('lg');
  });

  it('each shadow definition has the required React Native shadow properties', () => {
    const allShadows = [
      ...Object.values(shadows.light),
      ...Object.values(shadows.dark),
    ];
    for (const shadow of allShadows) {
      expect(shadow).toHaveProperty('shadowColor');
      expect(shadow).toHaveProperty('shadowOffset');
      expect(shadow).toHaveProperty('shadowOpacity');
      expect(shadow).toHaveProperty('shadowRadius');
      expect(shadow).toHaveProperty('elevation');
      expect(typeof shadow.shadowColor).toBe('string');
      expect(typeof shadow.shadowOffset.width).toBe('number');
      expect(typeof shadow.shadowOffset.height).toBe('number');
      expect(typeof shadow.shadowOpacity).toBe('number');
      expect(typeof shadow.shadowRadius).toBe('number');
      expect(typeof shadow.elevation).toBe('number');
    }
  });

  it('shadow sizes increase from sm to lg (by shadowRadius)', () => {
    expect(shadows.light.sm.shadowRadius).toBeLessThan(shadows.light.md.shadowRadius);
    expect(shadows.light.md.shadowRadius).toBeLessThan(shadows.light.lg.shadowRadius);
    expect(shadows.dark.sm.shadowRadius).toBeLessThan(shadows.dark.md.shadowRadius);
    expect(shadows.dark.md.shadowRadius).toBeLessThan(shadows.dark.lg.shadowRadius);
  });
});
