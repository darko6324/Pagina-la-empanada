// Trae calificación y reseñas de Google (Places API New) y las guarda en data/resenas-google.json.
// Corre en GitHub Actions cada 2 horas (≈372 consultas al mes, dentro de las 1.000 gratis).
const fs = require('fs');
// La llave es la misma del mapa (ya es pública en index.html y solo funciona con el referer del sitio).
const KEY = process.env.PLACES_API_KEY || ((fs.readFileSync('index.html','utf8').match(/maps\/api\/js\?key=([A-Za-z0-9_-]+)/)||[])[1]);
const PLACE = 'ChIJX3HISUWbP44Rs3B8RLv5GlI';
(async () => {
  if (!KEY) { console.log('Sin PLACES_API_KEY'); process.exit(0); }
  const r = await fetch(`https://places.googleapis.com/v1/places/${PLACE}?languageCode=es`, {
    headers: { 'X-Goog-Api-Key': KEY, 'X-Goog-FieldMask': 'rating,userRatingCount,reviews', 'Referer': 'https://laempanadaguerrera.com/' }
  });
  const j = await r.json();
  if (!r.ok || !j.rating) { console.log('Error', r.status, JSON.stringify(j).slice(0, 300)); process.exit(0); }
  const reviews = (j.reviews || []).map(x => ({
    rating: x.rating,
    text: (x.originalText && x.originalText.text) || (x.text && x.text.text) || '',
    cuando: x.relativePublishTimeDescription || '',
    fecha: x.publishTime || '',
    autor: (x.authorAttribution && x.authorAttribution.displayName) || '',
    uri: (x.authorAttribution && x.authorAttribution.uri) || ''
  }));
  const datos = { rating: j.rating, total: j.userRatingCount, reviews };
  const f = 'data/resenas-google.json';
  const antes = fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
  // Solo se escribe si cambió algo distinto al texto relativo de fecha, para no llenar el historial.
  const firma = d => d && JSON.stringify({ r: d.rating, t: d.total, v: (d.reviews || []).map(x => [x.autor, x.rating, x.text]) });
  if (firma(antes) === firma(datos)) { console.log('Sin cambios'); return; }
  fs.writeFileSync(f, JSON.stringify({ actualizado: new Date().toISOString(), ...datos }, null, 1));
  console.log('Actualizado', datos.rating, datos.total, reviews.length);
})();
