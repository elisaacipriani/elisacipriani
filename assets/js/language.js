(function () {
  const storageKey = "elisa-cipriani-language";
  const copy = {
    es: {
      "nav.works": "TRABAJOS",
      "nav.art": "ARTE Y FOTOGRAFÍA",
      "nav.archive": "TRABAJOS",
      "nav.bio": "ARTE Y FOTOGRAFÍA",
      "nav.contact": "CONTACTO",
      "home.eyebrow": "Hola! esta es Elisa Cipriani",
      "home.title": "Diseñadora multidisciplinaria de Buenos<br>Aires, Argentina.",
      "home.copy1": "Explora arte, moda y cultura<br>a través de prácticas hechas a mano.",
      "home.copy2": "Valora el proceso creativo donde las ideas<br>y los materiales necesitan convertirse en proyectos.",
      "statement.title": "To design is to<br>to give life<br>new universes.",
      "statement.caption": "Las herramientas más valiosas que tenemos dentro son la imaginación y la creatividad. Con ellas podemos dar forma a las cosas para que el mundo las conozca.",
      "works.title": "Trabajos",
      "works.note": "Obras, series y registros.",
      "works.category": "trabajo",
      "works.cat.savia": "Materia / Diseño",
      "works.cat.migrar": "Territorio / Investigación",
      "works.cat.encanto": "Objeto / Instalación",
      "works.cat.hilvan": "Textil / Proceso",
      "works.cat.diary": "Diseño editorial / Tatuaje",
      "works.meta.savia": "Tesis integral de diseño<br>Dic ‘25",
      "works.meta.migrar": "Instalación audiovisual<br>Dic ‘25",
      "works.meta.encanto": "Colección de moda<br>Dic ‘25",
      "works.meta.hilvan": "Curaduría artesanal<br>Julio ‘25",
      "works.meta.diary": "Fotografía analógica<br>Julio ‘23",
      "arts.title": "Arte y fotografía",
      "arts.note": "Series, imágenes y archivos visuales.",
      "arts.category": "arte y fotografía",
      "arts.cat.surreal": "Serie / Infancia",
      "arts.cat.chalten": "Territorio / Fotografía",
      "arts.cat.isla": "Fotografía / Viaje",
      "arts.cat.azul": "Pintura / Imagen",
      "arts.cat.dreaming": "Sueño / Fotografía",
      "arts.project.formas": "Formas que Acompañan el Cuerpo",
      "arts.project.superficies": "Superficies y Transformaciones",
      "arts.project.intersecciones": "Intersecciones",
      "arts.project.surreal": "Paisaje surrealista de la infancia",
      "arts.project.chalten": "El Chaltén",
      "arts.project.isla": "Isla Paraíso",
      "arts.project.azul": "Azul",
      "arts.project.dreaming": "Las formas infinitas del sueño",
      "arts.cat.formas": "Cortezas y Texturas / Joyería",
      "arts.cat.superficies": "Likenes / Fotografías",
      "arts.cat.intersecciones": "Micro / Cuadros",
      "who.title": "Who is Elisa Cipriani",
      "who.copy1": "Intenta no definirse de una sola manera. Le gusta pensar que somos muchas cosas. Nos transformamos, nos reconfiguramos y crecemos de forma irregular. En este momento es una diseñadora con un enorme deseo de crear cosas únicas, desafiantes y potentes.",
      "who.copy2": "Disfruta sacar fotos, ilustrar y diseñar. Le interesa la fusión entre arte y diseño. Cree que las cosas que hace tienen que tener identidad. Los proyectos necesitan cobrar vida, tener alma. Por eso pone todo de sí en cada trabajo que crea.",
      "trust.copy1": "Piensa que para hacer dentro del mundo creativo tiene que existir confianza: necesitamos involucrar nuestros cuerpos, nuestras mentes y nuestras manos.",
      "trust.copy2": "Le apasionan los oficios y las prácticas manuales. Hay algo muy interesante en el punto donde lo hecho a mano se encuentra con lo digital para seguir creando de otras maneras.",
      "trust.copy3": "Hoy cree que es importante hacer espacio para la sensibilidad: aquello que deja una huella en nuestros caminos. La cultura y el diseño son formas de expresión, conexión e intercambio.",
      "journey.title": "Recorrido",
      "journey.copy1": "Su recorrido artístico comenzó desde chica. Durante el colegio actuó en Antígona, The Dispute, Heart Piece y distintos monólogos, incluyendo uno inspirado en The Imagination of Disaster, por el cual recibió las mejores calificaciones en el IGCSE 2019.<br><br>Estudió danza contemporánea, lo que la llevó a un viaje a Nueva York en 2020. En 2021 completó el Bachillerato Internacional en Artes, una experiencia que marcó profundamente su mirada creativa.",
      "journey.copy2": "En 2025 se graduó como Licenciada en Diseño en la Universidad Torcuato Di Tella. Su trabajo pone un fuerte énfasis en el proceso creativo.<br><br>A través de sus diseños expresa libertad y creatividad, dando especial valor a la dimensión conceptual de los proyectos. Le interesa conectar el diseño con las artes visuales y plásticas, el cine, la fotografía y la música.",
      "experience.title": "Experiencia",
      "experience.item0": "Identidad visual y diseño editorial para Roomie Design. Desarrollo de piezas gráficas, comunicación visual y contenido de estudio.",
      "experience.item1": "Comunicación visual, diseño gráfico y contenido para redes sociales para la antología de poesía 2025 de Rosalía Iturbe, Las Cosas Celestes.",
      "experience.item2": "Ilustración y diseño editorial para la antología de poesía 2024 de Rosalía Iturbe, Peces Plateados.",
      "experience.item3": "Diseño gráfico freelance y gestión de redes sociales para el libro Prufrock: La canción que no termina.",
      "experience.item4": "Hi Its Mora - Fundadora y Directora Creativa. Proyecto independiente de joyería: anillos hechos a mano, dirección de arte, fotografía de producto, contenido para redes y desarrollo de marca.",
      "education.title": "Educación",
      "education.item1": "Licenciatura en Diseño - Universidad Torcuato Di Tella",
      "education.item2": "Programa de intercambio - Universität zu Köln Business School, Alemania",
      "education.item3": "Programa de intercambio - Durban Girls College, Sudáfrica",
      "education.item4": "St. George's College, Quilmes. Cambridge IGCSE & Bachillerato Internacional",
      "languages.title": "Idiomas",
      "languages.item1": "Español (nativo)",
      "languages.item2": "Inglés (C2 - IGCSE & IB)",
      "languages.item3": "Alemán (A1)",
      "courses.title": "Cursos",
      "courses.item1": "Teatro - Timbre 4",
      "courses.item2": "Curso de Arte y Filosofía",
      "courses.item3": "Curso de Bordado Japonés",
      "courses.item4": "Inktinerante Tattoo Academy",
      "courses.item5": "Teatro - Teatro Estudio el Cuervo",
      "courses.item6": "Curso de Figura Humana",
      "skills.title": "Habilidades",
      "skills.item1": "Prácticas culturales y artesanales",
      "skills.item2": "Exploración material e impresión",
      "skills.item3": "Investigación narrativa y de archivo",
      "skills.item4": "Instalación y diseño espacial",
      "skills.item5": "Diseño conceptual y experimental",
      "skills.item6": "Diseño de moda y textil",
      "skills.item7": "Diseño editorial",
      "skills.item8": "Diseño gráfico",
      "skills.item9": "Diseño sonoro",
      "skills.item10": "Fotografía",
      "software.title": "Softwares",
      "contact.title": "TRABAJEMOS JUNTOS",
      "contact.copy": "Ya sea que quieras colaborar o simplemente hablar sobre arte y cultura, no dudes en escribirme.",
      "project.chalten.title": "Serie Fotográfica / <br>El Chaltén",
      "project.chalten.intro": "Esta serie de fotografías fue tomada durante un viaje a El Chaltén, en Santa Cruz, Patagonia Argentina. La diseñadora viajó allí para sumergirse en la naturaleza, alojándose en una reserva natural dedicada a la conservación y la investigación ambiental.",
      "project.chalten.text": "Aquí, en lo que llamamos El fin del mundo, la naturaleza revela su verdadera escala. Entre lagos, glaciares, bosques, vientos y aromas, emerge una profunda sensación de paz, como si el mundo volviera por un instante a su forma esencial. Estas fotografías buscan sostener ese momento: la sensación de encontrarse con la naturaleza y reconocerse como una pequeña parte de algo inmenso.",
      "project.surreal.title": "Paisaje surrealista de la infancia",
      "project.surreal.text1": "Un regreso al tipo de arte que hacía cuando era niña: trazos sueltos, colores intensos y un mundo donde todo parece posible. Verdes, naranjas, rosas y azules construyen un espacio de libertad, aventura y curiosidad.",
      "project.surreal.text2": "Es un pequeño viaje hacia el paisaje surrealista de la infancia: cómo se sienten las cosas dentro de la mente de una niña, donde la imaginación marca el camino.",
      "project.isla.title": "Isla Paraíso",
      "project.isla.text": "Esta remera fue una creación hecha para una persona querida. Su intención fue representar la naturaleza desde una perspectiva onírica, algo parecido a un lugar surreal, un espacio donde se respira aire fresco, se encuentra inspiración y las cosas son coloridas. Algo como un pequeño paraíso escondido en algún lugar del mundo en el que vivimos, completado por aquello que elegimos ver en él.",
      "project.azul.title": "Azul",
      "project.azul.text1": "Este conjunto de cuatro piezas, creado a través de técnicas experimentales de impresión, formó parte de una exploración e investigación sobre color, saturación y textura. La artista produjo inicialmente una serie de imágenes; a partir de ellas desarrolló distintas formas, que luego tradujo en piezas físicas. Trabajó con una variedad de materiales, incluyendo piso de colectivo, radiografías, esponja y poliestireno.",
      "project.azul.text2": "Después de horas de pruebas, mezclas en distintas escalas y experimentación con colores y formas, emergieron estas creaciones. En estas obras, el azul evoca una sensación de sonido, fragmentación, movimiento y algo vivo que busca expresarse.",
      "project.superficies.title": "Superficies y Transformaciones",
      "project.formas.title": "Formas que Acompañan el Cuerpo",
      "project.intersecciones.title": "Intersecciones",
      "project.savia.intro": "Este es un proyecto que le da voz a la naturaleza y a las aguas del Microcentro. Es un movimiento, una manifestación que se despliega por las calles como un ecosistema que ofrece espacios de bienestar y descanso a quienes buscan sobrevivir día a día en el corazón de Buenos Aires.",
      "project.savia.render1": "Un proyecto que sigue las huellas de ambos usuarios para entender sus necesidades y actuar en consecuencia. ¿Qué espacios habitan? ¿Cómo los habitan? ¿Cómo podemos acompañarlos en su movimiento?",
      "project.savia.render2": "Casi miméticamente con el lenguaje propio del barrio, se despliega y se fusiona con el caos particular del entorno.",
      "project.savia.shape": "Forma y cuerpo / prototipo de asiento individual",
      "project.savia.scale": "Maqueta",
      "project.savia.analog": "Serie analógica ‘to look up’ / Microcentro 1995",
      "project.savia.logbook": "Bitácora / proceso de tesis",
      "project.savia.books": "Libros de mobiliario urbano",
      "project.savia.memoirs": "Memorias postales",
      "project.savia.footerTitle": "TO LOOK UP",
      "project.savia.partner": "SOCIO DEL PROYECTO",
      "project.migrar.intro": "Migrar es el acto de crecer, cambiar y transformarse. Una nace en un espacio seguro y familiar. Esa experiencia se adapta, se reconstruye y se completa con la forma en que una crece, aprende a socializar y se encuentra con el mundo exterior.",
      "project.migrar.soulTitle": "Qué le sucede al alma que migra",
      "project.migrar.soul1": "Revivir esos momentos de la vida en los que somos llamadas a migrar. A veces por elección, otras veces no. Desde el momento de la creación, atravesando el desarrollo y llegando a la transformación de un ser.",
      "project.migrar.soul2": "Una curiosidad, un deseo de evolucionar, de convertirse en algo más, de reinventarse, impulsa a migrar. Aventurarse hacia lo desconocido, abrir un camino hacia otras formas. Entender nuevas realidades, cuestionar lo establecido, revolucionar, multiplicarse, migrar dejando una huella.",
      "project.encanto.copy1": "En este proyecto se desarrolló una colección de ropa de verano a partir de un concepto y una ciudad del mundo. La propuesta fusiona ambos universos y los traduce en texturas, materiales, colores y formas que interactúan entre sí.",
      "project.encanto.copy2": "Por un lado, el mundo industrial del subte: los elementos rotos, sucios y desgastados, donde el ritmo es acelerado y oscuro. Por el otro, el encanto de Edimburgo se utiliza para representar el lado delicado de la realeza: elementos florales, luminosos y sutiles.",
      "project.encanto.conceptLabel": "Concepto",
      "project.encanto.conceptValue": "Subte",
      "project.encanto.cityLabel": "Ciudad",
      "project.encanto.cityValue": "Edimburgo",
      "label.section": "Sección",
      "label.series": "Serie",
      "label.material": "Material",
      "label.photo": "Fotografía",
      "label.territory": "Territorio",
      "label.childhood": "Infancia",
      "label.painting": "Pintura",
      "label.paradise": "Paraíso",
      "label.textile": "Textil",
      "label.color": "Color",
      "label.monocopy": "Monocopia",
      "label.lichens": "Likenes",
      "label.photographs": "Fotografías",
      "label.barksTextures": "Cortezas y Texturas",
      "label.jewelry": "Joyería",
      "label.micro": "Micro",
      "label.paintings": "Cuadros",
      "footer.rights": "© All rights reserved"
    },
    en: {
      "nav.works": "WORKS",
      "nav.art": "ARTS & PHOTOGRAPHY",
      "nav.archive": "WORKS",
      "nav.bio": "ARTS & PHOTOGRAPHY",
      "nav.contact": "CONTACT",
      "home.eyebrow": "Hi! this is Elisa Cipriani",
      "home.title": "A multidisciplinary designer from Buenos<br>Aires, Argentina.",
      "home.copy1": "Exploring arts, fashion, and culture<br>through handmade practices.",
      "home.copy2": "Values the creative process where ideas<br>and materials need to become projects.",
      "statement.title": "To design is to<br>to give life<br>new universes.",
      "statement.caption": "The most valuable tools we have within ourselves are imagination and creativity. With these, we can give shape to things so that the world gets to know them.",
      "works.title": "Works",
      "works.note": "Works, series and records.",
      "works.category": "work",
      "works.cat.savia": "Matter / Design",
      "works.cat.migrar": "Territory / Research",
      "works.cat.encanto": "Object / Installation",
      "works.cat.hilvan": "Textile / Process",
      "works.cat.diary": "Editorial design / Tattoo",
      "works.meta.savia": "Integral Design Thesis<br>De ‘25",
      "works.meta.migrar": "Audiovisual Installation<br>Dec ‘25",
      "works.meta.encanto": "Fashion Collection<br>Dec ‘25",
      "works.meta.hilvan": "Artisan Curation<br>July ‘25",
      "works.meta.diary": "Analogue Photography<br>July ‘23",
      "arts.title": "Arts & Photography",
      "arts.note": "Series, images and visual archives.",
      "arts.category": "arts & photography",
      "arts.cat.surreal": "Series / Childhood",
      "arts.cat.chalten": "Territory / Photography",
      "arts.cat.isla": "Photography / Travel",
      "arts.cat.azul": "Painting / Image",
      "arts.cat.dreaming": "Dream / Photography",
      "arts.project.formas": "Forms that Accompany the Body",
      "arts.project.superficies": "Surfaces and Transformations",
      "arts.project.intersecciones": "Intersections",
      "arts.project.surreal": "Surreal Landscape of Childhood",
      "arts.project.chalten": "El Chaltén",
      "arts.project.isla": "Isla Paraíso",
      "arts.project.azul": "Azul",
      "arts.project.dreaming": "The Infinite Forms of Dreaming",
      "arts.cat.formas": "Barks and Textures / Jewelry",
      "arts.cat.superficies": "Lichens / Photography",
      "arts.cat.intersecciones": "Micro / Paintings",
      "who.title": "Who is Elisa Cipriani",
      "who.copy1": "She tries not to define herself in only one way. She likes to think that we are many things. We transform, reconfigure and grow irregularly. In this moment, she is a designer with a huge desire to create unique, challenging and strong things.",
      "who.copy2": "She enjoys taking pictures, illustrating and designing. She is fond of the fusion between art and design. She believes the things she does have to have an identity. Projects need to come to life, have a soul. That is why she puts everything from herself into every work she creates.",
      "trust.copy1": "She thinks that in order to do in the creative world, there needs to be trust: we need to involve our bodies, our minds, and our hands.",
      "trust.copy2": "She is passionate about handcrafts. There is something very interesting where handmade meets digital things in order to keep creating in other ways.",
      "trust.copy3": "Today, she believes that it is important to make space for sensibility: what leaves a trace over our paths. Culture and design are ways of expression, connection and exchange.",
      "journey.title": "Journey",
      "journey.copy1": "Her artistic journey began at a young age. During school, she performed in Antigone, The Dispute, Heart Piece, and various monologues, including one inspired by The Imagination of Disaster, for which she received top grades in the IGCSE 2019.<br><br>She studied contemporary dance, which led to a trip to New York City in 2020. In 2021, she completed the International Baccalaureate in Arts, an experience that strongly shaped her creative perspective.",
      "journey.copy2": "In 2025, she graduated with a Bachelor's degree in Design from Universidad Torcuato Di Tella. Her work places strong emphasis on the creative process.<br><br>Through her designs, she expresses freedom and creativity, placing special value on the conceptual dimension of projects. She is particularly interested in connecting design with visual and plastic arts, cinema, photography, and music.",
      "experience.title": "Experience",
      "experience.item0": "Visual identity and editorial design for Roomie Design. Developing graphic pieces, visual communication, and studio content.",
      "experience.item1": "Visual communication, graphic design, and social media content for Rosalia Iturbe's 2025 poetry anthology Las Cosas Celestes.",
      "experience.item2": "Illustration and book design for Rosalia Iturbe's 2024 poetry anthology Peces Plateados.",
      "experience.item3": "Freelance graphic design and social media management for the book Prufrock: La cancion que no termina.",
      "experience.item4": "Hi Its Mora - Founder & Creative Director. Independent jewelry project: handmade rings, art direction, product photography, social media content, and brand development.",
      "education.title": "Education",
      "education.item1": "Bachelor in Design - University Torcuato Di Tella",
      "education.item2": "Exchange Program - Universität zu Köln Business School, Germany",
      "education.item3": "Exchange Program - Durban Girls College, South Africa",
      "education.item4": "St. George's College, Quilmes. Cambridge IGCSE & International Baccalaureate Diploma",
      "languages.title": "Languages",
      "languages.item1": "Spanish (Native)",
      "languages.item2": "English (C2 - IGCSE & IB)",
      "languages.item3": "German (A1)",
      "courses.title": "Courses",
      "courses.item1": "Theater - Timbre 4",
      "courses.item2": "Art and Philosophy Course",
      "courses.item3": "Japanese Embroidery Course",
      "courses.item4": "Inktinerante Tattoo Academy",
      "courses.item5": "Theater - Teatro Estudio el Cuervo",
      "courses.item6": "Drawing Human Figure Course",
      "skills.title": "Skills",
      "skills.item1": "Cultural & Artisanal Practices",
      "skills.item2": "Print & Material Exploration",
      "skills.item3": "Narrative & Archival Research",
      "skills.item4": "Installation & Spatial Design",
      "skills.item5": "Conceptual & Experimental Design",
      "skills.item6": "Fashion & Textile Design",
      "skills.item7": "Editorial Design",
      "skills.item8": "Graphic Design",
      "skills.item9": "Sound Design",
      "skills.item10": "Photography",
      "software.title": "Softwares",
      "contact.title": "LET'S WORK TOGETHER",
      "contact.copy": "Whether you want to collaborate or simply talk about arts and culture, feel free to reach out.",
      "project.chalten.title": "Photographic series / <br>El Chaltén",
      "project.chalten.intro": "This series of photographs was taken during a journey to El Chaltén, in Santa Cruz, Patagonia Argentina. The designer traveled there to immerse herself in nature, staying in a natural reserve devoted to conservation and environmental research.",
      "project.chalten.text": "Here, at what we call El fin del mundo, nature reveals its true scale. Among lakes, glaciers, forests, winds, and scents, a deep sense of peace emerges, as if the world briefly returned to its essential form. These photographs seek to hold that moment: the feeling of encountering nature and recognizing oneself as a small part of something immense.",
      "project.surreal.title": "Surreal Landscape of Childhood",
      "project.surreal.text1": "A return to the kind of art she made as a child; loose strokes, bold colors, and a world where everything feels possible. Greens, oranges, pinks, and blues shape a space of freedom, adventure, and curiosity.",
      "project.surreal.text2": "It is a small journey into the surreal landscape of childhood: how things feel inside a child’s mind, where imagination leads the way.",
      "project.isla.title": "Isla Paraíso",
      "project.isla.text": "This tshirt was a creation made for a loved one. Her intention was to represent nature from a dreamlike perspective, something like a surreal place, a space where one breathes fresh air, finds inspiration, and where things are colorful. Something like a small paradise hidden somewhere in the world we live in, completed by what we choose to see in it.",
      "project.azul.title": "Azul",
      "project.azul.text1": "This set of four pieces, created through experimental printmaking, was part of an exploration and investigation into color, saturation, and texture. The artist initially produced a series of images; from them, she developed different forms, which she then translated into physical pieces. She worked with a range of materials, including bus flooring, X-rays, sponge, and polystyrene.",
      "project.azul.text2": "After hours of testing, mixing at different scales, and experimenting with colors and shapes, these creations emerged. Within these works, the blue evokes a sense of sound, fragmentation, movement, and something alive that seeks to express itself.",
      "project.superficies.title": "Surfaces and Transformations",
      "project.formas.title": "Forms that Accompany the Body",
      "project.intersecciones.title": "Intersections",
      "project.savia.intro": "This is a project which gives a voice to the nature and waters of the Microcentro. It is a movement, a manifestation that unfolds throughout the streets like an ecosystem offering spaces of wellbeing and rest to those who are seeking to survive day by day in the heart of Buenos Aires.",
      "project.savia.render1": "A project that follows the traces of both users to understand their needs and act accordingly. Which spaces do they inhabit? How do they inhabit them? How can we accompany them in their movement?",
      "project.savia.render2": "Almost mimetically with the neighborhood’s own language, it unfolds and merges with the particular chaos fo the environment.",
      "project.savia.shape": "Shape and body / single seat prototype",
      "project.savia.scale": "Scale model",
      "project.savia.analog": "Analog series ‘to look up’ / Microcentro 1995",
      "project.savia.logbook": "Logbook / thesis process",
      "project.savia.books": "Street furniture books",
      "project.savia.memoirs": "Postal memoirs",
      "project.savia.footerTitle": "TO LOOK UP",
      "project.savia.partner": "PROJECT PARTNER",
      "project.migrar.intro": "To migrate is the act of growing, of changing, of transforming. One is born in a safe, familiar space. This experience is adapted, reconstructed, and complemented by the way one is raised, how one learns to socialize, and how one encounters the outside world.",
      "project.migrar.soulTitle": "What Happens to the Soul that Migrates",
      "project.migrar.soul1": "To relive those moments in life when we are called to migrate. Sometimes by choice, other times not. From the moment of creation, through development, and into the transformation of a being.",
      "project.migrar.soul2": "A curiosity, a desire to evolve, to become something more, to reinvent oneself, drives one to migrate. To venture into the unknown, to carve a path toward other forms. To understand new realities, to question what is established, to revolutionize, to multiply, to migrate leaving a trail.",
      "project.encanto.copy1": "In this project, a summer clothing collection was developed based on a concept and a city from around the world. The proposal merges both universes and translates them into textures, materials, colors, and shapes that interact with each other.",
      "project.encanto.copy2": "On the one hand, the industrial world of the subway: the broken, dirty, and worn elements, where the rhythm is fast-paced and dark. On the other hand, the charm of Edinburgh is used to represent the delicate side of royalty: floral, luminous, and subtle elements.",
      "project.encanto.conceptLabel": "Concept",
      "project.encanto.conceptValue": "Subway",
      "project.encanto.cityLabel": "City",
      "project.encanto.cityValue": "Edimburgh",
      "label.section": "Section",
      "label.series": "Series",
      "label.material": "Material",
      "label.photo": "Photography",
      "label.territory": "Territory",
      "label.childhood": "Childhood",
      "label.painting": "Painting",
      "label.paradise": "Paradise",
      "label.textile": "Textile",
      "label.color": "Color",
      "label.monocopy": "Monocopy",
      "label.lichens": "Lichens",
      "label.photographs": "Photographs",
      "label.barksTextures": "Barks and Textures",
      "label.jewelry": "Jewelry",
      "label.micro": "Micro",
      "label.paintings": "Paintings",
      "footer.rights": "© All rights reserved"
    }
  };

  function readLanguage() {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");

    if (copy[urlLanguage]) {
      saveLanguage(urlLanguage);
      return urlLanguage;
    }

    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return window.__elisaLanguage || "es";
    }
  }

  function saveLanguage(language) {
    window.__elisaLanguage = language;
    try {
      localStorage.setItem(storageKey, language);
    } catch (error) {
      return;
    }
  }

  function localizedUrl(href, language) {
    const url = new URL(href || window.location.href, window.location.href);
    url.searchParams.set("lang", language);
    return url.href;
  }

  function updateInternalLinks(language) {
    document.querySelectorAll("a[href]").forEach((link) => {
      if (link.matches("[data-set-lang], [data-lang-link]")) {
        return;
      }

      const href = link.getAttribute("href");

      if (!href || href.startsWith("#") || link.target || /^mailto:|^tel:/i.test(href)) {
        return;
      }

      const url = new URL(href, window.location.href);

      if (url.protocol !== "file:" && url.origin !== window.location.origin) {
        return;
      }

      url.searchParams.set("lang", language);
      link.setAttribute("href", url.href);
    });
  }

  function setLanguage(language) {
    const currentLanguage = copy[language] ? language : "es";
    document.documentElement.lang = currentLanguage;
    saveLanguage(currentLanguage);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = copy[currentLanguage][node.dataset.i18n];

      if (!value) {
        return;
      }

      if (value.includes("<br>") || value.includes("&")) {
        node.innerHTML = value;
      } else {
        node.textContent = value;
      }
    });

    document.querySelectorAll("[data-set-lang], [data-lang-link]").forEach((button) => {
      const language = button.dataset.setLang || button.dataset.langLink;
      const isCurrentLanguage = language === currentLanguage;

      if (button.dataset.langLink) {
        button.setAttribute("href", localizedUrl(window.location.href, language));
      }

      button.hidden = false;
      button.setAttribute("aria-pressed", String(isCurrentLanguage));
      button.setAttribute("aria-label", language === "es" ? "Cambiar a español" : "Switch to English");
    });

    updateInternalLinks(currentLanguage);
  }

  window.elisaSetLanguage = setLanguage;
  window.elisaSwitchLanguage = function (language, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const currentLanguage = copy[language] ? language : "es";
    setLanguage(currentLanguage);

    const url = new URL(window.location.href);
    url.searchParams.set("lang", currentLanguage);

    try {
      window.history.replaceState(null, "", url.href);
    } catch (error) {
      window.location.href = url.href;
    }

    return false;
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-set-lang], [data-lang-link]");

    if (!button) {
      return;
    }

    const language = button.dataset.setLang || button.dataset.langLink;

    event.preventDefault();
    event.stopImmediatePropagation();

    window.elisaSwitchLanguage(language, event);
  }, true);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setLanguage(readLanguage() || "es"), { once: true });
  } else {
    setLanguage(readLanguage() || "es");
  }
}());
