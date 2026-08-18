/**
 * Euclidean Rhythm Generator: Implements Bjorklund's Algorithm
 * Distributes k pulses as evenly as possible over n discrete steps.
 */
export class EuclideanGenerator {
  /**
   * Generates a boolean array of length n with k active pulses
   * @param {number} k - Number of pulses / hits
   * @param {number} n - Total number of steps
   * @param {number} rotation - Shift pattern by offset
   * @returns {boolean[]} Array of step states
   */
  static generate(k, n, rotation = 0) {
    if (k <= 0) return new Array(n).fill(false);
    if (k >= n) return new Array(n).fill(true);

    let divisor = n - k;
    let remainders = [k];
    let counts = [];

    while (true) {
      counts.push(Math.floor(divisor / remainders[remainders.length - 1]));
      let newRemainder = divisor % remainders[remainders.length - 1];
      remainders.push(newRemainder);
      divisor = remainders[remainders.length - 2];
      if (newRemainder <= 1) {
        break;
      }
    }
    counts.push(divisor);

    let pattern = [];
    const build = (level) => {
      if (level === -1) {
        pattern.push(false);
      } else if (level === -2) {
        pattern.push(true);
      } else {
        for (let i = 0; i < counts[level]; i++) {
          build(level - 1);
        }
        if (remainders[level] !== 0) {
          build(level - 2);
        }
      }
    };
    build(counts.length - 1);

    pattern = pattern.reverse();
    const firstTrue = pattern.indexOf(true);
    if (firstTrue > 0) {
      pattern = pattern.slice(firstTrue).concat(pattern.slice(0, firstTrue));
    }

    // Apply rotation
    if (rotation !== 0) {
      const rot = ((rotation % n) + n) % n;
      pattern = pattern.slice(n - rot).concat(pattern.slice(0, n - rot));
    }

    return pattern;
  }
}

/**
 * Formula Tracker: Generates musical sequences using mathematical algorithms
 */
export class FormulaTracker {
  /**
   * Generates pitch sequence using mathematical functions
   * @param {string} formulaType - 'fibonacci', 'golden_ratio', 'chaos', 'harmonic'
   * @param {number} length - Number of steps
   * @param {number} rootNote - Base MIDI note (e.g. 48 for C3)
   * @param {number[]} scaleIntervals - Scale pitch classes (e.g. [0, 2, 4, 7, 9])
   */
  static generateSequence(formulaType, length = 16, rootNote = 48, scaleIntervals = [0, 2, 4, 7, 9]) {
    const notes = [];
    const scaleLen = scaleIntervals.length;

    for (let i = 0; i < length; i++) {
      let degree = 0;

      switch (formulaType) {
        case 'fibonacci': {
          // Fibonacci numbers modulo scale length
          let a = 1, b = 1;
          for (let step = 0; step < i; step++) {
            let temp = (a + b);
            a = b;
            b = temp;
          }
          degree = a % (scaleLen * 2);
          break;
        }
        case 'golden_ratio': {
          // Fractional part of (i * phi) mapped to scale degrees
          const phi = 1.6180339887;
          const frac = (i * phi) % 1.0;
          degree = Math.floor(frac * scaleLen * 2);
          break;
        }
        case 'chaos': {
          // Logistic map: x_{n+1} = r * x_n * (1 - x_n)
          let x = 0.5;
          for (let step = 0; step <= i; step++) {
            x = 3.9 * x * (1.0 - x);
          }
          degree = Math.floor(x * scaleLen * 2);
          break;
        }
        case 'harmonic':
        default: {
          // Natural overtone series indices
          degree = (i * 2 + (i % 3)) % (scaleLen * 2);
          break;
        }
      }

      const octave = Math.floor(degree / scaleLen);
      const noteInScale = scaleIntervals[degree % scaleLen];
      const midiNote = rootNote + octave * 12 + noteInScale;

      notes.push({
        step: i,
        note: midiNote,
        velocity: 0.7 + (i % 4 === 0 ? 0.25 : 0.0),
        active: true
      });
    }

    return notes;
  }
}
