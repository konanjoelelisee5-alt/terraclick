/**
 * Réduit une photo choisie sur l'appareil à un carré de 256 px (recadrée au centre), en JPEG :
 * une vingtaine de kilo-octets, prête à être enregistrée en base et affichée partout.
 */
export async function reduirePhoto(fichier: File, cote = 256): Promise<string> {
  const url = URL.createObjectURL(fichier);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = Math.min(img.naturalWidth, img.naturalHeight);
    const toile = document.createElement("canvas");
    toile.width = toile.height = cote;
    const ctx = toile.getContext("2d");
    if (!ctx) throw new Error("Image illisible");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (img.naturalWidth - c) / 2, (img.naturalHeight - c) / 2, c, c, 0, 0, cote, cote);
    return toile.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
