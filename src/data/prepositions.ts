import type { Kasus, Level } from '@/engine/grammar'

/** 'wechsel' prepositions take the accusative for direction and the dative for position. */
export type PrepGroup = 'akk' | 'dat' | 'gen' | 'wechsel'

export interface PrepExample {
  de: string
  en: string
  kasus: Kasus
}

export interface Preposition {
  id: string
  word: string
  group: PrepGroup
  en: string
  level: Level
  examples: PrepExample[]
  /** What each case means, for the two-way prepositions. */
  wechsel?: { akk: string; dat: string }
  note?: string
}

export const PREP_GROUP_LABEL: Record<PrepGroup, string> = {
  akk: 'always Akkusativ',
  dat: 'always Dativ',
  gen: 'always Genitiv',
  wechsel: 'Akkusativ or Dativ',
}

export const PREPOSITIONS: Preposition[] = [
  // ------------------------------------------------------------- Akkusativ only
  {
    id: 'durch', word: 'durch', group: 'akk', en: 'through, by means of', level: 'A1',
    examples: [{ de: 'Wir gehen durch den Park.', en: 'We walk through the park.', kasus: 'akk' }],
  },
  {
    id: 'fuer', word: 'für', group: 'akk', en: 'for', level: 'A1',
    examples: [{ de: 'Das Geschenk ist für meine Schwester.', en: 'The present is for my sister.', kasus: 'akk' }],
  },
  {
    id: 'gegen', word: 'gegen', group: 'akk', en: 'against, around (time)', level: 'A1',
    examples: [
      { de: 'Er fährt gegen den Baum.', en: 'He drives into the tree.', kasus: 'akk' },
      { de: 'Ich komme gegen acht Uhr.', en: 'I am coming around eight.', kasus: 'akk' },
    ],
  },
  {
    id: 'ohne', word: 'ohne', group: 'akk', en: 'without', level: 'A1',
    examples: [{ de: 'Ich fahre ohne meinen Bruder.', en: 'I am going without my brother.', kasus: 'akk' }],
    note: 'The noun after ohne usually loses its article: ohne Auto, ohne Geld.',
  },
  {
    id: 'um', word: 'um', group: 'akk', en: 'around, at (clock time)', level: 'A1',
    examples: [
      { de: 'Wir sitzen um den Tisch.', en: 'We sit around the table.', kasus: 'akk' },
      { de: 'Der Film beginnt um acht.', en: 'The film starts at eight.', kasus: 'akk' },
    ],
  },
  {
    id: 'bis', word: 'bis', group: 'akk', en: 'until, as far as', level: 'A1',
    examples: [{ de: 'Ich bleibe bis nächsten Montag.', en: 'I am staying until next Monday.', kasus: 'akk' }],
    note: 'Before an article, bis normally teams up with another preposition: bis zum Bahnhof, bis in die Nacht.',
  },
  {
    id: 'entlang', word: 'entlang', group: 'akk', en: 'along', level: 'B1',
    examples: [{ de: 'Wir gehen den Fluss entlang.', en: 'We walk along the river.', kasus: 'akk' }],
    note: 'Comes after its noun. Before the noun it takes the dative: entlang dem Fluss.',
  },
  {
    id: 'wider', word: 'wider', group: 'akk', en: 'contrary to', level: 'C1',
    examples: [{ de: 'Das war wider meinen Willen.', en: 'That was against my will.', kasus: 'akk' }],
    note: 'Formal. Do not confuse it with wieder ("again").',
  },

  // ---------------------------------------------------------------- Dativ only
  {
    id: 'aus', word: 'aus', group: 'dat', en: 'out of, from (origin), made of', level: 'A1',
    examples: [
      { de: 'Ich komme aus der Schweiz.', en: 'I come from Switzerland.', kasus: 'dat' },
      { de: 'Er nimmt das Buch aus dem Regal.', en: 'He takes the book out of the shelf.', kasus: 'dat' },
    ],
  },
  {
    id: 'ausser', word: 'außer', group: 'dat', en: 'except for, besides', level: 'A2',
    examples: [{ de: 'Außer meinem Bruder kommen alle.', en: 'Everyone is coming except my brother.', kasus: 'dat' }],
  },
  {
    id: 'bei', word: 'bei', group: 'dat', en: 'at, near, at the home of', level: 'A1',
    examples: [
      { de: 'Ich wohne bei meinen Eltern.', en: 'I live with my parents.', kasus: 'dat' },
      { de: 'Sie arbeitet bei einer Bank.', en: 'She works at a bank.', kasus: 'dat' },
    ],
  },
  {
    id: 'gegenueber', word: 'gegenüber', group: 'dat', en: 'opposite, towards', level: 'B1',
    examples: [{ de: 'Die Post liegt gegenüber dem Bahnhof.', en: 'The post office is opposite the station.', kasus: 'dat' }],
    note: 'Can also follow its noun: dem Bahnhof gegenüber. With a pronoun it always follows: mir gegenüber.',
  },
  {
    id: 'mit', word: 'mit', group: 'dat', en: 'with, by (transport)', level: 'A1',
    examples: [
      { de: 'Ich fahre mit dem Zug.', en: 'I travel by train.', kasus: 'dat' },
      { de: 'Sie spricht mit ihrer Chefin.', en: 'She is talking to her boss.', kasus: 'dat' },
    ],
  },
  {
    id: 'nach', word: 'nach', group: 'dat', en: 'after, to (places without an article)', level: 'A1',
    examples: [
      { de: 'Nach der Arbeit gehe ich schwimmen.', en: 'After work I go swimming.', kasus: 'dat' },
      { de: 'Wir fliegen nach Berlin.', en: 'We are flying to Berlin.', kasus: 'dat' },
    ],
    note: 'Use nach for countries and cities without an article, in for the rest: nach Italien, but in die Schweiz.',
  },
  {
    id: 'seit', word: 'seit', group: 'dat', en: 'since, for (a period up to now)', level: 'A1',
    examples: [{ de: 'Ich lerne seit einem Jahr Deutsch.', en: 'I have been learning German for a year.', kasus: 'dat' }],
    note: 'German uses the present tense with seit where English uses the perfect.',
  },
  {
    id: 'von', word: 'von', group: 'dat', en: 'from, of, by', level: 'A1',
    examples: [
      { de: 'Das ist ein Geschenk von meiner Tante.', en: 'This is a present from my aunt.', kasus: 'dat' },
      { de: 'Ich komme gerade vom Arzt.', en: 'I have just come from the doctor.', kasus: 'dat' },
    ],
  },
  {
    id: 'zu', word: 'zu', group: 'dat', en: 'to (people and places)', level: 'A1',
    examples: [
      { de: 'Ich gehe zum Arzt.', en: 'I am going to the doctor.', kasus: 'dat' },
      { de: 'Kommst du zu meiner Party?', en: 'Are you coming to my party?', kasus: 'dat' },
    ],
  },
  {
    id: 'ab', word: 'ab', group: 'dat', en: 'from (a point in time) onwards', level: 'B1',
    examples: [{ de: 'Ab dem ersten Mai gilt der neue Preis.', en: 'The new price applies from the first of May.', kasus: 'dat' }],
  },
  {
    id: 'entgegen', word: 'entgegen', group: 'dat', en: 'contrary to', level: 'B2',
    examples: [{ de: 'Entgegen meiner Erwartung war es leicht.', en: 'Contrary to my expectation it was easy.', kasus: 'dat' }],
  },
  {
    id: 'gemaess', word: 'gemäß', group: 'dat', en: 'in accordance with', level: 'B2',
    examples: [{ de: 'Gemäß dem Vertrag zahlen wir monatlich.', en: 'In accordance with the contract we pay monthly.', kasus: 'dat' }],
  },
  {
    id: 'laut', word: 'laut', group: 'dat', en: 'according to', level: 'B1',
    examples: [{ de: 'Laut dem Bericht steigen die Preise.', en: 'According to the report prices are rising.', kasus: 'dat' }],
    note: 'The genitive also occurs: laut des Berichts.',
  },
  {
    id: 'dank', word: 'dank', group: 'dat', en: 'thanks to', level: 'B1',
    examples: [{ de: 'Dank deiner Hilfe habe ich es geschafft.', en: 'Thanks to your help I managed it.', kasus: 'dat' }],
    note: 'The genitive also occurs, especially in the plural: dank seiner Bemühungen.',
  },

  // ------------------------------------------------------- Wechselpräpositionen
  {
    id: 'an', word: 'an', group: 'wechsel', en: 'at, on (a vertical surface), to',
    level: 'A1', wechsel: { akk: 'wohin? movement towards the edge or surface', dat: 'wo? position at the edge or surface' },
    examples: [
      { de: 'Das Bild hängt an der Wand.', en: 'The picture is hanging on the wall.', kasus: 'dat' },
      { de: 'Ich hänge das Bild an die Wand.', en: 'I hang the picture on the wall.', kasus: 'akk' },
    ],
  },
  {
    id: 'auf', word: 'auf', group: 'wechsel', en: 'on (a horizontal surface), onto',
    level: 'A1', wechsel: { akk: 'wohin? movement onto something', dat: 'wo? position on top of something' },
    examples: [
      { de: 'Das Buch liegt auf dem Tisch.', en: 'The book is lying on the table.', kasus: 'dat' },
      { de: 'Ich lege das Buch auf den Tisch.', en: 'I put the book on the table.', kasus: 'akk' },
    ],
  },
  {
    id: 'hinter', word: 'hinter', group: 'wechsel', en: 'behind',
    level: 'A2', wechsel: { akk: 'wohin? movement to behind something', dat: 'wo? position behind something' },
    examples: [
      { de: 'Der Garten liegt hinter dem Haus.', en: 'The garden is behind the house.', kasus: 'dat' },
      { de: 'Er stellt das Fahrrad hinter das Haus.', en: 'He puts the bike behind the house.', kasus: 'akk' },
    ],
  },
  {
    id: 'in', word: 'in', group: 'wechsel', en: 'in, into',
    level: 'A1', wechsel: { akk: 'wohin? movement into something', dat: 'wo? position inside something' },
    examples: [
      { de: 'Ich bin in der Küche.', en: 'I am in the kitchen.', kasus: 'dat' },
      { de: 'Ich gehe in die Küche.', en: 'I am going into the kitchen.', kasus: 'akk' },
    ],
  },
  {
    id: 'neben', word: 'neben', group: 'wechsel', en: 'next to',
    level: 'A1', wechsel: { akk: 'wohin? movement to a place beside something', dat: 'wo? position beside something' },
    examples: [
      { de: 'Sie sitzt neben ihrem Kollegen.', en: 'She is sitting next to her colleague.', kasus: 'dat' },
      { de: 'Setz dich neben deinen Bruder!', en: 'Sit down next to your brother!', kasus: 'akk' },
    ],
  },
  {
    id: 'ueber', word: 'über', group: 'wechsel', en: 'above, over; about',
    level: 'A1', wechsel: { akk: 'wohin? / worüber? movement to above something, or the topic of speech', dat: 'wo? position above something' },
    examples: [
      { de: 'Die Lampe hängt über dem Tisch.', en: 'The lamp hangs above the table.', kasus: 'dat' },
      { de: 'Sie hängt die Lampe über den Tisch.', en: 'She hangs the lamp above the table.', kasus: 'akk' },
      { de: 'Wir sprechen über das Wetter.', en: 'We are talking about the weather.', kasus: 'akk' },
    ],
    note: 'In the sense "about (a topic)" über is always accusative.',
  },
  {
    id: 'unter', word: 'unter', group: 'wechsel', en: 'under, among',
    level: 'A1', wechsel: { akk: 'wohin? movement to under something', dat: 'wo? position under something' },
    examples: [
      { de: 'Die Katze schläft unter dem Bett.', en: 'The cat is sleeping under the bed.', kasus: 'dat' },
      { de: 'Die Katze läuft unter das Bett.', en: 'The cat runs under the bed.', kasus: 'akk' },
    ],
  },
  {
    id: 'vor', word: 'vor', group: 'wechsel', en: 'in front of; ago (time)',
    level: 'A1', wechsel: { akk: 'wohin? movement to in front of something', dat: 'wo? / wann? position in front of something, or a point in the past' },
    examples: [
      { de: 'Ich warte vor dem Kino.', en: 'I am waiting in front of the cinema.', kasus: 'dat' },
      { de: 'Er stellt sich vor die Tür.', en: 'He positions himself in front of the door.', kasus: 'akk' },
      { de: 'Vor einem Jahr bin ich umgezogen.', en: 'A year ago I moved house.', kasus: 'dat' },
    ],
    note: 'In time expressions ("ago") vor is always dative.',
  },
  {
    id: 'zwischen', word: 'zwischen', group: 'wechsel', en: 'between',
    level: 'A2', wechsel: { akk: 'wohin? movement to a place between things', dat: 'wo? position between things' },
    examples: [
      { de: 'Das Café liegt zwischen der Bank und der Post.', en: 'The café is between the bank and the post office.', kasus: 'dat' },
      { de: 'Er setzt sich zwischen die beiden Kinder.', en: 'He sits down between the two children.', kasus: 'akk' },
    ],
  },

  // ------------------------------------------------------------------- Genitiv
  {
    id: 'wegen', word: 'wegen', group: 'gen', en: 'because of', level: 'A2',
    examples: [{ de: 'Wegen des Wetters bleiben wir zu Hause.', en: 'Because of the weather we are staying at home.', kasus: 'gen' }],
    note: 'Spoken German often uses the dative: wegen dem Wetter. The genitive is the written standard.',
  },
  {
    id: 'trotz', word: 'trotz', group: 'gen', en: 'in spite of', level: 'A2',
    examples: [{ de: 'Trotz des Regens gehen wir spazieren.', en: 'In spite of the rain we are going for a walk.', kasus: 'gen' }],
  },
  {
    id: 'waehrend', word: 'während', group: 'gen', en: 'during', level: 'A2',
    examples: [{ de: 'Während der Pause telefoniere ich.', en: 'During the break I make phone calls.', kasus: 'gen' }],
  },
  {
    id: 'statt', word: '(an)statt', group: 'gen', en: 'instead of', level: 'B1',
    examples: [{ de: 'Statt eines Autos kaufte er ein Fahrrad.', en: 'Instead of a car he bought a bicycle.', kasus: 'gen' }],
  },
  {
    id: 'ausserhalb', word: 'außerhalb', group: 'gen', en: 'outside of', level: 'B1',
    examples: [{ de: 'Außerhalb der Stadt ist es ruhig.', en: 'Outside the city it is quiet.', kasus: 'gen' }],
  },
  {
    id: 'innerhalb', word: 'innerhalb', group: 'gen', en: 'within', level: 'B1',
    examples: [{ de: 'Innerhalb einer Woche antworten wir.', en: 'We will answer within a week.', kasus: 'gen' }],
  },
  {
    id: 'oberhalb', word: 'oberhalb', group: 'gen', en: 'above (a place)', level: 'B2',
    examples: [{ de: 'Oberhalb des Dorfes liegt eine Burg.', en: 'Above the village there is a castle.', kasus: 'gen' }],
  },
  {
    id: 'unterhalb', word: 'unterhalb', group: 'gen', en: 'below (a place)', level: 'B2',
    examples: [{ de: 'Unterhalb des Fensters steht ein Tisch.', en: 'Below the window there is a table.', kasus: 'gen' }],
  },
  {
    id: 'jenseits', word: 'jenseits', group: 'gen', en: 'on the other side of', level: 'B2',
    examples: [{ de: 'Jenseits des Flusses beginnt Frankreich.', en: 'On the other side of the river France begins.', kasus: 'gen' }],
  },
  {
    id: 'aufgrund', word: 'aufgrund', group: 'gen', en: 'on the basis of, due to', level: 'B2',
    examples: [{ de: 'Aufgrund des Streiks fährt kein Zug.', en: 'Due to the strike no train is running.', kasus: 'gen' }],
  },
  {
    id: 'anhand', word: 'anhand', group: 'gen', en: 'by means of, using', level: 'B2',
    examples: [{ de: 'Anhand der Daten sehen wir das Problem.', en: 'Using the data we can see the problem.', kasus: 'gen' }],
  },
  {
    id: 'angesichts', word: 'angesichts', group: 'gen', en: 'in view of', level: 'C1',
    examples: [{ de: 'Angesichts der Lage bleiben wir vorsichtig.', en: 'In view of the situation we remain cautious.', kasus: 'gen' }],
  },
  {
    id: 'hinsichtlich', word: 'hinsichtlich', group: 'gen', en: 'with regard to', level: 'C1',
    examples: [{ de: 'Hinsichtlich der Kosten gibt es keine Einigung.', en: 'With regard to the costs there is no agreement.', kasus: 'gen' }],
  },
  {
    id: 'infolge', word: 'infolge', group: 'gen', en: 'as a result of', level: 'C1',
    examples: [{ de: 'Infolge des Unfalls war die Straße gesperrt.', en: 'As a result of the accident the road was closed.', kasus: 'gen' }],
  },
  {
    id: 'mittels', word: 'mittels', group: 'gen', en: 'by means of', level: 'C1',
    examples: [{ de: 'Mittels eines Schlüssels öffnete er die Tür.', en: 'By means of a key he opened the door.', kasus: 'gen' }],
  },
  {
    id: 'seitens', word: 'seitens', group: 'gen', en: 'on the part of', level: 'C1',
    examples: [{ de: 'Seitens der Firma gab es keine Antwort.', en: 'On the part of the company there was no answer.', kasus: 'gen' }],
  },
]

export const PREP_BY_ID = new Map(PREPOSITIONS.map((p) => [p.id, p]))

export const WECHSEL = PREPOSITIONS.filter((p) => p.group === 'wechsel')
