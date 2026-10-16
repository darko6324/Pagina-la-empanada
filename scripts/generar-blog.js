// Genera el listado del blog y el sitemap a partir de los artículos en /blog.
// Lo corre GitHub Actions cada vez que se sube o cambia un artículo (ver .github/workflows/generar-blog.yml).
//
// Qué hace:
//   1. Lee cada blog/*.html (menos index.html) y saca título, descripción, imagen y fecha.
//   2. Escribe blog/articulos.json.
//   3. Pinta las tarjetas de artículos dentro de index.html (los 3 más recientes) y de blog/index.html (todos),
//      entre los comentarios <!-- BLOG:INICIO --> y <!-- BLOG:FIN -->. Así Google ve los enlaces sin JavaScript.
//   4. Regenera sitemap.xml con las páginas fijas y todos los artículos.
//
// Para que un artículo nuevo salga bien, en su <head> debe tener:
//   <meta name="description" content="...">
//   <meta property="og:image" content="https://laempanadaguerrera.com/assets/...">
//   y en su JSON-LD "datePublished": "AAAA-MM-DD"

const fs = require("fs");
const path = require("path");

const SITIO = "https://laempanadaguerrera.com";
const RAIZ = path.join(__dirname, "..");
const BLOG_DIR = path.join(RAIZ, "blog");

const PAGINAS_FIJAS = ["/", "/productos/", "/hogar/", "/negocios/", "/eventos/", "/franquicias/", "/empanadas-a-domicilio-bogota/", "/empanadas-engativa/", "/empanadas-congeladas-bogota/", "/empanadas-para-tiendas-y-cafeterias/", "/empanadas-para-restaurantes-y-casinos/", "/cocteleras-para-eventos/", "/refrigerios-empresariales/", "/empanadas-para-novenas/", "/dedos-rellenos-congelados/", "/blog/", "/privacidad/"];

function extraer(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : "";
}

function esc(t) {
  return String(t || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function sinDominio(url) {
  return url.replace(SITIO, "");
}

function fechaBonita(iso) {
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${meses[m - 1]} de ${a}`;
}

const archivos = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith(".html") && f !== "index.html");

const articulos = archivos.map(file => {
  const html = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
  const titulo =
    extraer(html, /<h1[^>]*>(.*?)<\/h1>/is).replace(/<[^>]+>/g, "").trim() ||
    extraer(html, /<title>(.*?)<\/title>/is);
  const descripcion = extraer(html, /<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);
  const imagen = sinDominio(
    extraer(html, /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/is) ||
    extraer(html, /<img[^>]+class=["']cover["'][^>]+src=["'](.*?)["']/is) ||
    extraer(html, /<img[^>]+src=["'](.*?)["'][^>]+class=["']cover["']/is)
  );
  const fecha =
    extraer(html, /"datePublished"\s*:\s*"(.*?)"/is) ||
    extraer(html, /<time[^>]*datetime=["'](.*?)["']/is) ||
    fs.statSync(path.join(BLOG_DIR, file)).mtime.toISOString().split("T")[0];
  const modificado = extraer(html, /"dateModified"\s*:\s*"(.*?)"/is) || fecha;
  return { titulo, descripcion, imagen, fecha, modificado, url: file, categoria: "Blog" };
});

articulos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

// 1. JSON
fs.writeFileSync(path.join(BLOG_DIR, "articulos.json"), JSON.stringify(articulos, null, 2) + "\n", "utf8");

// 2. Tarjetas estáticas
function reemplazarBloque(archivo, html) {
  const ruta = path.join(RAIZ, archivo);
  const actual = fs.readFileSync(ruta, "utf8");
  const re = /(<!-- BLOG:INICIO -->)[\s\S]*?(<!-- BLOG:FIN -->)/;
  if (!re.test(actual)) {
    console.warn(`No encontré los marcadores BLOG:INICIO / BLOG:FIN en ${archivo}`);
    return;
  }
  fs.writeFileSync(ruta, actual.replace(re, `$1\n${html}\n$2`), "utf8");
}

const tarjetasInicio = articulos.slice(0, 3).map(p => `<a class="card" href="/blog/${esc(p.url)}">
  <div class="card-img"><img width="800" height="600" loading="lazy" decoding="async" src="${esc(p.imagen)}" alt="${esc(p.titulo)}"></div>
  <div class="card-body">
    <h3 class="cname">${esc(p.titulo)}</h3>
    <div class="cfill">${fechaBonita(p.fecha)}</div>
    <p>${esc(p.descripcion)}</p>
  </div>
</a>`).join("\n");
reemplazarBloque("index.html", tarjetasInicio);

const tarjetasBlog = articulos.map(p => `<a class="blog-card-auto" href="/blog/${esc(p.url)}">
  <img src="${esc(p.imagen)}" alt="${esc(p.titulo)}" width="800" height="600" loading="lazy" decoding="async">
  <div class="body">
    <time datetime="${esc(p.fecha)}">${fechaBonita(p.fecha)}</time>
    <h2>${esc(p.titulo)}</h2>
    <p>${esc(p.descripcion)}</p>
    <span class="leer">Leer artículo →</span>
  </div>
</a>`).join("\n");
reemplazarBloque("blog/index.html", `<div class="blog-grid-auto">\n${tarjetasBlog}\n</div>`);

// 3. Sitemap
const urls = [
  ...PAGINAS_FIJAS.map(u => `  <url><loc>${SITIO}${u}</loc></url>`),
  ...articulos.map(p => `  <url><loc>${SITIO}/blog/${p.url}</loc><lastmod>${p.modificado}</lastmod></url>`),
];
fs.writeFileSync(
  path.join(RAIZ, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
  "utf8"
);

console.log(`Blog generado: ${articulos.length} artículos. Sitemap con ${urls.length} URLs.`);
