const fs = require("fs");
const path = require("path");

const BLOG_DIR = path.join(__dirname, "../blog");
const OUTPUT = path.join(BLOG_DIR, "articulos.json");

function extraer(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : "";
}

const archivos = fs.readdirSync(BLOG_DIR)
.filter(file =>
  file.endsWith(".html") &&
  file !== "index.html"
);

const articulos = archivos.map(file => {

  const ruta = path.join(BLOG_DIR,file);
  const html = fs.readFileSync(ruta,"utf8");

  const titulo =
    extraer(html,/<title>(.*?)<\/title>/is)
    || file.replace(".html","");

  const descripcion =
    extraer(
      html,
      /<meta\s+name=["']description["']\s+content=["'](.*?)["']/is
    );

  const imagen =
    extraer(
      html,
      /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/is
    )
    ||
    extraer(
      html,
      /<img[^>]+src=["'](.*?)["']/is
    );

  const fecha =
    extraer(
      html,
      /datePublished["']?\s*:\s*["'](.*?)["']/is
    )
    ||
    extraer(
      html,
      /<time[^>]*datetime=["'](.*?)["']/is
    )
    ||
    fs.statSync(ruta).mtime.toISOString().split("T")[0];


  return {
    titulo,
    descripcion,
    imagen,
    fecha,
    url:file,
    categoria:"Blog"
  };

});


articulos.sort(
(a,b)=>new Date(b.fecha)-new Date(a.fecha)
);


fs.writeFileSync(
OUTPUT,
JSON.stringify(articulos,null,2),
"utf8"
);


console.log(
`Blog generado: ${articulos.length} artículos`
);
