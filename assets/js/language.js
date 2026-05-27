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
      "home.title": "Diseñadora multidisciplinaria de<br>Buenos Aires, Argentina.",
      "home.copy1": "Explora arte, moda y cultura<br>a través de prácticas hechas a mano.",
      "home.copy2": "Valora el proceso creativo donde las ideas<br>y los materiales necesitan convertirse en proyectos.",
      "statement.title": "Diseñar<br>es dar<br>vida a<br>nuevos<br>universos",
      "statement.caption": "Las herramientas más valiosas que tenemos dentro son la imaginación y la creatividad. Con ellas podemos dar forma a las cosas para que el mundo las conozca.",
      "works.title": "Trabajos",
      "works.note": "Obras, series y registros.",
      "works.category": "trabajo",
      "works.cat.savia": "Tesis Integral de Diseño",
      "works.cat.migrar": "Instalación Audiovisual",
      "works.cat.encanto": "Colección de Moda",
      "works.cat.hilvan": "Curaduría Artesanal",
      "works.cat.diary": "Ilustración y Fotografía",
      "works.project.diary": "Diario de una antología de tatuajes",
      "works.meta.savia": "Tesis Integral de Diseño<br>2025",
      "works.meta.migrar": "Instalación Audiovisual<br>2025",
      "works.meta.encanto": "Colección de Moda<br>2025",
      "works.meta.hilvan": "Curaduría Artesanal<br>2025",
      "works.meta.diary": "Ilustración y Fotografía<br>2023",
      "arts.title": "Arte y fotografía",
      "arts.note": "Series, imágenes y archivos visuales.",
      "arts.category": "arte y fotografía",
      "arts.cat.surreal": "Pintura<br>2026",
      "arts.cat.chalten": "Fotografía<br>2024",
      "arts.cat.isla": "Bordado<br>2024",
      "arts.cat.azul": "Grabado<br>2022",
      "arts.cat.dreaming": "Diseño Gráfico y Textil<br>2022",
      "arts.project.formas": "Formas que Acompañan el Cuerpo",
      "arts.project.superficies": "Superficies y Transformaciones",
      "arts.project.intersecciones": "Intersecciones",
      "arts.project.surreal": "Paisaje surrealista de la infancia",
      "arts.project.chalten": "El Chaltén",
      "arts.project.isla": "Isla Paraíso",
      "arts.project.azul": "Azul",
      "arts.project.dreaming": "Las formas infinitas del sueño",
      "arts.cat.formas": "Joyería<br>2026",
      "arts.cat.superficies": "Fotografía<br>2026",
      "arts.cat.intersecciones": "Cuadros<br>2026",
      "who.title": "Quien es Elisa Cipriani",
      "who.copy1": "Intenta no definirse de una sola manera. Le gusta pensar que somos muchas cosas. Nos transformamos, nos reconfiguramos y crecemos de forma irregular. En este momento es una diseñadora con un enorme deseo de crear cosas únicas, desafiantes y potentes.",
      "who.copy2": "Disfruta sacar fotos, ilustrar y diseñar. Le interesa la fusión entre arte y diseño. Cree que las cosas que hace tienen que tener identidad. Los proyectos necesitan cobrar vida, tener alma. Por eso pone todo de sí en cada trabajo que crea.",
      "trust.copy1": "Piensa que para hacer dentro del mundo creativo tiene que existir confianza: necesitamos involucrar nuestros cuerpos, nuestras mentes y nuestras manos.",
      "trust.copy2": "Le apasionan los oficios y las prácticas manuales. Hay algo muy interesante en el punto donde lo hecho a mano se encuentra con lo digital para seguir creando de otras maneras.",
      "trust.copy3": "Hoy cree que es importante hacer espacio para la sensibilidad: aquello que deja una huella en nuestros caminos. La cultura y el diseño son formas de expresión, conexión e intercambio.",
      "journey.title": "Recorrido",
      "journey.copy1": "Su recorrido artístico comenzó desde chica. Durante el colegio actuó en Antígona, The Dispute, Heart Piece y distintos monólogos, incluyendo uno inspirado en The Imagination of Disaster, por el cual recibió las mejores calificaciones en el IGCSE 2019.<br><br>Estudió danza contemporánea, lo que la llevó a un viaje a Nueva York en 2020. En 2021 completó el Bachillerato Internacional en Artes, una experiencia que marcó profundamente su mirada creativa.",
      "journey.copy2": "En 2025 se graduó como Licenciada en Diseño en la Universidad Torcuato Di Tella. Su trabajo pone un fuerte énfasis en el proceso creativo.<br><br>A través de sus diseños expresa libertad y creatividad, dando especial valor a la dimensión conceptual de los proyectos. Le interesa conectar el diseño con las artes visuales y plásticas, el cine, la fotografía y la música.",
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
      "courses.item7": "Joyería Contemporánea - Patricia Galucci",
      "courses.item8": "Intensivo Joyería - Taller Eloi",
      "courses.item9": "Cómo Vivir del Arte - BADA Argentina",
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
      "project.chalten.title": "El Chaltén",
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
      "project.superficies.area": "Fotografía",
      "project.superficies.date": "2026",
      "project.formas.title": "Formas que Acompañan el Cuerpo",
      "project.formas.area": "Joyería",
      "project.formas.date": "2026",
      "project.intersecciones.title": "Intersecciones",
      "project.intersecciones.area": "Cuadros",
      "project.intersecciones.date": "2026",
      "project.chalten.area": "Fotografía",
      "project.chalten.date": "2024",
      "project.surreal.area": "Pintura",
      "project.surreal.date": "2026",
      "project.isla.area": "Bordado",
      "project.isla.date": "2024",
      "project.azul.area": "Grabado",
      "project.azul.date": "2022",
      "project.dreaming.title": "Las formas infinitas del sueño",
      "project.dreaming.area": "Diseño gráfico y textil",
      "project.dreaming.date": "2022",
      "project.dreaming.selectedTitle": "Pieza Seleccionada",
      "project.dreaming.rugTitle": "Creación De La Pieza Seleccionada Transformada En Alfombra",
      "project.savia.area": "Tesis integral de diseño",
      "project.savia.date": "2025",
      "project.savia.intro": "Este es un proyecto que le da voz a la naturaleza y a las aguas del Microcentro. Es un movimiento, una manifestación que se despliega por las calles como un ecosistema que ofrece espacios de bienestar y descanso a quienes buscan sobrevivir día a día en el corazón de Buenos Aires.",
      "project.savia.subtitle": "La voz de quienes permanecen",
      "project.savia.render1": "Un proyecto que sigue las huellas de ambos usuarios para entender sus necesidades y actuar en consecuencia. ¿Qué espacios habitan? ¿Cómo los habitan? ¿Cómo podemos acompañarlos en su movimiento?",
      "project.savia.render2": "Casi miméticamente con el lenguaje propio del barrio, se despliega y se fusiona con el caos particular del entorno.",
      "project.savia.streetPieces": "Piezas De Mobiliario Urbano",
      "project.savia.streetSeries": "Serie de mobiliario urbano",
      "project.savia.street.singleSupport": "Apoyo isquiático individual",
      "project.savia.street.multipleSupport": "Apoyo isquiático múltiple",
      "project.savia.street.singleSeat": "Asiento individual",
      "project.savia.street.multipleSeat": "Asiento múltiple",
      "project.savia.street.multipleBackrest": "Asiento múltiple con respaldo",
      "project.savia.street.singleTable": "Mesa individual",
      "project.savia.street.multipleTable": "Mesa múltiple",
      "project.savia.street.highTable": "Mesa alta",
      "project.savia.street.ashtray": "Cenicero",
      "project.savia.shape": "Forma Y Cuerpo / Prototipo De Asiento Individual",
      "project.savia.scale": "Maqueta",
      "project.savia.systemTitle": "Versión micro",
      "project.savia.systemCopy": "Estructuras que elevan la naturaleza, permitiendo que las plantas crezcan libremente y se desplieguen como lo hacen en el bosque.",
      "project.savia.microTitle": "Versión micro",
      "project.savia.microCopy": "En el corazón de la ciudad, un jardín de senderos se bifurcan. Hay una voz que con el tiempo se conserva en el barrio: una que debemos cuidar y mantener viva. Mirar hacia arriba, para encontrarse con la naturaleza propia del Microcentro. Volverse parte, desplegarse, convertirse en extensión.",
      "project.savia.graphic42.kicker": "Huellas",
      "project.savia.graphic42.side": "Sentirse en la naturaleza, creerse parte de ella.",
      "project.savia.graphic42.question": "¿Qué hay debajo del suelo en el Microcentro? ¿Qué está intentando crecer?",
      "project.savia.graphic42.bottom": "Una voz compartida por trabajadores y naturaleza.",
      "project.savia.graphic43.a": "Si no pueden ir hacia la naturaleza.",
      "project.savia.graphic43.b": "¿Cómo acercamos la naturaleza a ellos?",
      "project.savia.graphic43.c": "Siguiendo sus huellas sin obstruir su camino, creando huellas para ellos, pero esta vez en verde.",
      "project.savia.graphic43.d": "Cómo descansar mientras se aprende entre el verde y se coexiste. Tanto la naturaleza como el trabajador dejan sus huellas, ayudándolos a coexistir de la manera más pacífica posible.",
      "project.savia.graphic43.e": "Intervenciones reales de la naturaleza.",
      "project.savia.graphic43.f": "Intervenciones digitales / generadores de naturaleza para promover su importancia.",
      "project.savia.graphic43.g": "Espacios que, a través del reflejo y la ubicación del sol, concentran calor en invierno y frescura en verano.",
      "project.savia.configuratorTitle": "Link Al Configurador",
      "project.savia.configuratorCopy": "Este configurador web fue desarrollado para que cualquier persona pueda explorar el sistema Savia y disponer cada una de sus partes como quiera. Personalizando nuevas maneras y dándole vida. Savia comienza en el área urbana del Microcentro de Buenos Aires, pero esto muestra que puede expandirse a cualquier parte del mundo.",
      "project.savia.analog": "Serie Analógica ‘To Look Up’ / Microcentro 1995",
      "project.savia.logbook": "Bitácora / Proceso De Tesis",
      "project.savia.books": "Libros De Mobiliario Urbano",
      "project.savia.memoirs": "Memorias Postales",
      "project.savia.footerTitle": "MIRAR HACIA ARRIBA",
      "project.savia.partner": "SOCIO DEL PROYECTO",
      "project.migrar.area": "Instalación audiovisual",
      "project.migrar.date": "2025",
      "project.migrar.subtitle": "Partir del propio hábitat hacia otro lugar",
      "project.migrar.intro": "Migrar es el acto de crecer, cambiar y transformarse. Una nace en un espacio seguro y familiar. Esa experiencia se adapta, se reconstruye y se completa con la forma en que una crece, aprende a socializar y se encuentra con el mundo exterior.",
      "project.migrar.map.path": "Camino",
      "project.migrar.map.travel": "Viaje",
      "project.migrar.map.community": "Comunidad",
      "project.migrar.map.individuality": "Individualidad",
      "project.migrar.map.leave": "Partir",
      "project.migrar.map.movement": "Movimiento",
      "project.migrar.map.lightness": "Levedad",
      "project.migrar.map.trace": "Huella",
      "project.migrar.map.change": "Cambio",
      "project.migrar.map.levitate": "Levitar",
      "project.migrar.map.mutate": "Mutar",
      "project.migrar.map.branch": "Ramificar",
      "project.migrar.map.fly": "Volar",
      "project.migrar.soulTitle": "Qué Le Sucede Al Alma Que Migra",
      "project.migrar.soul1": "Revivir esos momentos de la vida en los que somos llamadas a migrar. A veces por elección, otras veces no. Desde el momento de la creación, atravesando el desarrollo y llegando a la transformación de un ser.",
      "project.migrar.soul2": "Una curiosidad, un deseo de evolucionar, de convertirse en algo más, de reinventarse, impulsa a migrar. Aventurarse hacia lo desconocido, abrir un camino hacia otras formas. Entender nuevas realidades, cuestionar lo establecido, revolucionar, multiplicarse, migrar dejando una huella.",
      "project.migrar.watch": "Mirar Proyecto",
      "project.migrar.partners": "Socios del proyecto",
      "project.encanto.copy1": "En este proyecto se desarrolló una colección de ropa de verano a partir de un concepto y una ciudad del mundo. La propuesta fusiona ambos universos y los traduce en texturas, materiales, colores y formas que interactúan entre sí.",
      "project.encanto.copy2": "Por un lado, el mundo industrial del subte: los elementos rotos, sucios y desgastados, donde el ritmo es acelerado y oscuro. Por el otro, el encanto de Edimburgo se utiliza para representar el lado delicado de la realeza: elementos florales, luminosos y sutiles.",
      "project.encanto.conceptLabel": "Concepto",
      "project.encanto.conceptValue": "Subte",
      "project.encanto.cityLabel": "Ciudad",
      "project.encanto.cityValue": "Edimburgo",
      "project.encanto.mood.wear": "vestir",
      "project.encanto.mood.irregular": "irregular",
      "project.encanto.mood.mystery": "misterio",
      "project.encanto.mood.linear": "patrones lineales",
      "project.encanto.mood.delicacy": "delicadeza",
      "project.encanto.mood.dirt": "suciedad",
      "project.encanto.mood.transparencies": "transparencias",
      "project.encanto.mood.dreams": "sueños",
      "project.encanto.mood.broken": "roto",
      "project.encanto.mood.darkness": "oscuridad",
      "project.encanto.mood.texture": "textura",
      "project.encanto.mood.moss": "musgo",
      "project.encanto.mood.lights": "luces artificiales",
      "project.encanto.secretShorts": "Bermudas Secreto",
      "project.encanto.invitationTitle": "Invitación",
      "project.encanto.inviteName": "Srta. Agustina Cattánea",
      "project.encanto.inviteLine1": "está cordialmente invitada a asistir",
      "project.encanto.inviteLine2": "a la presentación de la colección",
      "project.encanto.inviteSeason": "Primavera - Verano SS26",
      "project.encanto.inviteDate": "viernes 28 de noviembre, 17:30hs",
      "project.encanto.inviteSeat": "VIP - Primera fila",
      "project.encanto.partners": "Socias del proyecto",
      "project.encanto.partnerNames": "Mora Jauregui y Matilda Alabes",
      "project.encanto.area": "Colección de moda",
      "project.encanto.date": "2025",
      "project.hilvan.title": "Hilván",
      "project.hilvan.subtitle": "[Costura de puntadas largas y sueltas]",
      "project.hilvan.area": "Curaduría artesanal",
      "project.hilvan.date": "2025",
      "project.hilvan.intro1": "A project that brings together the unique act of making with our own hands. Putting our bodies, experimenting with materiality, texture, and the value found within this gestures. The desire of our Hilván is to give shape to a project that fuses matter and thread, and to inspire others to keep manual practices alive.",
      "project.hilvan.intro2": "Each of the pieces created seek to recover the meaning of handmaking, something we often overlook today due to the advancements of technology and the ease with which it solves our needs. One of its consequences is that we have begun to forget all that we are capable of making with our hands.",
      "project.hilvan.identity": "Sistema de Identidad",
      "project.hilvan.archive": "Libro De Concepto Y Archivo",
      "project.hilvan.archiveCopy": "Una pieza editorial que reúne el universo conceptual del proyecto, sus objetos, referencias y decisiones materiales.",
      "project.hilvan.invitation": "Invitaciones para artesanos",
      "project.hilvan.postal": "Memoria Postal",
      "project.hilvan.textile": "Piezas Textiles Y Conceptuales",
      "project.hilvan.footerTitle": "HILVÁN",
      "project.hilvan.partner": "SOCIA DEL PROYECTO",
      "project.hilvan.partnerName": "Elisa Cipriani",
      "project.hilvan.subfooterQuote": "Como dice la poeta y artista textil chilena Cecilia<br>Vicuña: “El hilo teje el mundo.”",
      "project.hilvan.subfooterPartner": "SOCIA DEL PROYECTO",
      "project.hilvan.artisansTitle": "Artesanos en Argentina",
      "project.hilvan.artisansCopy1": "Seres que crean desde las raíces de nuestra tierra y nuestras materias primas. Texturas, colores y formas los inspiran a crear.",
      "project.hilvan.artisansCopy2": "Por eso proponemos un encuentro, realizado por primera vez en Buenos Aires, donde artesanos y artistas se reúnen para crear, inspirar y compartir.",
      "project.hilvan.workshopsCopy": "Talleres ambos días. ¡Sé parte!",
      "project.hilvan.exchangeCopy": "Todos invitados a compartir e intercambiar conocimiento.",
      "project.hilvan.stampTitle": "Sello de identidad personalizado para artesanos",
      "project.hilvan.fanzineTitle": "Fanzine artesanal",
      "project.hilvan.fanzineCopy1": "Esta pieza fue realizada completamente a mano por Elisa para el proyecto. Fue creada a través del collage, usando recortes de prendas de la colección y textiles. La intención detrás de su creación fue transformar el fanzine en una pieza fusionada con la indumentaria, algo coleccionable y memorable.",
      "project.hilvan.fanzineCopy2": "La autora buscó reinventar y reconceptualizar los objetos presentados. Las cosas son lo que percibimos que son; somos nosotros quienes les asignamos valor. Entonces démosles un significado y compartámoslas con el mundo para que puedan ser vistas y apreciadas.",
      "project.hilvan.cyanotypeTitle": "Piezas textiles de cianotipo hechas a mano",
      "project.hilvan.handmadeShirtTitle": "Camisa hecha a mano",
      "project.hilvan.handmadeShirtCopy1": "Esta pieza fue tejida y construida completamente a mano por Elisa, puntada por puntada. Su forma está inspirada en los quillangos, prendas tradicionales utilizadas por los pueblos originarios del sur de Argentina para protegerse del intenso frío patagónico.",
      "project.hilvan.handmadeShirtCopy2": "La capucha de gran tamaño recuerda su función maternal: las mujeres llevaban a sus bebés dentro de ella, transformando la prenda en refugio y vínculo. Las puntadas azules de hilván hacen referencia al nombre del proyecto. De este modo, la pieza se convierte en un acto de memoria y respeto hacia las comunidades indígenas de Argentina, verdaderas guardianas de los saberes manuales ancestrales.",
      "project.diary.title": "Diario de una antología de tatuajes",
      "project.diary.areaLabel": "Área",
      "project.diary.areaValue": "Ilustración y fotografía",
      "project.diary.dateLabel": "Fecha",
      "project.diary.dateValue": "2023",
      "project.diary.copy1": "Esta es una pieza creativa compuesta con la intención de reproducir, a través de posibles diseños de tatuajes o bocetos, las ideas que pueden surgir en la mente de alguien que imagina a través del dibujo.",
      "project.diary.copy2": "Esta pieza se presenta como el primer diario de una manifestación que combina fotografía analógica y dibujos hechos en papel con marcadores finos, luego digitalizados para componer una narrativa que se despliega en el terreno del inconsciente. La obra no termina cuando se lee la última página; más bien comienza a desplegarse en la vida de quienes interactúan con ella, abriendo la posibilidad de una Serie 2.",
      "project.diary.caption1": "¿De dónde vienen y hacia dónde van?",
      "project.diary.caption2": "Como una pieza musical,",
      "project.diary.caption3": "como parte de algún sueño, como una forma de contar historias,",
      "project.diary.caption4": "como firma estética de ciertos individuos, permanecerán como nobles portadores de amor.",
      "project.diary.caption5": "Abrirán espacios donde la curiosidad pueda echar raíces,",
      "project.diary.caption6": "crecerán dentro de la naturaleza,",
      "project.diary.caption7": "explorando espacios más allá del mundo tradicional del arte, trascendiendo el tiempo y el espacio,",
      "project.diary.caption8": "conmemorando aquello que ahora descansa sobre la piel de quienes se animan a llevar estos amuletos,",
      "project.diary.caption9": "nuevos mundos posibles comienzan a emerger sobre el más preciado de los lienzos.",
      "label.section": "Área",
      "label.series": "Área",
      "label.material": "Fecha",
      "label.area": "Área",
      "label.date": "Fecha",
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
      "footer.rights": "© Todos los derechos reservados"
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
      "statement.title": "To design is<br>to give life<br>to new<br>universes.",
      "statement.caption": "The most valuable tools we have within ourselves are imagination and creativity. With these, we can give shape to things so that the world gets to know them.",
      "works.title": "Works",
      "works.note": "Works, series and records.",
      "works.category": "work",
      "works.cat.savia": "Integral Design Thesis",
      "works.cat.migrar": "Audiovisual Installation",
      "works.cat.encanto": "Fashion Collection",
      "works.cat.hilvan": "Artisan Curation",
      "works.cat.diary": "Illustration and Photography",
      "works.project.diary": "Diary of a Tattoo Anthology",
      "works.meta.savia": "Integral Design Thesis<br>2025",
      "works.meta.migrar": "Audiovisual Installation<br>2025",
      "works.meta.encanto": "Fashion Collection<br>2025",
      "works.meta.hilvan": "Artisan Curation<br>2025",
      "works.meta.diary": "Illustration and Photography<br>2023",
      "arts.title": "Arts & Photography",
      "arts.note": "Series, images and visual archives.",
      "arts.category": "arts & photography",
      "arts.cat.surreal": "Painting<br>2026",
      "arts.cat.chalten": "Photography<br>2024",
      "arts.cat.isla": "Embroidery<br>2024",
      "arts.cat.azul": "Printmaking<br>2022",
      "arts.cat.dreaming": "Graphic and Textile Design<br>2022",
      "arts.project.formas": "Forms that Accompany the Body",
      "arts.project.superficies": "Surfaces and Transformations",
      "arts.project.intersecciones": "Intersections",
      "arts.project.surreal": "Surreal Landscape of Childhood",
      "arts.project.chalten": "El Chaltén",
      "arts.project.isla": "Isla Paraíso",
      "arts.project.azul": "Azul",
      "arts.project.dreaming": "The Infinite Forms of Dreaming",
      "arts.cat.formas": "Jewelry<br>2026",
      "arts.cat.superficies": "Photography<br>2026",
      "arts.cat.intersecciones": "Paintings<br>2026",
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
      "courses.item7": "Contemporary Jewelry - Patricia Galucci",
      "courses.item8": "Jewelry Intensive - Taller Eloi",
      "courses.item9": "How to Live from Art - BADA Argentina",
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
      "project.chalten.title": "El Chaltén",
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
      "project.superficies.area": "Photography",
      "project.superficies.date": "2026",
      "project.formas.title": "Forms that Accompany the Body",
      "project.formas.area": "Jewelry",
      "project.formas.date": "2026",
      "project.intersecciones.title": "Intersections",
      "project.intersecciones.area": "Paintings",
      "project.intersecciones.date": "2026",
      "project.chalten.area": "Photography",
      "project.chalten.date": "2024",
      "project.surreal.area": "Painting",
      "project.surreal.date": "2026",
      "project.isla.area": "Embroidery",
      "project.isla.date": "2024",
      "project.azul.area": "Printmaking",
      "project.azul.date": "2022",
      "project.dreaming.title": "The Infinite Forms of Dreaming",
      "project.dreaming.area": "Graphic and textile design",
      "project.dreaming.date": "2022",
      "project.dreaming.selectedTitle": "Selected Piece",
      "project.dreaming.rugTitle": "Creation Of The Selected Piece Transformed Into A Rug",
      "project.savia.area": "Integral Design Thesis",
      "project.savia.date": "2025",
      "project.savia.intro": "This is a project which gives a voice to the nature and waters of the Microcentro. It is a movement, a manifestation that unfolds throughout the streets like an ecosystem offering spaces of wellbeing and rest to those who are seeking to survive day by day in the heart of Buenos Aires.",
      "project.savia.subtitle": "The voice of the ones who stay",
      "project.savia.render1": "A project that follows the traces of both users to understand their needs and act accordingly. Which spaces do they inhabit? How do they inhabit them? How can we accompany them in their movement?",
      "project.savia.render2": "Almost mimetically with the neighborhood’s own language, it unfolds and merges with the particular chaos fo the environment.",
      "project.savia.streetPieces": "Street Furniture Pieces",
      "project.savia.streetSeries": "Street furniture series",
      "project.savia.street.singleSupport": "Single ischial support",
      "project.savia.street.multipleSupport": "Multiple ischial support",
      "project.savia.street.singleSeat": "Single seat",
      "project.savia.street.multipleSeat": "Multiple seat",
      "project.savia.street.multipleBackrest": "Multiple seat with backrest",
      "project.savia.street.singleTable": "Single table",
      "project.savia.street.multipleTable": "Multiple table",
      "project.savia.street.highTable": "High table",
      "project.savia.street.ashtray": "Ashtray",
      "project.savia.shape": "Shape And Body / Single Seat Prototype",
      "project.savia.scale": "Scale Model",
      "project.savia.systemTitle": "Micro Version",
      "project.savia.systemCopy": "Structures that elevate nature, allowing plants to grow freely and unfold as they do in the forest.",
      "project.savia.microTitle": "Micro Version",
      "project.savia.microCopy": "In the heart of the city, a garden of branching paths. There is a voice that is preserved over time in the neighborhood: one we must care for and keep alive. To look up, to encounter the Microcentro’s own nature. To become part of it, to unfold, to become an extension.",
      "project.savia.graphic42.kicker": "Traces",
      "project.savia.graphic42.side": "To feel in nature, to believe oneself a part of it.",
      "project.savia.graphic42.question": "What lies beneath the ground in the Microcentro? What is trying to grow?",
      "project.savia.graphic42.bottom": "A voice shared by workers and nature.",
      "project.savia.graphic43.a": "If they can’t go towards nature.",
      "project.savia.graphic43.b": "How do we take nature closer to them?",
      "project.savia.graphic43.c": "Following their traces without obstructing their path, creating traces for them, but this time in green.",
      "project.savia.graphic43.d": "How to rest while learning among the greenery and coexisting. Both nature and the worker leave their traces, help them coexist as peacefully as possible.",
      "project.savia.graphic43.e": "Real nature interventions.",
      "project.savia.graphic43.f": "Digital interventions/nature generators to promote its importance.",
      "project.savia.graphic43.g": "Spaces that, through reflection and sun placement, concentrate warmth in winter and coolness in summer.",
      "project.savia.configuratorTitle": "Web Link To The Configurator",
      "project.savia.configuratorCopy": "This web configurator was developed for anyone to explore Savia’s system and to dispose every part as they want to. Customising new ways and bringing it to life. Savia begins in the urban area of Microcentro in Buenos Aires, but this shows it can spread to any part of the world.",
      "project.savia.analog": "Analog Series ‘To Look Up’ / Microcentro 1995",
      "project.savia.logbook": "Logbook / Thesis Process",
      "project.savia.books": "Street Furniture Books",
      "project.savia.memoirs": "Postal Memoirs",
      "project.savia.footerTitle": "TO LOOK UP",
      "project.savia.partner": "PROJECT PARTNER",
      "project.migrar.area": "Audiovisual Installation",
      "project.migrar.date": "2025",
      "project.migrar.subtitle": "To depart from one’s habitat towards somewhere else",
      "project.migrar.intro": "To migrate is the act of growing, of changing, of transforming. One is born in a safe, familiar space. This experience is adapted, reconstructed, and complemented by the way one is raised, how one learns to socialize, and how one encounters the outside world.",
      "project.migrar.map.path": "Path",
      "project.migrar.map.travel": "Travel",
      "project.migrar.map.community": "Community",
      "project.migrar.map.individuality": "Individuality",
      "project.migrar.map.leave": "Leave",
      "project.migrar.map.movement": "Movement",
      "project.migrar.map.lightness": "Lightness",
      "project.migrar.map.trace": "Trace",
      "project.migrar.map.change": "Change",
      "project.migrar.map.levitate": "Levitate",
      "project.migrar.map.mutate": "Mutate",
      "project.migrar.map.branch": "Branch",
      "project.migrar.map.fly": "Fly",
      "project.migrar.soulTitle": "What Happens To The Soul That Migrates",
      "project.migrar.soul1": "To relive those moments in life when we are called to migrate. Sometimes by choice, other times not. From the moment of creation, through development, and into the transformation of a being.",
      "project.migrar.soul2": "A curiosity, a desire to evolve, to become something more, to reinvent oneself, drives one to migrate. To venture into the unknown, to carve a path toward other forms. To understand new realities, to question what is established, to revolutionize, to multiply, to migrate leaving a trail.",
      "project.migrar.watch": "Watch Project",
      "project.migrar.partners": "Project Partners",
      "project.encanto.copy1": "In this project, a summer clothing collection was developed based on a concept and a city from around the world. The proposal merges both universes and translates them into textures, materials, colors, and shapes that interact with each other.",
      "project.encanto.copy2": "On the one hand, the industrial world of the subway: the broken, dirty, and worn elements, where the rhythm is fast-paced and dark. On the other hand, the charm of Edinburgh is used to represent the delicate side of royalty: floral, luminous, and subtle elements.",
      "project.encanto.conceptLabel": "Concept",
      "project.encanto.conceptValue": "Subway",
      "project.encanto.cityLabel": "City",
      "project.encanto.cityValue": "Edinburgh",
      "project.encanto.mood.wear": "wear",
      "project.encanto.mood.irregular": "irregular",
      "project.encanto.mood.mystery": "mystery",
      "project.encanto.mood.linear": "linear patterns",
      "project.encanto.mood.delicacy": "delicacy",
      "project.encanto.mood.dirt": "dirt",
      "project.encanto.mood.transparencies": "transparencies",
      "project.encanto.mood.dreams": "dreams",
      "project.encanto.mood.broken": "broken",
      "project.encanto.mood.darkness": "darkness",
      "project.encanto.mood.texture": "texture",
      "project.encanto.mood.moss": "moss",
      "project.encanto.mood.lights": "artificial lights",
      "project.encanto.secretShorts": "Secret Shorts",
      "project.encanto.invitationTitle": "Invitation",
      "project.encanto.inviteName": "Miss Agustina Cattánea",
      "project.encanto.inviteLine1": "is cordially invited to attend",
      "project.encanto.inviteLine2": "the presentation of the collection",
      "project.encanto.inviteSeason": "Spring - Summer SS26",
      "project.encanto.inviteDate": "Friday, November 28, 5:30 PM",
      "project.encanto.inviteSeat": "VIP - Front Row",
      "project.encanto.partners": "Project Partners",
      "project.encanto.partnerNames": "Mora Jauregui and Matilda Alabes",
      "project.encanto.area": "Fashion Collection",
      "project.encanto.date": "2025",
      "project.hilvan.title": "Hilván",
      "project.hilvan.subtitle": "[A seam of long loose stitches]",
      "project.hilvan.area": "Artisan Curation",
      "project.hilvan.date": "2025",
      "project.hilvan.intro1": "A project that brings together the unique act of making with our own hands. Putting our bodies, experimenting with materiality, texture, and the value found within this gestures. The desire of our Hilván is to give shape to a project that fuses matter and thread, and to inspire others to keep manual practices alive.",
      "project.hilvan.intro2": "Each of the pieces created seek to recover the meaning of handmaking, something we often overlook today due to the advancements of technology and the ease with which it solves our needs. One of its consequences is that we have begun to forget all that we are capable of making with our hands.",
      "project.hilvan.identity": "Identity System",
      "project.hilvan.archive": "Concept And Archive Book",
      "project.hilvan.archiveCopy": "An editorial piece that gathers the conceptual universe of the project, its objects, references, and material decisions.",
      "project.hilvan.invitation": "Invitations for Artisans",
      "project.hilvan.postal": "Postal Memoir",
      "project.hilvan.textile": "Textile And Concept Textile Pieces",
      "project.hilvan.footerTitle": "HILVÁN",
      "project.hilvan.partner": "PROJECT PARTNER",
      "project.hilvan.partnerName": "Elisa Cipriani",
      "project.hilvan.subfooterQuote": "As the Chilean poet and textile artist Cecilia<br>Vicuña says: “The thread weaves the world.”",
      "project.hilvan.subfooterPartner": "PROJECT PARTNER",
      "project.hilvan.artisansTitle": "Artisans in Argentina",
      "project.hilvan.artisansCopy1": "Beings who create from the roots of our land and raw materials. Textures, colors, and forms inspire them to create.",
      "project.hilvan.artisansCopy2": "We therefore propose a gathering, held for the first time in Buenos Aires, where artisans and artists come together to create, inspire, and share.",
      "project.hilvan.workshopsCopy": "Workshops on both days. Be part of it!",
      "project.hilvan.exchangeCopy": "Everyone invited to share and exchange knowledge.",
      "project.hilvan.stampTitle": "Personalized Identity Stamp for Artisans",
      "project.hilvan.fanzineTitle": "Handcrafted Fanzine",
      "project.hilvan.fanzineCopy1": "This piece was fully handmade by Elisa for the project. The piece was created through collage, using cutouts from garments in the collection and textiles. The intention behind its creation was to transform the fanzine into a piece fused with clothing, something collectible and memorable.",
      "project.hilvan.fanzineCopy2": "The author sought to reinvent and reconceptualize the objects presented. Things are what we perceive them to be; we are the ones who assign them value. So let's give them a meaning, and share them with the world so they can be seen, and appreciated.",
      "project.hilvan.cyanotypeTitle": "Handmade Cyanotype Textile Pieces",
      "project.hilvan.handmadeShirtTitle": "Handmade Shirt",
      "project.hilvan.handmadeShirtCopy1": "This piece was entirely hand-knitted and constructed by Elisa, stitch by stitch. Its form is inspired by the quillangos, traditional garments used by the Indigenous peoples of southern Argentina to protect themselves from the harsh Patagonian cold.",
      "project.hilvan.handmadeShirtCopy2": "The oversized hood recalls its maternal function: women carried their babies within it, turning the garment into shelter and bond. The blue basting stitches reference the name of the project. In this way, the piece becomes an act of memory and respect for Argentina’s Indigenous communities, the true keepers of ancestral handcrafts.",
      "project.diary.title": "Diary of a Tattoo Anthology",
      "project.diary.areaLabel": "Area",
      "project.diary.areaValue": "Illustration and Photography",
      "project.diary.dateLabel": "Date",
      "project.diary.dateValue": "2023",
      "project.diary.copy1": "This is a creative piece composed with the intention of reproducing -through possible tattoo designs or sketches- the ideas that may arise in the mind of someone who imagines through drawings.",
      "project.diary.copy2": "This piece is presented as the first journal of a manifestation that combines analog photography and drawings made on paper with fine markers, later digitized to compose a narrative that unfolds in the realm of the unconscious. The work does not end when the last page is read; rather, it begins to unfold in the lives of those who interact with it, opening the possibility for the beginning of a Series 2.",
      "project.diary.caption1": "Where do they come from, and where are they going?",
      "project.diary.caption2": "As a piece of music,",
      "project.diary.caption3": "as a part of some dream, as a way of telling stories,",
      "project.diary.caption4": "as an aesthetic signature of certain individuals, they will remain as noble bearers of love.",
      "project.diary.caption5": "They will open spaces where curiosity can take root,",
      "project.diary.caption6": "they will grow within nature,",
      "project.diary.caption7": "exploring spaces beyond the traditional art world, transcending time and space,",
      "project.diary.caption8": "commemorating what now rests, upon the skin of those who dare to carry these amulets,",
      "project.diary.caption9": "new possible worlds begin to emerge on the most precious of canvases.",
      "label.section": "Area",
      "label.series": "Area",
      "label.material": "Date",
      "label.area": "Area",
      "label.date": "Date",
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

  function getStoredLanguage() {
    try {
      const storedLanguage = localStorage.getItem(storageKey);
      return copy[storedLanguage] ? storedLanguage : null;
    } catch (error) {
      return copy[window.__elisaLanguage] ? window.__elisaLanguage : null;
    }
  }

  function readLanguage() {
    const urlLanguage = new URLSearchParams(window.location.search).get("lang");
    const storedLanguage = getStoredLanguage();

    if (copy[urlLanguage]) {
      saveLanguage(urlLanguage);
      return urlLanguage;
    }

    if (storedLanguage) {
      return storedLanguage;
    }

    return "es";
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

  function getInternalUrl(link) {
    const href = link.getAttribute("href");

    if (!href || href.startsWith("#") || link.target || /^mailto:|^tel:/i.test(href)) {
      return null;
    }

    const url = new URL(href, window.location.href);

    if (url.protocol !== "file:" && url.origin !== window.location.origin) {
      return null;
    }

    return url;
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

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");

    if (!link || link.matches("[data-set-lang], [data-lang-link]")) {
      return;
    }

    const currentLanguage = document.documentElement.lang || readLanguage() || "es";
    const url = getInternalUrl(link);

    if (!url) {
      return;
    }

    url.searchParams.set("lang", currentLanguage);
    link.setAttribute("href", url.href);
  }, true);

  window.addEventListener("pageshow", () => {
    setLanguage(readLanguage() || "es");
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setLanguage(readLanguage() || "es"), { once: true });
  } else {
    setLanguage(readLanguage() || "es");
  }
}());
