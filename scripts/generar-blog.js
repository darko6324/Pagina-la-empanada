const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "../blog");
const OUTPUT = path.join(BLOG_DIR, "articulos.json");

function extraer(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

const archivos = fs.readdirSync(BLOG_DIR)
.filter(file => file.endsWith(".html") && file !== "index.html");

const articulos = archivos.map(file => {
  const html = fs.readFileSync(path.join(BLOG_DIR,file),"utf8");

  const titulo =
    extraer(html, /<h1[^>]*>(.*?)<\/h1>/is)
    .replace(/<[^>]+>/g,"")
    .trim()
    ||
    extraer(html, /<title>(.*?)<\/title>/is);

  const descripcion =
    extraer(html, /<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);

  const imagen =
    extraer(html, /<img[^>]+class=["']cover["'][^>]+src=["'](.*?)["']/is)
    ||
    extraer(html, /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/is);

  const fecha =
    extraer(html, /datePublished["']?\s*:\s*["'](.*?)["']/is)
    ||
    extraer(html, /<time[^>]*datetime=["'](.*?)["']/is)
    ||
    fs.statSync(path.join(BLOG_DIR,file)).mtime.toISOString().split("T")[0];

  return {
    titulo,
    descripcion,
    imagen,
    fecha,
    url:file,
    categoria:"Blog"
  };
});

articulos.sort((a,b)=>new Date(b.fecha)-new Date(a.fecha));

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(articulos,null,2),
  "utf8"
);

console.log(`Blog generado: ${articulos.length} artículos`);
