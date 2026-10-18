// Each pilot declares its own atlas coordinates or standalone image.
// A fifth pilot never changes the coordinates of the existing four.
export function portraitStyle(pilot, damaged = false) {
  const image = (damaged ? pilot.defeatPortrait : null) || pilot.portrait;
  if (!image) return "";
  const columns = image.columns || 1,
    column = image.column || 0;
  return `background-image:url('./assets/${image.asset}');background-size:${columns * 100}% auto;background-position-x:${columns > 1 ? (column / (columns - 1)) * 100 : 50}%;`;
}
