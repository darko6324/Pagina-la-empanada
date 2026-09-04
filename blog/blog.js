const articulos = [
    {
        titulo: "La Berraca: empanada de papa y carne con sabor guerrero",
        fecha: "2026-09-04",
        imagen: "/assets/1.-La-berraca-Empanada-Papa-Carne-La-empanada-guerrera.webp",
        url: "/blog/empanada-la-berraca.html",
        categoria: "Productos",
        descripcion: "Conoce La Berraca, nuestra empanada papa carne con 30% carne y 70% papa, ideal para hogar, eventos y negocios."
    },

    {
        titulo: "El ají de frutas tropicales que nos hace diferentes",
        fecha: "2026-08-20",
        imagen: "/assets/aji-frutas-tropicales-empanadas.webp",
        url: "/blog/aji-de-frutas-tropicales.html",
        categoria: "Nuestra historia",
        descripcion: "La historia de nuestro ají artesanal de frutas tropicales y cómo acompaña nuestras empanadas."
    }
];


function cargarBlog(contenedor, limite = null){

    let lista = [...articulos];

    lista.sort((a,b)=> 
        new Date(b.fecha) - new Date(a.fecha)
    );


    if(limite){
        lista = lista.slice(0,limite);
    }


    const blog = document.querySelector(contenedor);


    if(!blog) return;


    blog.innerHTML = "";


    lista.forEach(post=>{


        blog.innerHTML += `

        <article class="blog-card">

            <img src="${post.imagen}" 
            alt="${post.titulo}">

            <div class="blog-card-content">

                <span>${post.categoria}</span>

                <h3>
                    ${post.titulo}
                </h3>

                <p>
                    ${post.descripcion}
                </p>


                <a href="${post.url}">
                    Leer artículo →
                </a>

            </div>

        </article>

        `;

    });

}
