export function generateColor() {
  const palette = [
    "#FF4D4D", // rood neon
    "#4DA6FF", // blauw neon
    "#4DFF88", // groen neon
    "#FFD93D", // geel neon
    "#B84DFF", // paars neon
    "#FF7F50", // coral neon
    "#00CED1", // turquoise neon
    "#FF69B4", // pink neon
  ];

  return palette[Math.floor(Math.random() * palette.length)];
}
