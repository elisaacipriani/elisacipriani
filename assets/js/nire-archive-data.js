(function(){
  "use strict";
  // Textos de autora: usar solo las palabras que Elisa proporcionó, sin ampliarlas.
  // Donde no haya relato, dejar paragraphs vacío. Traducir sin añadir ideas.
  const root="assets/images/nire/";
  window.NireArchiveItems=[
    {id:"amapola",letter:"A",number:"01",image:root+"archive/drawings/dibujo-02.svg",imageStatus:"original",related:["granada","caballito","piedra"],
      es:{word:"Amapola",title:"El llanto de una amapola",medium:"Dibujo de Elisa Cipriani",imageNote:"",imageAlt:"Dibujo en tinta negra de formas florales entrelazadas.",tags:["dulzura","agua","imaginación"],paragraphs:["A veces las plantas también lloran.","Eso se llama néctar y, según como me lo imagino, tiene un gustito dulce."]},
      en:{word:"Poppy",title:"A poppy’s tear",medium:"Drawing by Elisa Cipriani",imageNote:"",imageAlt:"An ink drawing of interwoven floral forms.",tags:["sweetness","water","imagination"],paragraphs:["Sometimes plants cry, too.","That is called nectar and, as I imagine it, it tastes a little sweet."]}},
    {id:"granada",letter:"G",number:"03",image:root+"archive/granada.gif",imageStatus:"animation",sourceUrl:"https://78.media.tumblr.com/49f0098d8c06ce889ba0ffa373dfd453/tumblr_p3jxv5Xns41qj7kyho1_500.gif",related:["amapola","piedra"],
      es:{word:"Granada",title:"Algo así como una burbuja",medium:"GIF animado",imageNote:"",imageAlt:"Animación de tres granadas sobre una superficie clara.",tags:["boca","color","sensación"],paragraphs:["La sensación de morder el gajito de una granada, cuando explota, fucsia, adentro de la boca."]},
      en:{word:"Pomegranate",title:"Something like a bubble",medium:"Animated GIF",imageNote:"",imageAlt:"An animation of three pomegranates on a light surface.",tags:["mouth","colour","sensation"],paragraphs:["The feeling of biting into a pomegranate seed as it bursts, fuchsia, inside your mouth."]}},
    {id:"caballito",letter:"H",number:"04",image:root+"archive/drawings/caballito-de-mar.svg",imageStatus:"original",related:["amapola"],
      es:{word:"Hoja",title:"En el mundo de un caballito de mar",medium:"Dibujo de Elisa Cipriani",imageNote:"",tags:["dibujo","transformación","ficción"],paragraphs:["La hoja de una planta en el mundo de un caballito de mar."]},
      en:{word:"Leaf",title:"In the world of a seahorse",medium:"Drawing by Elisa Cipriani",imageNote:"",tags:["drawing","transformation","fiction"],paragraphs:["A plant’s leaf in the world of a seahorse."]}},
    {id:"piedra",letter:"P",number:"05",image:root+"archive/piedra.jpg",imageStatus:"photograph",related:["granada","amapola"],
      es:{word:"Piedra",title:"Piedra",medium:"Fotografía / objetos encontrados / memoria",imageNote:"El Chaltén. Detalle de una piedra.",imageAlt:"Detalle de una roca con capas de minerales rojizos y cristales claros.",tags:["coleccionar","brillo","vidrio","memoria"],paragraphs:["Desde que soy chiquita tengo una especie de obsesión con el brillo. Los objetos recolectables.","Una vez levanté un chicle de la calle y me lo comí. Ese tipo de cosas me encanta. Cosas que encuentro y me puedo llevar conmigo.","En la playa siempre recolecté vidrios de esos que están hace mucho tiempo. Hay verdes, de todas las tonalidades, azules, marrones, blancos, etc.","Así lo mismo con los minerales. Mi cuarto tiene una colección infinita."]},
      en:{word:"Stone",title:"Stone",medium:"Photograph / found objects / memory",imageNote:"El Chaltén. A detail of a stone.",imageAlt:"A close-up of a rock with reddish mineral layers and pale crystals.",tags:["collecting","shine","glass","memory"],paragraphs:["Since I was little, I have had a kind of obsession with shine. Collectible objects.","Once I picked up a piece of chewing gum from the street and ate it. I love that kind of thing. Things I find and can take with me.","At the beach I have always collected glass that has been there for a long time. There are greens, in every shade, blues, browns, whites, etc.","The same with minerals. My room has an endless collection."]}},
    {id:"primera-piel",letter:"P",number:"06",image:root+"archive/primera-piel.jpg",imageStatus:"photograph",related:[],
      es:{word:"Primera piel",title:"Primera piel",medium:"",imageNote:"",imageAlt:"Una persona sentada de espaldas tomando sol en un parque de Berlín.",tags:["piel","Berlín","viaje"],paragraphs:["Quien anda desnudo tiene una ventaja en esta vida: se enfrenta con su primera piel ante las cosas.","En un viaje de aquellos que por suerte me tocó hacer con mi mamá descubrí que en Berlín, durante el verano, la gente toma sol desnuda, y espero algún día volver para poder hacerlo."]},
      en:{word:"First skin",title:"First skin",medium:"",imageNote:"",imageAlt:"A person sitting with their back to the camera, sunbathing in a Berlin park.",tags:["skin","Berlin","travel"],paragraphs:["Whoever goes naked has an advantage in this life: they face things in their first skin.","On one of those trips I was lucky enough to take with my mum, I discovered that in Berlin, during the summer, people sunbathe naked, and I hope to go back someday so I can do it."]},
      references:[
        {image:root+"archive/references/robert-mapplethorpe-desnudo-01.png",
          es:{alt:"Fotografía de un hombre desnudo de pie, con un brazo levantado.",lines:["Robert Mapplethorpe"]},
          en:{alt:"A photograph of a nude man standing with one arm raised.",lines:["Robert Mapplethorpe"]}},
        {image:root+"archive/references/robert-mapplethorpe-desnudo-02.png",
          es:{alt:"Fotografía de un desnudo visto de espaldas sobre una plataforma cubierta con una tela estampada.",lines:["Robert Mapplethorpe"]},
          en:{alt:"A photograph of a nude figure seen from behind on a platform covered with patterned fabric.",lines:["Robert Mapplethorpe"]}}
      ]}
  ];
  window.NireArchiveItems.push(
    {id:"flores-de-mama",letter:"F",number:"08",image:root+"archive/flores-de-mama/flor-01.jpg",imageStatus:"gallery",related:[],galleryFocus:3,galleryBase:root+"archive/flores-de-mama/",
      gallery:[
        {file:"flor-02.jpg",width:665,height:1182,crop:[215,220,205,670],size:105,offset:26,es:"Dibujo de un tallo con flores pequeñas.",en:"A drawing of a stem with small flowers."},
        {file:"registro-01.jpg",width:3024,height:4032,rotate:-90,crop:[430,590,3500,2080],size:350,offset:45,es:"Recorte de una hoja con flores dibujadas a lapicera y lápiz.",en:"A detail of a sheet of paper with flowers drawn in pen and pencil."},
        {file:"flor-01.jpg",width:665,height:1182,crop:[205,425,245,375],size:128,offset:78,es:"Dibujo de un tallo con tres flores abiertas.",en:"A drawing of a stem with three open flowers."},
        {file:"registro-03.jpg",width:3024,height:4032,crop:[270,830,2380,2590],size:290,offset:-14,es:"Flores dibujadas a lápiz sobre una hoja de papel.",en:"Flowers drawn in pencil on a sheet of paper."},
        {file:"flor-05.jpg",width:665,height:1182,crop:[215,260,255,740],size:120,offset:6,es:"Dibujo de un tallo con flores y capullos.",en:"A drawing of a stem with flowers and buds."},
        {file:"registro-04.jpg",width:3024,height:4032,crop:[110,950,2800,1630],size:355,offset:57,es:"Recorte de una hoja con grupos de flores y anotaciones manuscritas.",en:"A detail of a sheet of paper with groups of flowers and handwritten notes."},
        {file:"flor-03.jpg",width:665,height:1182,crop:[210,310,245,515],size:130,offset:-26,es:"Dibujo de un tallo con flores y pétalos sueltos.",en:"A drawing of a stem with flowers and scattered petals."},
        {file:"registro-02.jpg",width:3024,height:4032,crop:[120,1190,2820,1030],size:345,offset:32,es:"Una hilera de flores a lápiz, conservando la textura y las notas de la hoja.",en:"A row of pencil flowers, with the texture and notes of the paper preserved."},
        {file:"flor-04.jpg",width:638,height:360,crop:[105,105,445,135],size:250,offset:72,es:"Dibujo de una hilera de flores pequeñas.",en:"A drawing of a row of small flowers."},
        {file:"registro-05.jpg",width:768,height:1024,crop:[100,295,510,680],es:"Papel rasgado con flores rosas, naranjas y violetas sobre una mesa de madera.",en:"Torn paper with pink, orange and violet flowers on a wooden table."}
      ],
      es:{word:"Flores",title:"Las flores de mamá",medium:"",imageNote:"",imageAlt:"Galería horizontal de los dibujos de flores de mamá y sus registros en papel.",tags:["flores","mamá","jardín"],paragraphs:["Alguien tenía que ocuparse de armar un jardín con todas las flores que dibuja mamá cuando habla por teléfono."]},
      en:{word:"Flowers",title:"Mum’s flowers",medium:"",imageNote:"",imageAlt:"A horizontal gallery of Mum’s flower drawings and photographs of the original paper.",tags:["flowers","mum","garden"],paragraphs:["Someone had to put together a garden with all the flowers Mum draws while she talks on the phone."]}}
  );

  window.NireArchiveItems.push(
    {id:"liquenes",letter:"L",number:"09",image:root+"archive/liquenes.jpg",imageWidth:1024,imageHeight:768,imageStatus:"photograph",related:[],
      photographs:[
        {image:root+"archive/liquenes/registro-01.jpg",width:1024,height:768,es:{alt:"Detalle de líquenes oscuros sobre una roca clara."},en:{alt:"A close-up of dark lichens on a pale rock."}},
        {image:root+"archive/liquenes/registro-02.jpg",width:1024,height:768,es:{alt:"Una roca grande con patrones de líquenes y un bosque al fondo."},en:{alt:"A large rock with lichen patterns and a forest in the background."}},
        {image:root+"archive/liquenes/registro-03.jpg",width:1024,height:768,es:{alt:"Una piedra con líquenes ramificados entre grava y otras rocas."},en:{alt:"A stone with branching lichens among gravel and other rocks."}}
      ],
      es:{word:"Líquenes",title:"Líquenes",medium:"",imageNote:"",imageAlt:"Detalle de una piedra con patrones oscuros de líquenes entre otras rocas.",tags:["líquenes","piedra"],paragraphs:["Los líquenes también pueden crecer sobre las piedras y expandirse como raíces. Sobre ellas, también pueden morir."]},
      en:{word:"Lichens",title:"Lichens",medium:"",imageNote:"",imageAlt:"A close-up of a stone with dark lichen patterns among other rocks.",tags:["lichens","stone"],paragraphs:["Lichens can also grow on stones and spread like roots. They can also die on them."]}}
  );

  const leidenSource="https://es.wikipedia.org/wiki/Archivo:Anatomical_theatre_Leiden.jpg";
  window.NireArchiveItems.push(
    {id:"teatro-anatomico-leiden",letter:"T",number:"10",image:root+"archive/teatro-anatomico-leiden.jpg",imageStatus:"photograph",sourceUrl:leidenSource,related:[],
      es:{word:"Teatro anatómico",title:"Teatro anatómico de Leiden",medium:"",imageNote:"",imageAlt:"Grabado del teatro anatómico de Leiden, con gradas circulares, esqueletos y una mesa de disección central.",tags:["teatro anatómico","gabinete de curiosidades"],paragraphs:[
        "Esta pieza es obra de Willem Swanenburgh de 1610. Muestra el célebre teatro anatómico de la Universidad de Leiden en los Países Bajos.",
        "En 1594, este espacio no solo funcionaba como una sala de estudio médico interactiva para la disección de cadáveres. El anfiteatro se transformaba en una suerte de gabinete de curiosidades y atracción turística abierta al público.",
        "Como se aprecia en la imagen, las gradas circulares se poblaban de esqueletos humanos y de animales colocados en poses dinámicas, muchos de los cuales sostenían banderas con inscripciones latinas que funcionaban como advertencias morales y recordatorios del Memento Mori (recuerda que vas a morir) y el Nosce te ipsum (conócete a ti mismo)."
      ],formatting:[
        {text:"teatro anatómico de la Universidad de Leiden",tag:"strong",href:leidenSource},
        {text:"gabinete de curiosidades y atracción turística",tag:"strong"},
        {text:"Memento Mori",tag:"em"},{text:"Nosce te ipsum",tag:"em"}
      ]},
      en:{word:"Anatomical theatre",title:"Leiden anatomical theatre",medium:"",imageNote:"",imageAlt:"An engraving of Leiden’s anatomical theatre, with circular tiers, skeletons and a central dissection table.",tags:["anatomical theatre","cabinet of curiosities"],paragraphs:[
        "This piece is a work by Willem Swanenburgh from 1610. It shows the famous anatomical theatre of Leiden University in the Netherlands.",
        "In 1594, this space did not only function as an interactive medical study room for dissecting corpses. The amphitheatre would become a kind of cabinet of curiosities and tourist attraction open to the public.",
        "As can be seen in the image, the circular tiers were filled with human and animal skeletons arranged in dynamic poses, many of which held flags with Latin inscriptions that served as moral warnings and reminders of Memento Mori (remember that you will die) and Nosce te ipsum (know thyself)."
      ],formatting:[
        {text:"anatomical theatre of Leiden University",tag:"strong",href:leidenSource},
        {text:"cabinet of curiosities and tourist attraction",tag:"strong"},
        {text:"Memento Mori",tag:"em"},{text:"Nosce te ipsum",tag:"em"}
      ]}}
  );

  window.NireArchiveItems.push(
    {id:"sistema-nervioso",letter:"S",number:"11",image:root+"archive/sistema-nervioso/barbara-brandli-sin-titulo.png",imageWidth:350,imageHeight:512,imageStatus:"photograph",related:[],
      photographs:[
        {image:root+"archive/sistema-nervioso/pandemia-01.jpg",width:1086,height:724,es:{alt:"Un perro en primer plano y una persona con barbijo caminando por una calle."},en:{alt:"A dog in the foreground and a person wearing a face mask walking along a street."}},
        {image:root+"archive/sistema-nervioso/pandemia-02.jpg",width:1102,height:712,es:{alt:"Una persona sonriendo detrás de una cortina de baño."},en:{alt:"A person smiling from behind a shower curtain."}},
        {image:root+"archive/sistema-nervioso/pandemia-03.jpg",width:1102,height:713,es:{alt:"Formas claras y oscuras en una fotografía de textura granulada."},en:{alt:"Light and dark forms in a grainy photograph."}},
        {image:root+"archive/sistema-nervioso/pandemia-04.jpg",width:1086,height:724,es:{alt:"Una habitación a contraluz, con una persona sobre una cama y un gato en la ventana."},en:{alt:"A backlit room with a person on a bed and a cat at the window."}},
        {image:root+"archive/sistema-nervioso/pandemia-05.jpg",width:1086,height:724,es:{alt:"Dos personas junto a un muro frente al mar, con palmeras al fondo."},en:{alt:"Two people beside a wall facing the sea, with palm trees in the background."}},
        {image:root+"archive/sistema-nervioso/pandemia-06.jpg",width:1086,height:724,es:{alt:"Un local lleno de esculturas, bustos y objetos decorativos."},en:{alt:"A shop filled with sculptures, busts and decorative objects."}},
        {image:root+"archive/sistema-nervioso/pandemia-07.jpg",width:1086,height:724,es:{alt:"Dos burros en primer plano."},en:{alt:"Two donkeys in close-up."}},
        {image:root+"archive/sistema-nervioso/pandemia-08.jpg",width:1086,height:724,es:{alt:"Una habitación con cortinas y una persona junto a una puerta vidriada."},en:{alt:"A room with curtains and a person beside a glass door."}},
        {image:root+"archive/sistema-nervioso/pandemia-09.jpg",width:1086,height:724,es:{alt:"Un auto y un burro sobre un camino rodeado de árboles y arbustos."},en:{alt:"A car and a donkey on a road surrounded by trees and shrubs."}}
      ],
      es:{word:"Sistema Nervioso",title:"Sin título / Sistema Nervioso",artworkCredit:"Barbara Brändli",medium:"",imageNote:"",imageAlt:"Fotografía de una pared con la inscripción «YO QUIERO SER», de Barbara Brändli.",tags:["pandemia","nostalgia","introspección"],paragraphs:[
        "Esta obra es parte de su trabajo Sistema Nervioso. Esta pieza es sin título.",
        "Pero me hizo acordar a una serie de fotos y a un momento de nostalgia e introspección, tan raro, que fue la pandemia.",
        "Tiempos de desaceleración, miedo y mucho espacio para conocerse a sí mismo."
      ]},
      en:{word:"Sistema Nervioso",title:"Untitled / Sistema Nervioso",artworkCredit:"Barbara Brändli",medium:"",imageNote:"",imageAlt:"A photograph of a wall bearing the words ‘YO QUIERO SER’, by Barbara Brändli.",tags:["pandemic","nostalgia","introspection"],paragraphs:[
        "This work is part of her project Sistema Nervioso. This piece is untitled.",
        "But it reminded me of a series of photographs and of such a strange moment of nostalgia and introspection: the pandemic.",
        "Times of slowing down, fear and plenty of space to get to know oneself."
      ]}}
  );

  window.NireArchiveItems.push(
    {id:"las-metamorfosis",letter:"M",number:"12",image:root+"archive/las-metamorfosis/retrato-01.jpg",imageStatus:"gallery",sourceUrl:"https://malba.org.ar/evento/madalena-schwartz-las-metamorfosis/",related:[],galleryBase:root+"archive/las-metamorfosis/",
      gallery:[
        {file:"retrato-01.jpg",width:750,height:507,es:"Dos personas con maquillaje escénico, con los rostros muy cerca.",en:"Two people in theatrical makeup with their faces close together."},
        {file:"retrato-02.jpg",width:800,height:537,es:"Dos personas riéndose, con pestañas brillantes.",en:"Two people laughing, with glittering eyelashes."},
        {file:"retrato-03.jpg",width:550,height:363,es:"Dos personas se tocan las manos frente a una pared clara.",en:"Two people touch hands in front of a pale wall."},
        {file:"retrato-04.jpg",width:630,height:634,es:"Dos personas con tocados y plumas posan junto a una ventana.",en:"Two people in headpieces and feathers pose beside a window."},
        {file:"retrato-05.jpg",width:630,height:635,es:"Dos personas con maquillaje escénico posan juntas sobre una cama.",en:"Two people in theatrical makeup pose together on a bed."},
        {file:"retrato-06.jpg",width:1200,height:1208,es:"Una persona con zapatos de plataforma posa sobre un taburete.",en:"A person in platform shoes poses on a stool."},
        {file:"retrato-07.jpg",width:750,height:1000,es:"Una persona con un tocado de plumas posa sentada, con una figura en movimiento detrás.",en:"A seated person in a feathered headpiece poses with a figure in motion behind them."}
      ],
      es:{word:"Metamorfosis",title:"Las metamorfosis",artworkCredit:"Madalena Schwartz",medium:"",imageNote:"",imageAlt:"Galería de siete fotografías de la exposición Las metamorfosis, de Madalena Schwartz.",tags:["fotografía","San Pablo","años 70"],paragraphs:["Las metamorfosis, dedicada al ensayo fotográfico en el que Madalena Schwartz (Budapest, 1921 – San Pablo, 1993) retrató a las travestis y transformistas que frecuentaban la escena alternativa de San Pablo durante la primera mitad de la década de 1970, en plena dictadura militar."],formatting:[{text:"Las metamorfosis",tag:"em"}]},
      en:{word:"Metamorphoses",title:"The Metamorphoses",artworkCredit:"Madalena Schwartz",medium:"",imageNote:"",imageAlt:"A gallery of seven photographs of The Metamorphoses exhibition by Madalena Schwartz.",tags:["photography","São Paulo","1970s"],paragraphs:["The Metamorphoses, dedicated to the photographic essay in which Madalena Schwartz (Budapest, 1921 – São Paulo, 1993) portrayed the travestis and drag performers who frequented São Paulo’s alternative scene during the first half of the 1970s, under the military dictatorship."],formatting:[{text:"The Metamorphoses",tag:"em"}]}}
  );

  window.NireArchiveItems.push(
    {id:"fernanda-laguna",letter:"F",number:"13",image:root+"archive/fernanda-laguna.jpg",imageWidth:1024,imageHeight:768,imageStatus:"photograph",related:[],
      photographs:[
        {image:root+"archive/fernanda-laguna/encuentro-02.jpg",width:768,height:1024,es:{alt:"Una tela con flores y texto, colgada sobre una pared."},en:{alt:"A piece of fabric with flowers and text, hanging on a wall."}},
        {image:root+"archive/fernanda-laguna/encuentro-03.jpg",width:360,height:480,es:{alt:"Una obra de forma redondeada con una nota escrita, colgada en una pared."},en:{alt:"A rounded artwork with a handwritten note, hanging on a wall."}},
        {image:root+"archive/fernanda-laguna/encuentro-04.jpg",width:768,height:1024,es:{alt:"Una abertura cuadrada en una pared permite ver una persona sentada y una instalación con papeles colgantes."},en:{alt:"A square opening in a wall reveals a seated person and an installation with hanging papers."}}
      ],
      es:{word:"Fernanda Laguna",title:"Fernanda Laguna",medium:"",imageNote:"",imageAlt:"Fotografía de una instalación con figuras blancas y elementos suspendidos, en una exposición de Fernanda Laguna.",tags:["Diseño","universidad","arte","poesía"],paragraphs:["Tuve la suerte de que la primera vez que fui a la Universidad Torcuato Di Tella, aquella que pronto se convirtió en el lugar donde estudié Diseño, fue a ver una expo de Fernanda Laguna. Primera vez además, que la escuché nombrar. Militante, artista, poeta y ser que hoy se me presenta como referente.","En el futuro me la seguí encontrando en lugares y cada día la quiero más."]},
      en:{word:"Fernanda Laguna",title:"Fernanda Laguna",medium:"",imageNote:"",imageAlt:"A photograph of an installation with white figures and suspended elements in a Fernanda Laguna exhibition.",tags:["Design","university","art","poetry"],paragraphs:["I was lucky that the first time I went to Universidad Torcuato Di Tella, which soon became the place where I studied Design, was to see an exhibition by Fernanda Laguna. It was also the first time I had heard her name. An activist, artist, poet and person I now look to as a reference.","Later on, I kept coming across her in places, and every day I love her more."]}}
  );

  window.NireArchiveItems.push(
    {id:"fuck-me",letter:"F",number:"14",image:root+"archive/fuck-me.jpg",imageStatus:"photograph",related:[],
      es:{word:"Fuck Me",title:"Fuck Me",artworkCredit:"Marina Otero",medium:"",imageNote:"",imageAlt:"Fotografía de una función de Fuck Me, con un grupo de intérpretes en el escenario y una proyección al fondo.",tags:["teatro","actuar"],paragraphs:["Esta foto es de la primera vez que vi Fuck Me, por Marina Otero. Después vi Love Me y Kill Me. Nada fue como esa primera vez. Me dieron ganas de volver a actuar."]},
      en:{word:"Fuck Me",title:"Fuck Me",artworkCredit:"Marina Otero",medium:"",imageNote:"",imageAlt:"A photograph of a performance of Fuck Me, with a group of performers onstage and a projection behind them.",tags:["theatre","acting"],paragraphs:["This photo is from the first time I saw Fuck Me, by Marina Otero. Afterwards I saw Love Me and Kill Me. Nothing was like that first time. It made me want to act again."]}}
  );

  const finsterlinLink="https://www.google.com/search?kgmid=%2Fm%2F09wgm8&q=Hermann+Finsterlin";
  window.NireArchiveItems.push(
    {id:"hermann-finsterlin",letter:"H",number:"15",image:root+"archive/hermann-finsterlin.jpg",imageStatus:"photograph",related:[],
      es:{word:"Hermann Finsterlin",title:"Hermann Finsterlin",medium:"",imageNote:"",imageAlt:"Dibujo de Hermann Finsterlin de una arquitectura imaginaria de formas onduladas.",tags:["arquitectura","diseño","facultad"],paragraphs:[
        "Este dibujo es una obra del arquitecto, pintor y escritor alemán Hermann Finsterlin (1887–1973), una figura central del expresionismo arquitectónico de principios del siglo XX.",
        "Fue una de las primeras cosas con las que me crucé en la facultad. Era una idea de boceto para una obra arquitectónica que por motivos obvios finalmente no se llegó a construir. Pero creo que fue mi primer encuentro con el diseño, donde comenzó el amor. Tanto que compartí la obra completa con mi terapeuta."
      ],formatting:[{text:"Hermann Finsterlin",href:finsterlinLink}]},
      en:{word:"Hermann Finsterlin",title:"Hermann Finsterlin",medium:"",imageNote:"",imageAlt:"A drawing by Hermann Finsterlin of an imaginary architecture with undulating forms.",tags:["architecture","design","university"],paragraphs:[
        "This drawing is a work by the German architect, painter and writer Hermann Finsterlin (1887–1973), a central figure in architectural Expressionism in the early twentieth century.",
        "It was one of the first things I came across at university. It was a sketch idea for an architectural work that, for obvious reasons, was never built. But I think it was my first encounter with design, where the love began. So much so that I shared the complete work with my therapist."
      ],formatting:[{text:"Hermann Finsterlin",href:finsterlinLink}]}}
  );

  window.NireArchiveItems.push(
    {id:"rollo-con-sales",letter:"R",number:"16",image:root+"archive/rollo-con-sales/rollo-01.jpg",imageStatus:"gallery",related:[],galleryFocus:0,galleryBase:root+"archive/rollo-con-sales/",
      gallery:[
        {file:"rollo-01.jpg",width:1086,height:724,crop:[0,0,1086,724],es:"Una orilla con personas y embarcaciones, atravesada por manchas circulares del rollo.",en:"A shore with people and boats, overlaid with circular marks from the film."},
        {file:"rollo-02.jpg",width:1086,height:724,crop:[0,0,1086,724],es:"Un lago parcialmente helado frente a árboles y edificios, con manchas circulares del rollo.",en:"A partly frozen lake in front of trees and buildings, with circular marks from the film."},
        {file:"rollo-03.jpg",width:1086,height:724,crop:[0,0,1086,724],es:"Vacas descansando sobre el pasto, bajo un patrón de manchas circulares.",en:"Cows resting on grass beneath a pattern of circular marks."},
        {file:"rollo-04.jpg",width:1086,height:724,crop:[0,0,1086,724],es:"Personas y un perro en un parque nevado, con manchas circulares sobre la imagen.",en:"People and a dog in a snowy park, with circular marks across the image."},
        {file:"rollo-05.jpg",width:1086,height:724,crop:[0,0,1086,724],es:"Figuras junto al agua en una fotografía desenfocada, atravesada por manchas circulares.",en:"Figures beside the water in an out-of-focus photograph, overlaid with circular marks."}
      ],
      es:{word:"Rollo",title:"Un rollo lleno de sales",medium:"",imageNote:"",imageAlt:"Galería de cinco fotografías de un rollo con manchas circulares.",tags:["rollo","sales","intervención"],paragraphs:["Todavía pienso en este rollo que se me llenó de sales. Era uno de esos rollos viejísimos de papá que encontré en alguna caja en casa. No sé si me gusta, pero me gusta la idea de que algo le haya pasado, de que haya sido intervenido."]},
      en:{word:"Film",title:"A roll of film full of salts",medium:"",imageNote:"",imageAlt:"A gallery of five photographs from a roll of film with circular marks.",tags:["film","salts","intervention"],paragraphs:["I still think about this roll of film that filled with salts. It was one of Dad’s really old rolls that I found in a box at home. I don’t know if I like it, but I like the idea that something happened to it, that it was intervened in."]}}
  );

  window.NireArchiveItems.push(
    {id:"si-queria",letter:"S",number:"17",image:root+"archive/si-queria/poster.jpg",imageWidth:1280,imageHeight:720,imageStatus:"video",video:root+"archive/si-queria/si-queria.mp4",related:[],
      photographs:[{image:root+"archive/si-queria.jpg",width:1920,height:1080,es:{alt:"Fotografía de Sí, quería: un vestido blanco con un corazón de tejido en una vitrina con arañas y telarañas."},en:{alt:"A photograph of Sí, quería: a white dress with a woven heart in a glass case with spiders and webs."}}],
      es:{word:"Sí, quería",title:"Sí, quería",artworkCredit:"Joaquín Sánchez",medium:"",imageNote:"",imageAlt:"Video de Sí, quería: un vestido blanco con un corazón de tejido en una vitrina con arañas y telarañas.",tags:["arañas","textil","Malba"],paragraphs:["Sí, quería x Joaquín Sánchez en el Malba. Las arañas estaban vivas. Sacaron la obra por cuestiones medioambientales y las liberaron en el Ecoparque de Palermo Chico."]},
      en:{word:"Sí, quería",title:"Sí, quería",artworkCredit:"Joaquín Sánchez",medium:"",imageNote:"",imageAlt:"A video of Sí, quería: a white dress with a woven heart in a glass case with spiders and webs.",tags:["spiders","textile","Malba"],paragraphs:["Sí, quería by Joaquín Sánchez at Malba. The spiders were alive. They removed the work for environmental reasons and released them in the Ecoparque in Palermo Chico."]}}
  );

  window.NireArchiveItems.push(
    {id:"momento-de-refes",letter:"M",number:"18",image:root+"archive/momento-de-refes.jpg",imageStatus:"photograph",related:[],
      es:{word:"Momento de refes",title:"Momento de refes",medium:"",imageNote:"",imageAlt:"Libros abiertos y publicaciones de arte e ilustración desplegados sobre una mesa de la facultad.",tags:["refes","facultad","diseño"],paragraphs:["Esta fue de las primeras veces que hubo momento de refes en la facultad. Desde ahí que el momento de refes es mi favorito en el mundo, gracias diseño."]},
      en:{word:"Reference time",title:"Reference time",medium:"",imageNote:"",imageAlt:"Open books and art and illustration publications spread across a table at university.",tags:["references","university","design"],paragraphs:["This was one of the first times we had a reference session at university. Since then, reference time has been my favourite thing in the world. Thank you, design."]}}
  );

  window.NireArchiveItems.push(
    {id:"the-singing-angels",letter:"T",number:"19",image:root+"archive/the-singing-angels.jpg",imageStatus:"photograph",related:[],
      es:{word:"The Singing Angels",title:"The Singing Angels",artworkCredit:"Hubert y Jan van Eyck",medium:"",imageNote:"",imageAlt:"Fotografía de The Singing Angels enmarcada, con un grupo de ángeles cantando ante un atril.",tags:["mujer","pintura"],paragraphs:["Como mujer, a veces la vida se siente un poco como The Singing Angels de Hubert y Jan van Eyck"],formatting:[{text:"The Singing Angels",tag:"em"}]},
      en:{word:"The Singing Angels",title:"The Singing Angels",artworkCredit:"Hubert and Jan van Eyck",medium:"",imageNote:"",imageAlt:"A photograph of the framed The Singing Angels, showing a group of angels singing at a lectern.",tags:["woman","painting"],paragraphs:["As a woman, life sometimes feels a little like The Singing Angels by Hubert and Jan van Eyck"],formatting:[{text:"The Singing Angels",tag:"em"}]}}
  );

  window.NireArchiveItems.push(
    {id:"la-lluvia",letter:"L",number:"20",image:root+"archive/la-lluvia/poster.jpg",imageWidth:1280,imageHeight:720,imageStatus:"video",video:root+"archive/la-lluvia/lluvia.mp4",related:[],
      photographs:[{image:root+"archive/la-lluvia.jpg",width:564,height:604,es:{alt:"El poema La lluvia, de Jorge Luis Borges, en la imagen original."},en:{alt:"Jorge Luis Borges’s poem La lluvia in the original image."}}],
      es:{word:"Lluvia",title:"La lluvia",artworkCredit:"Jorge Luis Borges",medium:"",imageNote:"",imageAlt:"Video de lluvia sobre un jardín, con árboles, plantas y una pileta.",tags:["poema","lluvia","Buenos Aires"],paragraphs:["Un poema de Borges por todo lo que está lloviendo en Buenos Aires."]},
      en:{word:"Rain",title:"La lluvia",artworkCredit:"Jorge Luis Borges",medium:"",imageNote:"",imageAlt:"A video of rain over a garden with trees, plants and a swimming pool.",tags:["poem","rain","Buenos Aires"],paragraphs:["A poem by Borges because it’s been raining so much in Buenos Aires."]}}
  );

  window.NireArchiveItems.push(
    {id:"bateria-popular",letter:"B",number:"02",image:root+"archive/bateria-popular.jpg",imageStatus:"photograph",related:[],
      es:{word:"Batería popular",title:"Batería popular",artworkCredit:"Objeto de la exposición Del cielo a casa, MALBA.",medium:"",imageNote:"",imageAlt:"Cacerola metálica abollada con su tapa, expuesta sobre una base de museo.",tags:["cacerola","percusión"],paragraphs:[],sections:[{title:"Cacerolazo",paragraphs:["La cacerola, utensilio emblema de las comidas populares, se convirtió en símbolo y batería de las protestas durante la crisis política y económica de 2001. La primera olla enlozada argentina se realizó en 1898 en Avellaneda, en la fábrica que luego sería Ferrum. Este recubrimiento las hace eternas y permite buena eficiencia energética para cocciones largas. La versión de aluminio pesado se instaló en los 80 con el modelo de venta directa, que hizo de las míticas Essen un objeto preciado de herencia familiar. De vuelta al hierro, las cacerolas de fundición Lafont brillan como un objeto de deseo para las cocinas contemporáneas."]}]},
      en:{word:"People’s drum kit",title:"People’s drum kit",artworkCredit:"An object from the exhibition Del cielo a casa, MALBA.",medium:"",imageNote:"",imageAlt:"A dented metal cooking pot and its lid displayed on a museum plinth.",tags:["cooking pot","percussion"],paragraphs:[],sections:[{title:"Cacerolazo",paragraphs:["The cooking pot, an emblematic utensil of everyday meals, became a symbol and a drum for the protests during the political and economic crisis of 2001. The first Argentine enamel pot was made in 1898 in Avellaneda, at the factory that would later become Ferrum. This coating makes the pots last and allows for energy-efficient, long cooking times. The heavy aluminium version became established in the 1980s through direct sales, making the legendary Essen pots treasured family heirlooms. Returning to iron, Lafont cast-iron pots shine as objects of desire for contemporary kitchens."]}]}}
  );

  window.NireArchiveItems.push(
    {id:"angeles-de-mar",letter:"A",number:"07",image:root+"archive/angeles-de-mar.jpg",imageStatus:"photograph",related:[],
      sequence:[root+"archive/angeles-de-mar.jpg",...Array.from({length:30},(_,i)=>root+"archive/transoceanic/frame-"+String(i+1).padStart(2,"0")+".jpg")],sequenceInterval:700,
      es:{word:"Ángeles de mar",title:"Ángeles de mar",medium:"",imageNote:"",imageAlt:"Dibujo de dos ángeles de mar sobre una hoja de papel.",sequenceAlt:"Secuencia de fotografías del proceso, las piezas, las construcciones y los bocetos de TRANSOCEANIC.",tags:["moluscos","dibujo","construcción","TRANSOCEANIC"],paragraphs:["TRANSOCEANIC: un juego de construcción inspirado en la reproducción de los ángeles de mar. Un baile de piezas que se atraviesan y se unen de forma recíproca, creando un nexo de infinitas conexiones."]},
      en:{word:"Sea angels",title:"Sea angels",medium:"",imageNote:"",imageAlt:"A drawing of two sea angels on a sheet of paper.",sequenceAlt:"A photographic sequence of TRANSOCEANIC’s process, pieces, constructions and sketches.",tags:["molluscs","drawing","construction","TRANSOCEANIC"],paragraphs:["TRANSOCEANIC: a construction game inspired by the reproduction of sea angels. A dance of pieces passing through one another and joining reciprocally, creating a link of infinite connections."]}}
  );

  window.NireArchiveItems.push(
    {id:"dibujo-pie",letter:"D",number:"21",image:root+"archive/drawings/pie/digitalizacion-sin-texto.png",imageStatus:"scan",related:[],
      es:{word:"Dibujo",title:"Sin título",medium:"",imageNote:"",imageAlt:"Dibujo en tinta negra de un pie con una figura pequeña arriba.",tags:["dibujo"],paragraphs:[]},
      en:{word:"Drawing",title:"Untitled",medium:"",imageNote:"",imageAlt:"A black ink drawing of a foot with a small figure above it.",tags:["drawing"],paragraphs:[]}}
  );

  window.NireArchiveItems.push(
    {id:"earrings-peggy-guggenheim",letter:"E",number:"22",image:root+"archive/earrings-peggy-guggenheim.jpg",imageWidth:768,imageHeight:1024,imageStatus:"photograph",related:[],
      photographs:[
        {image:root+"archive/earrings-peggy-guggenheim/foto-01.png",width:401,height:498,es:{alt:"Peggy Guggenheim sentada junto a una escultura de alambre."},en:{alt:"Peggy Guggenheim seated beside a wire sculpture."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-02.png",width:511,height:639,es:{alt:"Primer plano de Peggy Guggenheim con un aro de alambre."},en:{alt:"Close-up of Peggy Guggenheim wearing a wire earring."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-03.png",width:400,height:500,es:{alt:"Peggy Guggenheim se coloca un aro frente a un espejo ovalado."},en:{alt:"Peggy Guggenheim puts on an earring beside an oval mirror."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-04.png",width:507,height:640,es:{alt:"Retrato al aire libre de Peggy Guggenheim con aros de alambre."},en:{alt:"Outdoor portrait of Peggy Guggenheim wearing wire earrings."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-05.png",width:399,height:501,es:{alt:"Peggy Guggenheim sentada en su cama, junto a una escultura de alambre."},en:{alt:"Peggy Guggenheim sitting on her bed beside a wire sculpture."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-06.png",width:400,height:500,es:{alt:"Peggy Guggenheim con su perro en una sala con una pintura y un móvil."},en:{alt:"Peggy Guggenheim with her dog in a room with a painting and a mobile."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-07.png",width:447,height:447,es:{alt:"Habitación con chimenea, espejo y aros en las paredes."},en:{alt:"Room with a fireplace, a mirror and earrings on the walls."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-08.png",width:447,height:447,es:{alt:"Cama con dosel, sillas rosas y una escultura de alambre en la pared."},en:{alt:"Canopy bed, pink chairs and a wire sculpture on the wall."}},
        {image:root+"archive/earrings-peggy-guggenheim/foto-09.png",width:401,height:498,es:{alt:"Reunión en una sala con un pez de colores suspendido del techo."},en:{alt:"A gathering in a room with a colorful fish hanging from the ceiling."}}
      ],
      es:{word:"Earrings",title:"Earrings for Peggy Guggenheim",artworkCredit:"Alexander Calder",medium:"",imageNote:"",imageAlt:"Fotografía de dos pares de aros expuestos en una vitrina.",tags:[],paragraphs:[]},
      en:{word:"Earrings",title:"Earrings for Peggy Guggenheim",artworkCredit:"Alexander Calder",medium:"",imageNote:"",imageAlt:"A photograph of two pairs of earrings exhibited in a display case.",tags:[],paragraphs:[]}}
  );

  window.NireArchiveItems.push(
    {id:"dargelos",letter:"D",number:"23",image:root+"archive/dargelos/artboard-09.jpg",imageWidth:3508,imageHeight:4960,imageStatus:"photograph",related:[],
      photographs:[
        {image:root+"archive/dargelos/artboard-08.jpg",width:1240,height:1748,es:{alt:"Página con texto y texturas onduladas."},en:{alt:"A page with text and wavy textures."}},
        {image:root+"archive/dargelos/artboard-07.jpg",width:1240,height:1748,es:{alt:"Composición tipográfica con palabras y fragmentos distribuidos sobre un fondo uniforme."},en:{alt:"A typographic composition with words and fragments distributed over a uniform background."}},
        {image:root+"archive/dargelos/artboard-06.jpg",width:1240,height:1748,es:{alt:"Composición de palabras y preguntas, con frases en distintas orientaciones."},en:{alt:"A composition of words and questions, with phrases in different orientations."}},
        {image:root+"archive/dargelos/artboard-05.jpg",width:1240,height:1748,es:{alt:"Página titulada UNI(-) VERSOS PARALELOS, con varios párrafos."},en:{alt:"A page headed UNI(-) VERSOS PARALELOS, with several paragraphs."}},
        {image:root+"archive/dargelos/artboard-03.jpg",width:1240,height:1748,es:{alt:"Composición con una letra D grande, un perfil y texturas."},en:{alt:"A composition with a large letter D, a profile and textures."}},
        {image:root+"archive/dargelos/artboard-02.jpg",width:1240,height:1748,es:{alt:"Página con las palabras TRANS -ALGO y una textura en la parte inferior."},en:{alt:"A page with the words TRANS -ALGO and a texture at the bottom."}},
        {image:root+"archive/dargelos/artboard-01.jpg",width:1240,height:1748,es:{alt:"Página con la frase DESDE EL SILENCIO sobre dibujos y texturas."},en:{alt:"A page with the phrase DESDE EL SILENCIO over drawings and textures."}},
        {image:root+"archive/dargelos/composicion.png",width:1920,height:2286,es:{alt:"Composición gráfica con dibujos, texturas y palabras unidas por líneas punteadas."},en:{alt:"A graphic composition with drawings, textures and words connected by dotted lines."}}
      ],
      es:{word:"Dargelos",title:"Dargelos",medium:"",imageNote:"",imageAlt:"Portada gráfica con un título en blanco, texturas y figuras superpuestas.",tags:[],paragraphs:["En un momento de amor por Dargelos descubrí que su nombre proviene del personaje Dargelos de Les Enfants Terribles, de Jean Cocteau."],formatting:[{text:"Les Enfants Terribles",tag:"em"}]},
      en:{word:"Dargelos",title:"Dargelos",medium:"",imageNote:"",imageAlt:"A graphic cover with a white title, textures and overlapping figures.",tags:[],paragraphs:["In a moment of love for Dargelos, I discovered that his name comes from the character Dargelos in Les Enfants Terribles by Jean Cocteau."],formatting:[{text:"Les Enfants Terribles",tag:"em"}]}}
  );

  window.NireArchiveItems.push(
    {id:"bang-hai-ja",letter:"B",number:"24",image:root+"archive/bang-hai-ja.jpg",imageStatus:"photograph",related:[],
      es:{word:"Bang Hai Ja",title:"Bang Hai Ja",medium:"",imageNote:"",imageAlt:"Retrato de Bang Hai Ja con un guardapolvo frente a una mesa con pinceles y materiales.",tags:[],paragraphs:["Esta es Bang Hai Ja, la artista de la luz, y algo así quiero ser cuando sea grande. Quiero un montón de cosas de las que no estoy segura, que seguro continuarán mutando, pero sé que quiero verme así."]},
      en:{word:"Bang Hai Ja",title:"Bang Hai Ja",medium:"",imageNote:"",imageAlt:"A portrait of Bang Hai Ja wearing a work coat beside a table with brushes and art materials.",tags:[],paragraphs:["This is Bang Hai Ja, the artist of light, and I want to be something like her when I grow up. I want lots of things I’m not sure about, things that will surely keep changing, but I know I want to look like this."]}}
  );

  window.NireArchiveItems.push(
    {id:"la-siesta",letter:"S",number:"25",image:root+"archive/la-siesta.jpg",imageStatus:"photograph",related:[],
      es:{word:"Siesta",title:"La siesta",artworkCredit:"Joan Miró",medium:"",imageNote:"",imageAlt:"Fotografía de La siesta de Joan Miró, enmarcada y expuesta en una pared.",tags:[],paragraphs:["La siesta de Joan Miró, perteneciente a su periodo de transición hacia el surrealismo y la pintura automática. Es la pieza que nos lleva hasta acá, a este espacio, de intercambio, cultura y diseño, de archivo, de abecedario y de colección."],formatting:[{text:"perteneciente a su periodo de transición hacia el surrealismo y la pintura automática",tag:"strong"}]},
      en:{word:"Siesta",title:"La siesta",artworkCredit:"Joan Miró",medium:"",imageNote:"",imageAlt:"A photograph of Joan Miró’s La siesta, framed and displayed on a wall.",tags:[],paragraphs:["La siesta by Joan Miró, from his period of transition towards surrealism and automatic painting. It is the piece that brings us here, to this space of exchange, culture and design, of archives, of alphabets and of collections."],formatting:[{text:"from his period of transition towards surrealism and automatic painting",tag:"strong"}]}}
  );

  window.NireArchiveItems.push(
    {id:"remedios-varo",letter:"R",number:"26",image:root+"archive/remedios-varo.jpg",imageStatus:"photograph",related:[],
      es:{word:"Remedios Varo",title:"Remedios Varo",medium:"",imageNote:"",imageAlt:"Fotografía de una pintura de Remedios Varo enmarcada, con una figura sentada dentro de una pequeña construcción.",tags:[],paragraphs:["Remedios Varo, algo así como la mujer de mis sueños"]},
      en:{word:"Remedios Varo",title:"Remedios Varo",medium:"",imageNote:"",imageAlt:"A photograph of a framed painting by Remedios Varo, with a figure seated inside a small structure.",tags:[],paragraphs:["Remedios Varo, something like the woman of my dreams"]}}
  );

  window.NireArchiveItems.push(
    {id:"bed-in",letter:"B",number:"27",image:root+"archive/bed-in.jpg",imageStatus:"photograph",related:[],
      es:{word:"Bed-In",title:"Bed-In",artworkCredit:"Yoko Ono y John Lennon",medium:"",imageNote:"",imageAlt:"Dos fotografías enmarcadas de Yoko Ono y John Lennon durante el Bed-In, expuestas una al lado de la otra.",tags:[],paragraphs:[
        "Entre el 25 y el 31 de marzo de 1969, Yoko Ono y John Lennon realizaron su primer Bed-In en la suite 702 del hotel Hilton de Ámsterdam. El evento formó parte de su luna de miel: habían decidido aprovechar la publicidad que rodeaba su matrimonio para promover la paz mundial.",
        "El Bed-In sirvió como protesta pacifista contra la guerra de Vietnam. Rodeado de carteles que decían «Bed Peace» y «Hair Peace», era una variante de una sentada: una protesta en la que los manifestantes defienden su causa ocupando un lugar específico."
      ]},
      en:{word:"Bed-In",title:"Bed-In",artworkCredit:"Yoko Ono and John Lennon",medium:"",imageNote:"",imageAlt:"Two framed photographs of Yoko Ono and John Lennon during the Bed-In, displayed side by side.",tags:[],paragraphs:[
        "Between March 25 and 31, 1969, Yoko Ono and John Lennon held their first Bed-In, in suite 702 of the Hilton Hotel in Amsterdam. The event was part of their honeymoon: they had decided to use the publicity surrounding their marriage to promote world peace.",
        "The Bed-In served as a pacifist protest against the Vietnam War. Surrounded by signs reading \"Bed Peace\" and \"Hair Peace,\" it was a variation on a sit-in, where demonstrators take a stand for their cause by occupying a specific location."
      ]}}
  );





  window.NireArchiveItems.push(
    {id:"buenos-aires",letter:"B",number:"30",image:root+"archive/buenos-aires/foto-01.jpg",imageStatus:"gallery",related:[],galleryFocus:0,galleryBase:root+"archive/buenos-aires/",
      gallery:[
        {file:"foto-01.jpg",width:1024,height:768,crop:[0,0,1024,768],es:"Marcas y manchas sobre una pared de baldosas claras.",en:"Marks and smudges on a wall of pale tiles."},
        {file:"foto-02.jpg",width:768,height:1024,crop:[0,0,768,1024],es:"Volantes de papel pegados sobre una columna de piedra.",en:"Paper flyers pasted onto a stone column."},
        {file:"foto-03.jpg",width:1024,height:768,crop:[0,0,1024,768],es:"Restos de papel sobre un vidrio que refleja la calle.",en:"Paper remnants on a window reflecting the street."},
        {file:"foto-04.jpg",width:768,height:1024,crop:[0,0,768,1024],es:"Restos de afiches rasgados sobre una pared clara.",en:"Remnants of torn posters on a pale wall."},
        {file:"foto-05.jpg",width:1024,height:768,crop:[0,0,1024,768],es:"Una puerta de madera gastada con un cartel que pide verificar que quede cerrada.",en:"A worn wooden door with a sign asking that it be checked closed."},
        {file:"foto-06.jpg",width:2082,height:1510,crop:[0,0,2082,1510],es:"Un árbol y dos tutores de madera unidos con cinta, junto a la vereda.",en:"A tree and two wooden stakes joined with tape beside the pavement."},
        {file:"foto-07.jpg",width:1024,height:768,crop:[0,0,1024,768],es:"Una frase escrita sobre una persiana metálica.",en:"A phrase written on a metal shutter."},
      ],
      es:{word:"Buenos Aires",title:"¿Tendrá la culpa la ciudad de Buenos Aires?",medium:"",imageNote:"",imageAlt:"Galería de siete fotografías de Buenos Aires.",tags:[],paragraphs:[]},
      en:{word:"Buenos Aires",title:"Could the city of Buenos Aires be to blame?",medium:"",imageNote:"",imageAlt:"A gallery of seven photographs of Buenos Aires.",tags:[],paragraphs:[]}}
  );



  const stone=window.NireArchiveItems.find(item=>item.id==='piedra');
  stone.references=[
    {image:root+'archive/references/marina-abramovic-piedra.png',
      es:{alt:'Marina Abramović acercando su rostro a una roca junto al mar.',lines:['Marina Abramović']},
      en:{alt:'Marina Abramović bringing her face close to a rock beside the sea.',lines:['Marina Abramović']}},
    {image:root+'archive/references/marina-abramovic-crystal-cinema-i.png',source:'https://art21.org/gallery/marina-abramovic-artwork-survey-1990s/',
      es:{alt:'Marina Abramović sentada en un taburete frente a cristales de cuarzo en Crystal Cinema I.',lines:['Marina Abramović','Crystal Cinema I']},
      en:{alt:'Marina Abramović seated on a stool facing quartz crystals in Crystal Cinema I.',lines:['Marina Abramović','Crystal Cinema I']}}
  ];
  for(let n=1;n<=20;n++){
    if(window.NireArchiveItems.some(item=>Number(item.number)===n))continue;
    const number=String(n).padStart(2,'0');
    window.NireArchiveItems.push({id:'objeto-'+number,letter:'O',number,placeholder:true,image:null,imageStatus:'reserved',related:[],
      es:{word:'Objeto '+number,title:'Objeto '+number,medium:'Por incorporar',imageNote:'',tags:[],paragraphs:[]},
      en:{word:'Object '+number,title:'Object '+number,medium:'To be added',imageNote:'',tags:[],paragraphs:[]}
    });
  }

}());
