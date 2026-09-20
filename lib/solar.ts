export function noonSunAngle(dayOfYear: number, latitudeDeg: number): number {
  const declinationDeg =
    23.44 * Math.sin((Math.PI * 2 / 365) * (dayOfYear - 81));

  return 90 - Math.abs(latitudeDeg - declinationDeg);
}

export function buildSunAngleProfile(latitudeDeg: number): number[] {
  return Array.from({ length: 365 }, (_, index) =>
    noonSunAngle(index + 1, latitudeDeg),
  );
}
