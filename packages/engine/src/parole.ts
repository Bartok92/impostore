// Le coppie di parole: la prima e la seconda sono "vicine" ma diverse.
// A ogni partita si sorteggia quale delle due va ai detective e quale all'impostore.

export type IdCategoria = 'cibo' | 'luoghi' | 'animali' | 'oggetti' | 'mestieri' | 'sport' | 'personaggi' | 'piccante' | 'senzacensura';
export type SceltaCategoria = IdCategoria | 'casuale';

export interface Categoria {
  id: IdCategoria;
  nome: string;
  /** Solo per adulti: non esce mai con "Casuale", va scelta apposta. */
  adulti?: boolean;
  /** Parole volgari ed esplicite: il Master conferma che al tavolo sono tutti maggiorenni. */
  esplicita?: boolean;
  coppie: readonly (readonly [string, string])[];
}

export const CATEGORIE: readonly Categoria[] = [
  {
    id: 'cibo',
    nome: 'Cibo',
    coppie: [
      ['pizza', 'focaccia'], ['spaghetti', 'tagliatelle'], ['gelato', 'sorbetto'], ['cornetto', 'ciambella'],
      ['lasagne', 'cannelloni'], ['tiramisù', 'panna cotta'], ['mozzarella', 'burrata'], ['prosciutto', 'salame'],
      ['caffè', 'tè'], ['cioccolato', 'caramella'], ['hamburger', 'hot dog'], ['sushi', 'poke'],
      ['patatine', 'popcorn'], ['arancino', 'supplì'], ['risotto', 'paella'], ['mela', 'pera'],
      ['fragola', 'ciliegia'], ['limone', 'arancia'], ['panettone', 'pandoro'], ['biscotti', 'cracker'],
      ['minestrone', 'zuppa'], ['kebab', 'piadina'], ['ketchup', 'maionese'], ['torta', 'crostata'],
      ['limonata', 'aranciata'],
    ],
  },
  {
    id: 'luoghi',
    nome: 'Luoghi',
    coppie: [
      ['spiaggia', 'lago'], ['montagna', 'collina'], ['ospedale', 'farmacia'], ['scuola', 'università'],
      ['cinema', 'teatro'], ['supermercato', 'mercato'], ['aeroporto', 'stazione'], ['ristorante', 'pizzeria'],
      ['biblioteca', 'libreria'], ['palestra', 'piscina'], ['museo', 'galleria d\'arte'], ['zoo', 'acquario'],
      ['chiesa', 'monastero'], ['parco', 'giardino'], ['discoteca', 'pub'], ['hotel', 'campeggio'],
      ['deserto', 'savana'], ['isola', 'penisola'], ['stadio', 'palazzetto'], ['bar', 'gelateria'],
      ['ufficio', 'banca'], ['luna park', 'circo'], ['porto', 'faro'], ['grotta', 'miniera'],
      ['castello', 'reggia'],
    ],
  },
  {
    id: 'animali',
    nome: 'Animali',
    coppie: [
      ['cane', 'lupo'], ['gatto', 'tigre'], ['leone', 'ghepardo'], ['cavallo', 'asino'],
      ['delfino', 'squalo'], ['balena', 'orca'], ['aquila', 'falco'], ['pinguino', 'foca'],
      ['coniglio', 'criceto'], ['mucca', 'bufalo'], ['pecora', 'capra'], ['serpente', 'lucertola'],
      ['ape', 'vespa'], ['farfalla', 'libellula'], ['elefante', 'rinoceronte'], ['giraffa', 'zebra'],
      ['scimmia', 'gorilla'], ['gallina', 'anatra'], ['rana', 'rospo'], ['polpo', 'calamaro'],
      ['gufo', 'pipistrello'], ['tartaruga', 'lumaca'], ['orso', 'panda'], ['volpe', 'procione'],
      ['formica', 'ragno'],
    ],
  },
  {
    id: 'oggetti',
    nome: 'Oggetti',
    coppie: [
      ['forchetta', 'cucchiaio'], ['telefono', 'tablet'], ['ombrello', 'impermeabile'], ['occhiali', 'lenti a contatto'],
      ['chitarra', 'violino'], ['orologio', 'sveglia'], ['matita', 'penna'], ['zaino', 'valigia'],
      ['sedia', 'sgabello'], ['cuscino', 'coperta'], ['bicicletta', 'monopattino'], ['lampada', 'candela'],
      ['specchio', 'finestra'], ['forbici', 'coltello'], ['televisore', 'computer'], ['libro', 'quaderno'],
      ['scarpe', 'ciabatte'], ['cappello', 'sciarpa'], ['chiave', 'lucchetto'], ['spazzolino', 'pettine'],
      ['pallone', 'palloncino'], ['frigorifero', 'forno'], ['automobile', 'furgone'], ['anello', 'collana'],
      ['asciugamano', 'accappatoio'],
    ],
  },
  {
    id: 'mestieri',
    nome: 'Mestieri',
    coppie: [
      ['medico', 'infermiere'], ['cuoco', 'pizzaiolo'], ['pompiere', 'poliziotto'], ['maestro', 'professore'],
      ['idraulico', 'elettricista'], ['pilota', 'hostess'], ['parrucchiere', 'barbiere'], ['dentista', 'veterinario'],
      ['contadino', 'giardiniere'], ['attore', 'cantante'], ['avvocato', 'giudice'], ['muratore', 'architetto'],
      ['postino', 'corriere'], ['cassiere', 'commesso'], ['panettiere', 'pasticcere'], ['fotografo', 'pittore'],
      ['calciatore', 'allenatore'], ['meccanico', 'benzinaio'], ['scienziato', 'inventore'], ['bagnino', 'maestro di sci'],
      ['tassista', 'autista di autobus'], ['giornalista', 'scrittore'], ['cameriere', 'barista'], ['sarto', 'stilista'],
    ],
  },
  {
    id: 'sport',
    nome: 'Sport',
    coppie: [
      ['calcio', 'rugby'], ['tennis', 'ping pong'], ['basket', 'pallavolo'], ['nuoto', 'tuffi'],
      ['sci', 'snowboard'], ['ciclismo', 'motociclismo'], ['boxe', 'karate'], ['golf', 'minigolf'],
      ['surf', 'skateboard'], ['pattinaggio', 'hockey'], ['scacchi', 'dama'], ['corsa', 'maratona'],
      ['equitazione', 'polo'], ['baseball', 'cricket'], ['judo', 'lotta'], ['bowling', 'biliardo'],
      ['arrampicata', 'alpinismo'], ['canoa', 'vela'], ['ginnastica', 'danza'], ['formula 1', 'rally'],
      ['pallamano', 'pallanuoto'], ['freccette', 'tiro con l\'arco'], ['yoga', 'pilates'], ['paracadutismo', 'deltaplano'],
    ],
  },
  {
    id: 'personaggi',
    nome: 'Personaggi',
    coppie: [
      ['vampiro', 'zombie'], ['pirata', 'vichingo'], ['strega', 'mago'], ['supereroe', 'supercattivo'],
      ['drago', 'dinosauro'], ['fantasma', 'mummia'], ['principessa', 'regina'], ['cavaliere', 'samurai'],
      ['alieno', 'astronauta'], ['sirena', 'fata'], ['cowboy', 'sceriffo'], ['ninja', 'spia'],
      ['ladro', 'truffatore'], ['orco', 'gigante'], ['unicorno', 'pegaso'], ['elfo', 'folletto'],
      ['re', 'imperatore'], ['lupo mannaro', 'yeti'], ['clown', 'mimo'], ['babbo natale', 'befana'],
      ['robot', 'cyborg'], ['angelo', 'diavolo'],
    ],
  },
  {
    id: 'piccante',
    nome: 'Sexy & Hot',
    adulti: true,
    coppie: [
      ['bacio', 'carezza'], ['manette', 'benda sugli occhi'], ['massaggio', 'solletico'], ['lingerie', 'costume da bagno'],
      ['idromassaggio', 'sauna'], ['spogliarello', 'burlesque'], ['tacchi a spillo', 'stivali'], ['reggicalze', 'calze a rete'],
      ['champagne', 'prosecco'], ['succhiotto', 'morso'], ['flirt', 'corteggiamento'], ['seduzione', 'tentazione'],
      ['motel', 'suite'], ['candele', 'petali di rosa'], ['ex', 'amante'], ['appuntamento al buio', 'speed date'],
      ['occhiolino', 'sguardo'], ['coccole', 'abbraccio'], ['pomiciata', 'limone'], ['gelosia', 'tradimento'],
      ['luna di miele', 'fuga romantica'], ['tango', 'salsa'], ['perizoma', 'bikini'], ['rossetto', 'profumo'],
      ['kamasutra', 'tantra'], ['strip poker', 'obbligo o verità'], ['sexting', 'videochiamata'], ['panna montata', 'cioccolato fuso'],
    ],
  },
  {
    id: 'senzacensura',
    nome: 'Senza censura',
    adulti: true,
    esplicita: true,
    coppie: [
      ['cazzo', 'fica'], ['pompino', 'leccata'], ['tette', 'culo'], ['scopata', 'sveltina'],
      ['vibratore', 'dildo'], ['preservativo', 'pillola'], ['orgasmo', 'eiaculazione'], ['sessantanove', 'pecorina'],
      ['sega', 'ditalino'], ['porno', 'webcam erotica'], ['capezzoli', 'clitoride'], ['orgia', 'scambio di coppia'],
      ['bondage', 'sculacciata'], ['palle', 'pisello'], ['sperma', 'lubrificante'], ['arrapato', 'eccitato'],
      ['trombamico', 'avventura di una notte'], ['erezione', 'viagra'], ['cowgirl', 'missionario'], ['strip club', 'sexy shop'],
      ['sesso anale', 'sesso orale'], ['gemito', 'ansimare'], ['sesso in macchina', 'sesso in spiaggia'], ['pornostar', 'spogliarellista'],
    ],
  },
];

export const ID_CATEGORIE = CATEGORIE.map((c) => c.id);

export function categoria(id: IdCategoria): Categoria {
  return CATEGORIE.find((c) => c.id === id)!;
}

export function nomeCategoria(id: SceltaCategoria): string {
  return id === 'casuale' ? 'Casuale' : categoria(id).nome;
}

/** Identificativo stabile di una coppia, per non ripeterla nella stessa stanza. */
export function idCoppia(cat: IdCategoria, indice: number): string {
  return `${cat}:${indice}`;
}
