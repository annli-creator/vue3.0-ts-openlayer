// coordinates; will return the length of the [a, b] segment
function length(a: any, b: any) {
  return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
}

// coordinates; will return true if c is on the [a, b] segment
function isOnSegment(c: any, a: any, b: any) {
  const lengthAc = length(a, c);
  const lengthAb = length(a, b);
  const dot = ((c[0] - a[0]) * (b[0] - a[0]) + (c[1] - a[1]) * (b[1] - a[1])) / lengthAb;
  return Math.abs(lengthAc - dot) < 1e-6 && lengthAc < lengthAb;
}

// modulo for negative values, eg: mod(-1, 4) returns 3
function mod(a: any, b: any) {
  return ((a % b) + b) % b;
}

export {
  length,
  isOnSegment,
  mod
}