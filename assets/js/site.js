function setupCustomCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  const cursor = document.createElement("div");
  cursor.className = "custom-cursor";
  cursor.setAttribute("aria-hidden", "true");
  document.documentElement.classList.add("has-custom-cursor");
  document.body.appendChild(cursor);

  document.addEventListener("mousemove", (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0) translate(-34px, -8px)`;
    cursor.classList.add("is-visible");

    const target = event.target;
    const isImageArea = target instanceof Element && target.closest(".hero, img, video, .statement-portraits");
    const needsDarkCursor = target instanceof Element && target.closest(".is-savia-index .project-index-thumb, .is-diary-index .project-index-thumb");
    const isDarkProject = document.body.classList.contains("migrar-project");
    const keepsDarkCursor = document.body.classList.contains("encanto-project") || document.body.classList.contains("hilvan-project");
    cursor.classList.toggle("is-light", isDarkProject || (!keepsDarkCursor && !needsDarkCursor && Boolean(isImageArea)));
  });

  document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
}

function setupSectionTopLinks() {
  document.querySelectorAll("main > section").forEach((section) => {
    if (section.querySelector(".section-top-link")) {
      return;
    }

    const link = document.createElement("a");
    link.className = "section-top-link";
    link.href = "#top";
    link.setAttribute("aria-label", "Volver al inicio");
    section.appendChild(link);
  });
}

function setupPageTransitions() {
  document.querySelectorAll(".brand, .site-nav a").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || href.startsWith("#") || link.target) {
        return;
      }

      event.preventDefault();
      window.setTimeout(() => {
        window.location.href = href;
      }, 220);
    });
  });
}

function setupMobileMenu() {
  document.querySelectorAll(".site-header").forEach((header) => {
    const nav = header.querySelector(".site-nav");

    if (!nav || header.querySelector(".menu-toggle")) {
      return;
    }

    const button = document.createElement("button");
    button.className = "menu-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Abrir menú");
    button.setAttribute("aria-expanded", "false");
    button.innerHTML = "<span></span><span></span>";
    header.insertBefore(button, nav);

    button.addEventListener("click", () => {
      const isOpen = document.body.classList.toggle("mobile-menu-open");
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        document.body.classList.remove("mobile-menu-open");
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-label", "Abrir menú");
      });
    });
  });
}

function setupTopLinks() {
  document.querySelectorAll(".footer-top, .section-top-link").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const top = document.getElementById("top");

      if (top && typeof top.scrollIntoView === "function") {
        top.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

function setupHeaderState() {
  const update = () => {
    document.body.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
}

const languageStorageKey = "elisa-cipriani-language";

function readSavedLanguage() {
  try {
    return localStorage.getItem(languageStorageKey);
  } catch (error) {
    return window.__elisaLanguage || null;
  }
}

function saveLanguage(language) {
  window.__elisaLanguage = language;
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch (error) {
    return;
  }
}

const copy = {
  es: {
    "nav.works": "TRABAJOS",
    "nav.art": "ARTE Y FOTOGRAFÍA",
    "nav.contact": "CONTACTO",
    "home.eyebrow": "Hola! esta es Elisa Cipriani",
    "home.title": "Diseñadora multidisciplinaria de Buenos Aires, Argentina.",
    "home.copy1": "Explora arte, moda y cultura<br>a través de prácticas hechas a mano.",
    "home.copy2": "Valora el proceso creativo, donde ideas y materiales se encuentran para convertirse en proyectos.",
    "statement.title": "Diseñar es dar<br>vida a nuevos<br>universos.",
    "statement.caption": "Las herramientas más valiosas que tenemos dentro son la imaginación y la creatividad. Con ellas podemos dar forma a las cosas para que el mundo las conozca.",
    "works.title": "Trabajos",
    "works.note": "Obras, series y registros.",
    "works.category": "trabajo",
    "works.cat.savia": "Materia / Diseño",
    "works.cat.migrar": "Territorio / Investigación",
    "works.cat.encanto": "Objeto / Instalación",
    "works.cat.hilvan": "Textil / Proceso",
    "works.cat.diary": "Diseño Editorial / Tatuaje",
    "works.project.diary": "Diario de una antología de tatuajes",
    "arts.title": "Arte y fotografía",
    "arts.note": "Series, imágenes y archivos visuales.",
    "arts.category": "arte y fotografía",
    "arts.cat.surreal": "Serie / Infancia",
    "arts.cat.chalten": "Territorio / Fotografía",
    "arts.cat.isla": "Fotografía / Viaje",
    "arts.cat.azul": "Pintura / Imagen",
    "arts.cat.dreaming": "Sueño / Fotografía",
    "who.title": "Quien es Elisa Cipriani",
    "who.copy1": "Intenta no definirse de una sola manera. Le gusta pensar que somos muchas cosas. Nos transformamos, nos reconfiguramos y crecemos de forma irregular. En este momento es una diseñadora con un enorme deseo de crear cosas únicas, desafiantes y potentes.",
    "who.copy2": "Disfruta sacar fotos, ilustrar y diseñar. Le interesa la fusión entre arte y diseño. Cree que las cosas que hace tienen que tener identidad. Los proyectos necesitan cobrar vida, tener alma. Por eso pone todo de sí en cada trabajo que crea.",
    "trust.copy1": "Piensa que para hacer dentro del mundo creativo tiene que existir confianza: necesitamos involucrar nuestros cuerpos, nuestras mentes y nuestras manos.",
    "trust.copy2": "Le apasionan los oficios y las prácticas manuales. Hay algo muy interesante en el punto donde lo hecho a mano se encuentra con lo digital para seguir creando de otras maneras.",
    "trust.copy3": "Hoy cree que es importante hacer espacio para la sensibilidad: aquello que deja una huella en nuestros caminos. La cultura y el diseño son formas de expresión, conexión e intercambio.",
    "journey.title": "Recorrido",
    "journey.copy1": "Su recorrido artístico comenzó desde chica. Durante el colegio actuó en Antígona, The Dispute, Heart Piece y distintos monólogos, incluyendo uno inspirado en The Imagination of Disaster, por el cual recibió las mejores calificaciones en el IGCSE 2019.",
    "journey.copy2": "Estudió danza contemporánea, lo que la llevó a un viaje a Nueva York en 2020. En 2021 completó el Bachillerato Internacional en Artes, una experiencia que marcó profundamente su mirada creativa.",
    "journey.copy3": "En 2025 se graduó como Licenciada en Diseño en la Universidad Torcuato Di Tella. Su trabajo pone un fuerte énfasis en el proceso creativo.",
    "journey.copy4": "A través de sus diseños expresa libertad y creatividad, dando especial valor a la dimensión conceptual de los proyectos. Le interesa conectar el diseño con las artes visuales y plásticas, el cine, la fotografía y la música.",
    "experience.title": "Experiencia",
    "experience.date0": "2026 - Presente",
    "experience.item0": "Diseñadora de identidad visual y editorial en Roomie Design.",
    "experience.item1": "Comunicación visual, diseño gráfico y contenido para redes freelance para la antología de poesía Las Cosas Celestes de Rosalía Iturbe.",
    "experience.item2": "Ilustración y diseño de libro freelance para la antología de poesía Peces Plateados de Rosalía Iturbe.",
    "experience.item3": "Diseño gráfico y gestión de redes freelance para el libro Prufrock: La canción que no termina del equipo Taller Nomade de Fabián Casas.",
    "experience.item4": "Hi Its Mora - Fundadora y Directora Creativa. Proyecto independiente de joyería: anillos hechos a mano, dirección de arte, fotografía de producto, contenido para redes y desarrollo de marca.",
    "education.title": "Educación",
    "education.item1": "Licenciatura en Diseño - Universidad Torcuato Di Tella",
    "education.item2": "Programa de Intercambio - Universität zu Köln Business School, Alemania",
    "education.item3": "Programa de Intercambio - Durban Girls College, Sudáfrica",
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
    "footer.rights": "© Todos los derechos reservados"
  },
  en: {
    "nav.works": "WORKS",
    "nav.art": "ARTS & PHOTOGRAPHY",
    "nav.contact": "CONTACT",
    "home.eyebrow": "Hi! this is Elisa Cipriani",
    "home.title": "A multidisciplinary designer from Buenos Aires, Argentina.",
    "home.copy1": "Exploring arts, fashion, and culture<br>through handmade practices.",
    "home.copy2": "Values the creative process, where ideas and materials meet to become projects.",
    "statement.title": "To design is <br>to give life to <br>new universes.",
    "statement.caption": "The most valuable tools we have within ourselves are imagination and creativity. With these, we can give shape to things so that the world gets to know them.",
    "works.title": "Works",
    "works.note": "Works, series and records.",
    "works.category": "work",
    "works.cat.savia": "Matter / Design",
    "works.cat.migrar": "Territory / Research",
    "works.cat.encanto": "Object / Installation",
    "works.cat.hilvan": "Textile / Process",
    "works.cat.diary": "Illustration / Photography",
    "works.project.diary": "Diary of a Tattoo Anthology",
    "arts.title": "Arts & Photography",
    "arts.note": "Series, images and visual archives.",
    "arts.category": "arts & photography",
    "arts.cat.surreal": "Series / Childhood",
    "arts.cat.chalten": "Territory / Photography",
    "arts.cat.isla": "Photography / Travel",
    "arts.cat.azul": "Painting / Image",
    "arts.cat.dreaming": "Dream / Photography",
    "who.title": "Who is E.C.",
    "who.copy1": "She tries not to define herself in only one way. She likes to think that we are many things. We transform, reconfigure and grow irregularly. In this moment, she is a designer with a huge desire to create unique, challenging and strong things.",
    "who.copy2": "She enjoys taking pictures, illustrating and designing. She is fond of the fusion between art and design. She believes the things she does have to have an identity. Projects need to come to life, have a soul. That is why she puts everything from herself into every work she creates.",
    "trust.copy1": "She thinks that in order to do in the creative world, there needs to be trust: we need to involve our bodies, our minds, and our hands.",
    "trust.copy2": "She is passionate about handcrafts. There is something very interesting where handmade meets digital things in order to keep creating in other ways.",
    "trust.copy3": "Today, she believes that it is important to make space for sensibility: what leaves a trace over our paths. Culture and design are ways of expression, connection and exchange.",
    "journey.title": "Journey",
    "journey.copy1": "Her artistic journey began at a young age. During school, she performed in Antigone, The Dispute, Heart Piece, and various monologues, including one inspired by The Imagination of Disaster, for which she received top grades in the IGCSE 2019.",
    "journey.copy2": "She studied contemporary dance, which led to a trip to New York City in 2020. In 2021, she completed the International Baccalaureate in Arts, an experience that strongly shaped her creative perspective.",
    "journey.copy3": "In 2025, she graduated with a Bachelor's degree in Design from Universidad Torcuato Di Tella. Her work places strong emphasis on the creative process.",
    "journey.copy4": "Through her designs, she expresses freedom and creativity, placing special value on the conceptual dimension of projects. She is particularly interested in connecting design with visual and plastic arts, cinema, photography, and music.",
    "experience.title": "Experience",
    "experience.date0": "2026 - Present",
    "experience.item0": "Visual Identity and Editorial Designer at Roomie Design.",
    "experience.item1": "Freelance visual communication, graphic design, and social media content for Rosalia Iturbe's poetry anthology Las Cosas Celestes.",
    "experience.item2": "Freelance illustration and book design for Rosalia Iturbe's poetry anthology Peces Plateados.",
    "experience.item3": "Freelance graphic design and social media management for the book Prufrock: La cancion que no termina for Fabian Casas' Taller Nomade Team.",
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
    "footer.rights": "© All rights reserved"
  }
};

function setLanguage(language) {
  document.documentElement.lang = "es";
}

window.elisaSetLanguage = setLanguage;

setupHeaderState();
setupCustomCursor();
setupMobileMenu();
setupPageTransitions();
setupTopLinks();
setLanguage("es");
