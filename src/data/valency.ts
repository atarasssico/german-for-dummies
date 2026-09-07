import type { Kasus, Level } from '@/engine/grammar'

/** How a verb marks its object(s). */
export type Pattern = 'akk' | 'dat' | 'dat+akk' | 'akk+akk' | 'akk+gen' | 'gen' | 'prep'

export const PATTERN_LABEL: Record<Pattern, string> = {
  akk: 'Akkusativ',
  dat: 'Dativ',
  'dat+akk': 'Dativ + Akkusativ',
  'akk+akk': 'twice Akkusativ',
  'akk+gen': 'Akkusativ + Genitiv',
  gen: 'Genitiv',
  prep: 'fixed preposition',
}

export interface Frame {
  pattern: Pattern
  prep?: string
  prepCase?: Kasus
  /** What this particular frame means. Only needed when a verb has several. */
  sense?: string
  example: { de: string; en: string }
}

export interface Valency {
  id: string
  /** Infinitive as displayed, including a reflexive pronoun where it belongs. */
  verb: string
  en: string
  level: Level
  frames: Frame[]
  note?: string
}

export const VALENCY: Valency[] = [
  // ------------------------------------------------------- dative-only objects
  {
    id: 'helfen', verb: 'helfen', en: 'to help', level: 'A1',
    frames: [{ pattern: 'dat', example: { de: 'Ich helfe meiner Mutter.', en: 'I help my mother.' } }],
    note: 'English "help someone" looks like a direct object, but German helfen takes the dative. The synonym unterstützen takes the accusative.',
  },
  {
    id: 'danken', verb: 'danken', en: 'to thank', level: 'A1',
    frames: [
      { pattern: 'dat', sense: 'the person you thank', example: { de: 'Ich danke dir.', en: 'Thank you.' } },
      { pattern: 'prep', prep: 'für', prepCase: 'akk', sense: 'what you thank them for', example: { de: 'Ich danke dir für deine Hilfe.', en: 'Thank you for your help.' } },
    ],
  },
  {
    id: 'antworten', verb: 'antworten', en: 'to answer', level: 'A1',
    frames: [
      { pattern: 'dat', sense: 'the person you answer', example: { de: 'Ich antworte dem Lehrer.', en: 'I answer the teacher.' } },
      { pattern: 'prep', prep: 'auf', prepCase: 'akk', sense: 'the question you answer', example: { de: 'Ich antworte auf die Frage.', en: 'I answer the question.' } },
    ],
    note: 'The person is dative, the question is auf + Akkusativ. Never *antworten die Frage.',
  },
  {
    id: 'gefallen', verb: 'gefallen', en: 'to please, to be liked', level: 'A1',
    frames: [{ pattern: 'dat', example: { de: 'Das Buch gefällt mir.', en: 'I like the book.' } }],
    note: 'The thing that pleases is the subject. "I like X" becomes "X gefällt mir".',
  },
  {
    id: 'schmecken', verb: 'schmecken', en: 'to taste', level: 'A1',
    frames: [
      { pattern: 'dat', sense: 'someone likes the taste', example: { de: 'Die Suppe schmeckt mir.', en: 'I like the soup.' } },
      { pattern: 'prep', prep: 'nach', prepCase: 'dat', sense: 'it tastes of something', example: { de: 'Die Suppe schmeckt nach Knoblauch.', en: 'The soup tastes of garlic.' } },
    ],
  },
  {
    id: 'gehoeren', verb: 'gehören', en: 'to belong', level: 'A1',
    frames: [
      { pattern: 'dat', sense: 'to be owned by someone', example: { de: 'Das Auto gehört meinem Bruder.', en: 'The car belongs to my brother.' } },
      { pattern: 'prep', prep: 'zu', prepCase: 'dat', sense: 'to be part of a group', example: { de: 'Er gehört zu unserem Team.', en: 'He is part of our team.' } },
    ],
    note: 'Ownership is bare dative; membership needs zu.',
  },
  {
    id: 'passen', verb: 'passen', en: 'to fit, to suit', level: 'A2',
    frames: [
      { pattern: 'dat', sense: 'the right size or convenient for someone', example: { de: 'Die Hose passt mir nicht.', en: 'The trousers do not fit me.' } },
      { pattern: 'prep', prep: 'zu', prepCase: 'dat', sense: 'to go well with something', example: { de: 'Der Wein passt zum Fisch.', en: 'The wine goes well with the fish.' } },
    ],
  },
  {
    id: 'folgen', verb: 'folgen', en: 'to follow', level: 'A2',
    frames: [
      { pattern: 'dat', sense: 'to go after someone', example: { de: 'Der Hund folgt seinem Herrn.', en: 'The dog follows its master.' } },
      { pattern: 'prep', prep: 'aus', prepCase: 'dat', sense: 'to follow logically', example: { de: 'Daraus folgt, dass wir warten müssen.', en: 'It follows from that that we have to wait.' } },
    ],
  },
  {
    id: 'gratulieren', verb: 'gratulieren', en: 'to congratulate', level: 'A2',
    frames: [
      { pattern: 'dat', sense: 'the person', example: { de: 'Ich gratuliere dir!', en: 'Congratulations!' } },
      { pattern: 'prep', prep: 'zu', prepCase: 'dat', sense: 'the occasion', example: { de: 'Ich gratuliere dir zum Geburtstag.', en: 'Happy birthday.' } },
    ],
  },
  { id: 'begegnen', verb: 'begegnen', en: 'to meet, to run into', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Ich bin meinem Nachbarn begegnet.', en: 'I ran into my neighbour.' } }], note: 'Takes sein in the perfect. The synonym treffen takes the accusative.' },
  { id: 'gelingen', verb: 'gelingen', en: 'to succeed', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Der Kuchen ist mir gelungen.', en: 'My cake turned out well.' } }], note: 'The thing that succeeds is the subject: Es gelingt mir.' },
  { id: 'passieren', verb: 'passieren', en: 'to happen to', level: 'A2', frames: [{ pattern: 'dat', example: { de: 'Was ist dir passiert?', en: 'What happened to you?' } }] },
  { id: 'zuhoeren', verb: 'zuhören', en: 'to listen to', level: 'A1', frames: [{ pattern: 'dat', example: { de: 'Hör mir zu!', en: 'Listen to me!' } }], note: 'Compare hören + Akkusativ (to hear something).' },
  { id: 'zusehen', verb: 'zusehen', en: 'to watch', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Ich sehe den Kindern zu.', en: 'I am watching the children.' } }] },
  { id: 'vertrauen', verb: 'vertrauen', en: 'to trust', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Ich vertraue meiner Kollegin.', en: 'I trust my colleague.' } }] },
  { id: 'widersprechen', verb: 'widersprechen', en: 'to contradict', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Sie widerspricht ihrem Chef.', en: 'She contradicts her boss.' } }] },
  { id: 'fehlen', verb: 'fehlen', en: 'to be missing, to be missed', level: 'A2', frames: [{ pattern: 'dat', example: { de: 'Du fehlst mir.', en: 'I miss you.' } }], note: 'Literally "you are missing to me". The person missed is the subject.' },
  { id: 'dienen', verb: 'dienen', en: 'to serve', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Das dient dem Umweltschutz.', en: 'That serves environmental protection.' } }] },
  { id: 'drohen', verb: 'drohen', en: 'to threaten', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Er droht seinem Nachbarn.', en: 'He is threatening his neighbour.' } }] },
  { id: 'schaden', verb: 'schaden', en: 'to harm', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Rauchen schadet der Gesundheit.', en: 'Smoking harms your health.' } }] },
  { id: 'nuetzen', verb: 'nützen', en: 'to be of use to', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Das nützt mir nichts.', en: 'That is no use to me.' } }] },
  { id: 'imponieren', verb: 'imponieren', en: 'to impress', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Sein Mut imponiert mir.', en: 'His courage impresses me.' } }] },
  { id: 'zustimmen', verb: 'zustimmen', en: 'to agree with', level: 'B1', frames: [{ pattern: 'dat', example: { de: 'Ich stimme dir zu.', en: 'I agree with you.' } }] },
  { id: 'gehorchen', verb: 'gehorchen', en: 'to obey', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Der Hund gehorcht seinem Besitzer.', en: 'The dog obeys its owner.' } }] },
  { id: 'entsprechen', verb: 'entsprechen', en: 'to correspond to', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Das entspricht nicht der Wahrheit.', en: 'That does not correspond to the truth.' } }] },
  { id: 'aehneln', verb: 'ähneln', en: 'to resemble', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Sie ähnelt ihrer Mutter.', en: 'She resembles her mother.' } }] },
  { id: 'wehtun', verb: 'wehtun', en: 'to hurt', level: 'A2', frames: [{ pattern: 'dat', example: { de: 'Mein Kopf tut mir weh.', en: 'My head hurts.' } }] },
  { id: 'leidtun', verb: 'leidtun', en: 'to be sorry', level: 'A2', frames: [{ pattern: 'dat', example: { de: 'Es tut mir leid.', en: 'I am sorry.' } }] },
  { id: 'sich_naehern', verb: 'sich nähern', en: 'to approach', level: 'B2', frames: [{ pattern: 'dat', example: { de: 'Der Zug nähert sich dem Bahnhof.', en: 'The train is approaching the station.' } }] },
  {
    id: 'verzeihen', verb: 'verzeihen', en: 'to forgive', level: 'B1',
    frames: [{ pattern: 'dat', example: { de: 'Ich verzeihe dir.', en: 'I forgive you.' } }],
    note: 'The person forgiven is dative, the deed forgiven is accusative: Ich verzeihe dir den Fehler.',
  },
  {
    id: 'glauben', verb: 'glauben', en: 'to believe', level: 'A2',
    frames: [
      { pattern: 'dat', sense: 'to believe a person', example: { de: 'Ich glaube dir.', en: 'I believe you.' } },
      { pattern: 'prep', prep: 'an', prepCase: 'akk', sense: 'to believe in something', example: { de: 'Ich glaube an dich.', en: 'I believe in you.' } },
    ],
    note: 'A bare dative means you accept what the person says; an + Akkusativ means faith or confidence.',
  },
  {
    id: 'raten', verb: 'raten', en: 'to advise; to guess', level: 'B1',
    frames: [
      { pattern: 'dat', sense: 'to give someone advice', example: { de: 'Ich rate dir, früher zu gehen.', en: 'I advise you to leave earlier.' } },
      { pattern: 'akk', sense: 'to guess something', example: { de: 'Rate mal die Antwort!', en: 'Have a guess at the answer!' } },
    ],
  },

  // --------------------------------------------------- dative plus accusative
  { id: 'geben', verb: 'geben', en: 'to give', level: 'A1', frames: [{ pattern: 'dat+akk', example: { de: 'Ich gebe dem Kind den Ball.', en: 'I give the child the ball.' } }], note: 'Person in the dative, thing in the accusative. This order is the default for all verbs of giving.' },
  { id: 'schenken', verb: 'schenken', en: 'to give as a present', level: 'A1', frames: [{ pattern: 'dat+akk', example: { de: 'Sie schenkt ihrer Freundin ein Buch.', en: 'She gives her friend a book.' } }] },
  { id: 'zeigen', verb: 'zeigen', en: 'to show', level: 'A1', frames: [{ pattern: 'dat+akk', example: { de: 'Zeig mir dein Foto!', en: 'Show me your photo!' } }] },
  { id: 'erklaeren', verb: 'erklären', en: 'to explain', level: 'A2', frames: [{ pattern: 'dat+akk', example: { de: 'Er erklärt mir die Regel.', en: 'He explains the rule to me.' } }] },
  { id: 'empfehlen', verb: 'empfehlen', en: 'to recommend', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Ich empfehle Ihnen das Fischgericht.', en: 'I recommend the fish dish to you.' } }] },
  { id: 'schicken', verb: 'schicken', en: 'to send', level: 'A2', frames: [{ pattern: 'dat+akk', example: { de: 'Ich schicke dir die Adresse.', en: 'I will send you the address.' } }] },
  { id: 'leihen', verb: 'leihen', en: 'to lend', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Kannst du mir dein Fahrrad leihen?', en: 'Can you lend me your bike?' } }] },
  { id: 'versprechen', verb: 'versprechen', en: 'to promise', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Ich verspreche dir eine Antwort.', en: 'I promise you an answer.' } }] },
  { id: 'anbieten', verb: 'anbieten', en: 'to offer', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Sie bietet den Gästen Kaffee an.', en: 'She offers the guests coffee.' } }] },
  { id: 'verbieten', verb: 'verbieten', en: 'to forbid', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Der Arzt verbietet ihm das Rauchen.', en: 'The doctor forbids him to smoke.' } }] },
  { id: 'erlauben', verb: 'erlauben', en: 'to allow', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Die Eltern erlauben dem Kind den Ausflug.', en: 'The parents allow the child the trip.' } }] },
  { id: 'beibringen', verb: 'beibringen', en: 'to teach (a skill)', level: 'B1', frames: [{ pattern: 'dat+akk', example: { de: 'Sie bringt mir Deutsch bei.', en: 'She is teaching me German.' } }] },
  { id: 'mitteilen', verb: 'mitteilen', en: 'to inform, to notify', level: 'B2', frames: [{ pattern: 'dat+akk', example: { de: 'Wir teilen Ihnen das Ergebnis mit.', en: 'We will inform you of the result.' } }] },

  // ------------------------------------------------- accusative worth contrasting
  { id: 'fragen', verb: 'fragen', en: 'to ask', level: 'A1', frames: [{ pattern: 'akk', example: { de: 'Ich frage den Lehrer.', en: 'I ask the teacher.' } }], note: 'fragen takes the accusative, antworten takes the dative. The classic trap.' },
  { id: 'unterstuetzen', verb: 'unterstützen', en: 'to support', level: 'B1', frames: [{ pattern: 'akk', example: { de: 'Ich unterstütze meine Kollegin.', en: 'I support my colleague.' } }], note: 'Accusative, unlike its near-synonym helfen.' },
  { id: 'anrufen', verb: 'anrufen', en: 'to phone', level: 'A1', frames: [{ pattern: 'akk', example: { de: 'Ich rufe meine Mutter an.', en: 'I am calling my mother.' } }], note: 'Accusative. But telefonieren needs mit + Dativ.' },
  {
    id: 'treffen', verb: 'treffen', en: 'to meet', level: 'A2',
    frames: [
      { pattern: 'akk', sense: 'to meet someone (by arrangement or chance)', example: { de: 'Ich treffe meinen Freund.', en: 'I am meeting my friend.' } },
      { pattern: 'prep', prep: 'mit', prepCase: 'dat', sense: 'reflexive: to meet up with', example: { de: 'Ich treffe mich mit meinem Freund.', en: 'I am meeting up with my friend.' } },
    ],
  },
  { id: 'lehren', verb: 'lehren', en: 'to teach', level: 'B2', frames: [{ pattern: 'akk+akk', example: { de: 'Sie lehrt die Kinder das Alphabet.', en: 'She teaches the children the alphabet.' } }], note: 'One of the few verbs with two accusatives. Also: nennen, kosten.' },
  { id: 'kosten', verb: 'kosten', en: 'to cost', level: 'B1', frames: [{ pattern: 'akk+akk', example: { de: 'Das kostet mich viel Zeit.', en: 'That costs me a lot of time.' } }] },

  // ------------------------------------------------------------------ genitive
  { id: 'gedenken', verb: 'gedenken', en: 'to commemorate', level: 'C1', frames: [{ pattern: 'gen', example: { de: 'Wir gedenken der Opfer.', en: 'We commemorate the victims.' } }] },
  { id: 'beduerfen', verb: 'bedürfen', en: 'to require', level: 'C1', frames: [{ pattern: 'gen', example: { de: 'Das bedarf einer Erklärung.', en: 'That requires an explanation.' } }] },
  { id: 'sich_bedienen', verb: 'sich bedienen', en: 'to make use of', level: 'C1', frames: [{ pattern: 'gen', example: { de: 'Er bedient sich eines Tricks.', en: 'He makes use of a trick.' } }] },
  { id: 'sich_enthalten', verb: 'sich enthalten', en: 'to abstain from', level: 'C1', frames: [{ pattern: 'gen', example: { de: 'Sie enthält sich der Stimme.', en: 'She abstains from voting.' } }] },
  { id: 'beschuldigen', verb: 'beschuldigen', en: 'to accuse', level: 'C1', frames: [{ pattern: 'akk+gen', example: { de: 'Man beschuldigt ihn des Diebstahls.', en: 'He is being accused of theft.' } }], note: 'Person in the accusative, the charge in the genitive. Same with verdächtigen and anklagen.' },
  { id: 'sich_schaemen', verb: 'sich schämen', en: 'to be ashamed', level: 'B2', frames: [{ pattern: 'gen', sense: 'formal', example: { de: 'Er schämt sich seines Verhaltens.', en: 'He is ashamed of his behaviour.' } }, { pattern: 'prep', prep: 'für', prepCase: 'akk', sense: 'everyday', example: { de: 'Er schämt sich für sein Verhalten.', en: 'He is ashamed of his behaviour.' } }] },

  // ----------------------------------------------- fixed preposition: auf + Akk
  { id: 'warten', verb: 'warten', en: 'to wait', level: 'A1', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Ich warte auf den Bus.', en: 'I am waiting for the bus.' } }] },
  { id: 'achten', verb: 'achten', en: 'to pay attention to', level: 'B1', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Achte auf den Verkehr!', en: 'Watch out for the traffic!' } }] },
  { id: 'hoffen', verb: 'hoffen', en: 'to hope for', level: 'A2', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Wir hoffen auf gutes Wetter.', en: 'We are hoping for good weather.' } }] },
  { id: 'verzichten', verb: 'verzichten', en: 'to do without, to give up', level: 'B2', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Ich verzichte auf den Nachtisch.', en: 'I will give the dessert a miss.' } }] },
  { id: 'reagieren', verb: 'reagieren', en: 'to react', level: 'B1', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Er reagiert nicht auf meine Mails.', en: 'He does not react to my emails.' } }] },
  { id: 'sich_vorbereiten', verb: 'sich vorbereiten', en: 'to prepare', level: 'B1', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Ich bereite mich auf die Prüfung vor.', en: 'I am preparing for the exam.' } }] },
  { id: 'sich_beziehen', verb: 'sich beziehen', en: 'to refer to', level: 'B2', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Ich beziehe mich auf Ihr Schreiben.', en: 'I refer to your letter.' } }] },
  { id: 'sich_einigen', verb: 'sich einigen', en: 'to agree on', level: 'B2', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Wir einigen uns auf einen Termin.', en: 'We agree on a date.' } }] },
  { id: 'sich_konzentrieren', verb: 'sich konzentrieren', en: 'to concentrate on', level: 'B1', frames: [{ pattern: 'prep', prep: 'auf', prepCase: 'akk', example: { de: 'Konzentriere dich auf die Arbeit!', en: 'Concentrate on your work!' } }] },
  {
    id: 'sich_verlassen', verb: 'sich verlassen', en: 'to rely on', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'auf', prepCase: 'akk', sense: 'reflexive: to rely on', example: { de: 'Ich verlasse mich auf dich.', en: 'I am relying on you.' } },
      { pattern: 'akk', sense: 'non-reflexive: to leave a place or a person', example: { de: 'Ich verlasse das Haus.', en: 'I am leaving the house.' } },
    ],
    note: 'The reflexive pronoun is what changes the meaning: sich verlassen auf = to rely on, verlassen = to leave.',
  },

  // -------------------------------------------- fixed preposition: an + Akk/Dat
  { id: 'sich_erinnern', verb: 'sich erinnern', en: 'to remember', level: 'B1', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'akk', example: { de: 'Ich erinnere mich an den Tag.', en: 'I remember the day.' } }] },
  { id: 'sich_gewoehnen', verb: 'sich gewöhnen', en: 'to get used to', level: 'B1', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'akk', example: { de: 'Ich gewöhne mich an das Wetter.', en: 'I am getting used to the weather.' } }] },
  { id: 'denken', verb: 'denken', en: 'to think', level: 'A2',
    frames: [
      { pattern: 'prep', prep: 'an', prepCase: 'akk', sense: 'to have someone or something in mind', example: { de: 'Ich denke an dich.', en: 'I am thinking of you.' } },
      { pattern: 'prep', prep: 'über', prepCase: 'akk', sense: 'to hold an opinion', example: { de: 'Was denkst du über den Film?', en: 'What do you think about the film?' } },
    ],
  },
  { id: 'zweifeln', verb: 'zweifeln', en: 'to doubt', level: 'B2', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Ich zweifle an seiner Ehrlichkeit.', en: 'I doubt his honesty.' } }] },
  { id: 'teilnehmen', verb: 'teilnehmen', en: 'to take part', level: 'B1', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Sie nimmt an der Konferenz teil.', en: 'She is taking part in the conference.' } }] },
  { id: 'arbeiten_an', verb: 'arbeiten', en: 'to work on', level: 'B1', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Ich arbeite an einem Projekt.', en: 'I am working on a project.' } }] },
  { id: 'liegen_an', verb: 'liegen', en: 'to be down to, to be the cause', level: 'B2', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Das liegt am Wetter.', en: 'That is down to the weather.' } }] },
  { id: 'sich_beteiligen', verb: 'sich beteiligen', en: 'to participate in', level: 'B2', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Er beteiligt sich an der Diskussion.', en: 'He is participating in the discussion.' } }] },
  { id: 'sterben_an', verb: 'sterben', en: 'to die of', level: 'B1', frames: [{ pattern: 'prep', prep: 'an', prepCase: 'dat', example: { de: 'Er starb an einer Krankheit.', en: 'He died of an illness.' } }] },
  {
    id: 'leiden', verb: 'leiden', en: 'to suffer', level: 'B2',
    frames: [
      { pattern: 'prep', prep: 'an', prepCase: 'dat', sense: 'from an illness', example: { de: 'Sie leidet an Migräne.', en: 'She suffers from migraines.' } },
      { pattern: 'prep', prep: 'unter', prepCase: 'dat', sense: 'from circumstances', example: { de: 'Sie leidet unter dem Lärm.', en: 'She suffers from the noise.' } },
    ],
    note: 'an + Dativ for a medical condition, unter + Dativ for conditions you endure.',
  },
  {
    id: 'schreiben', verb: 'schreiben', en: 'to write', level: 'A2',
    frames: [
      { pattern: 'prep', prep: 'an', prepCase: 'akk', sense: 'the addressee', example: { de: 'Ich schreibe an meine Tante.', en: 'I am writing to my aunt.' } },
      { pattern: 'prep', prep: 'über', prepCase: 'akk', sense: 'the topic', example: { de: 'Ich schreibe über meine Reise.', en: 'I am writing about my trip.' } },
    ],
  },

  // ----------------------------------------------- fixed preposition: um + Akk
  { id: 'bitten', verb: 'bitten', en: 'to ask for', level: 'A2', frames: [{ pattern: 'prep', prep: 'um', prepCase: 'akk', example: { de: 'Ich bitte dich um Hilfe.', en: 'I am asking you for help.' } }], note: 'The person asked is accusative, the thing requested is um + Akkusativ.' },
  { id: 'sich_kuemmern', verb: 'sich kümmern', en: 'to take care of', level: 'B1', frames: [{ pattern: 'prep', prep: 'um', prepCase: 'akk', example: { de: 'Ich kümmere mich um die Kinder.', en: 'I take care of the children.' } }] },
  { id: 'sich_handeln', verb: 'sich handeln', en: 'to be about', level: 'B2', frames: [{ pattern: 'prep', prep: 'um', prepCase: 'akk', example: { de: 'Es handelt sich um ein Missverständnis.', en: 'It is a misunderstanding.' } }], note: 'Only ever used with es as the subject.' },
  {
    id: 'sorgen', verb: 'sorgen', en: 'to look after; to worry', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'für', prepCase: 'akk', sense: 'to make sure of, to look after', example: { de: 'Ich sorge für das Essen.', en: 'I will take care of the food.' } },
      { pattern: 'prep', prep: 'um', prepCase: 'akk', sense: 'reflexive: to worry about', example: { de: 'Ich sorge mich um dich.', en: 'I am worried about you.' } },
    ],
    note: 'für + Akkusativ is responsibility, sich um + Akkusativ is anxiety.',
  },
  {
    id: 'sich_bewerben', verb: 'sich bewerben', en: 'to apply', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'um', prepCase: 'akk', sense: 'the position', example: { de: 'Ich bewerbe mich um die Stelle.', en: 'I am applying for the position.' } },
      { pattern: 'prep', prep: 'bei', prepCase: 'dat', sense: 'the employer', example: { de: 'Ich bewerbe mich bei einer Bank.', en: 'I am applying to a bank.' } },
    ],
  },

  // ---------------------------------------------- fixed preposition: für + Akk
  { id: 'sich_interessieren', verb: 'sich interessieren', en: 'to be interested in', level: 'A2', frames: [{ pattern: 'prep', prep: 'für', prepCase: 'akk', example: { de: 'Ich interessiere mich für Musik.', en: 'I am interested in music.' } }] },
  { id: 'sich_entscheiden', verb: 'sich entscheiden', en: 'to decide on', level: 'B1', frames: [{ pattern: 'prep', prep: 'für', prepCase: 'akk', example: { de: 'Ich entscheide mich für den Zug.', en: 'I am going for the train.' } }] },
  { id: 'sich_bedanken', verb: 'sich bedanken', en: 'to say thank you', level: 'B1', frames: [{ pattern: 'prep', prep: 'für', prepCase: 'akk', example: { de: 'Ich bedanke mich für das Geschenk.', en: 'Thank you for the present.' } }] },
  {
    id: 'sich_entschuldigen', verb: 'sich entschuldigen', en: 'to apologise', level: 'A2',
    frames: [
      { pattern: 'prep', prep: 'für', prepCase: 'akk', sense: 'what you apologise for', example: { de: 'Ich entschuldige mich für die Verspätung.', en: 'I apologise for being late.' } },
      { pattern: 'prep', prep: 'bei', prepCase: 'dat', sense: 'who you apologise to', example: { de: 'Ich entschuldige mich bei dir.', en: 'I apologise to you.' } },
    ],
  },

  // ---------------------------------------------- fixed preposition: mit + Dat
  { id: 'sich_beschaeftigen', verb: 'sich beschäftigen', en: 'to occupy oneself with', level: 'B1', frames: [{ pattern: 'prep', prep: 'mit', prepCase: 'dat', example: { de: 'Ich beschäftige mich mit Grammatik.', en: 'I am busy with grammar.' } }] },
  { id: 'vergleichen', verb: 'vergleichen', en: 'to compare', level: 'B1', frames: [{ pattern: 'prep', prep: 'mit', prepCase: 'dat', example: { de: 'Vergleiche den Preis mit dem Angebot!', en: 'Compare the price with the offer!' } }] },
  { id: 'rechnen', verb: 'rechnen', en: 'to reckon with, to expect', level: 'B2', frames: [{ pattern: 'prep', prep: 'mit', prepCase: 'dat', example: { de: 'Ich rechne mit einer Antwort.', en: 'I am expecting an answer.' } }] },
  { id: 'aufhoeren', verb: 'aufhören', en: 'to stop doing', level: 'A2', frames: [{ pattern: 'prep', prep: 'mit', prepCase: 'dat', example: { de: 'Hör mit dem Lärm auf!', en: 'Stop that noise!' } }] },
  { id: 'telefonieren', verb: 'telefonieren', en: 'to talk on the phone', level: 'A1', frames: [{ pattern: 'prep', prep: 'mit', prepCase: 'dat', example: { de: 'Ich telefoniere mit meiner Mutter.', en: 'I am on the phone with my mother.' } }], note: 'mit + Dativ, unlike anrufen + Akkusativ.' },
  {
    id: 'sprechen', verb: 'sprechen', en: 'to speak', level: 'A2',
    frames: [
      { pattern: 'prep', prep: 'mit', prepCase: 'dat', sense: 'the person you speak to', example: { de: 'Ich spreche mit dem Chef.', en: 'I am speaking with the boss.' } },
      { pattern: 'prep', prep: 'über', prepCase: 'akk', sense: 'the topic, discussed at length', example: { de: 'Wir sprechen über das Projekt.', en: 'We are talking about the project.' } },
      { pattern: 'prep', prep: 'von', prepCase: 'dat', sense: 'the topic, mentioned in passing', example: { de: 'Er sprach von seiner Reise.', en: 'He mentioned his trip.' } },
    ],
  },
  {
    id: 'sich_streiten', verb: 'sich streiten', en: 'to argue', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'mit', prepCase: 'dat', sense: 'who with', example: { de: 'Ich streite mich mit meinem Bruder.', en: 'I am arguing with my brother.' } },
      { pattern: 'prep', prep: 'über', prepCase: 'akk', sense: 'what about', example: { de: 'Wir streiten uns über das Geld.', en: 'We are arguing about the money.' } },
    ],
  },

  // --------------------------------------------- fixed preposition: nach + Dat
  { id: 'fragen_nach', verb: 'fragen', en: 'to ask about', level: 'A2', frames: [{ pattern: 'prep', prep: 'nach', prepCase: 'dat', example: { de: 'Er fragt nach dem Weg.', en: 'He is asking for directions.' } }] },
  { id: 'suchen', verb: 'suchen', en: 'to search for', level: 'B1', frames: [{ pattern: 'prep', prep: 'nach', prepCase: 'dat', example: { de: 'Ich suche nach einer Lösung.', en: 'I am searching for a solution.' } }], note: 'Bare accusative for a concrete object (ich suche meinen Schlüssel), nach + Dativ for something abstract.' },
  { id: 'riechen', verb: 'riechen', en: 'to smell of', level: 'B1', frames: [{ pattern: 'prep', prep: 'nach', prepCase: 'dat', example: { de: 'Es riecht nach Rauch.', en: 'It smells of smoke.' } }] },
  { id: 'sich_sehnen', verb: 'sich sehnen', en: 'to long for', level: 'B2', frames: [{ pattern: 'prep', prep: 'nach', prepCase: 'dat', example: { de: 'Ich sehne mich nach Ruhe.', en: 'I long for some peace.' } }] },

  // ---------------------------------------------- fixed preposition: von + Dat
  { id: 'abhaengen', verb: 'abhängen', en: 'to depend on', level: 'B1', frames: [{ pattern: 'prep', prep: 'von', prepCase: 'dat', example: { de: 'Das hängt vom Wetter ab.', en: 'That depends on the weather.' } }] },
  { id: 'traeumen', verb: 'träumen', en: 'to dream of', level: 'B1', frames: [{ pattern: 'prep', prep: 'von', prepCase: 'dat', example: { de: 'Ich träume von einem Haus am Meer.', en: 'I dream of a house by the sea.' } }] },
  {
    id: 'halten', verb: 'halten', en: 'to hold; to consider; to think of', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'von', prepCase: 'dat', sense: 'to have an opinion of', example: { de: 'Was hältst du von dem Plan?', en: 'What do you think of the plan?' } },
      { pattern: 'prep', prep: 'für', prepCase: 'akk', sense: 'to consider something to be', example: { de: 'Ich halte ihn für ehrlich.', en: 'I consider him honest.' } },
      { pattern: 'prep', prep: 'an', prepCase: 'akk', sense: 'reflexive: to stick to a rule', example: { de: 'Halte dich an die Regeln!', en: 'Stick to the rules!' } },
      { pattern: 'akk', sense: 'to hold something physically', example: { de: 'Halte meine Tasche!', en: 'Hold my bag!' } },
    ],
    note: 'Four frames, four meanings.',
  },
  {
    id: 'erzaehlen', verb: 'erzählen', en: 'to tell', level: 'A2',
    frames: [
      { pattern: 'dat+akk', sense: 'to tell someone something', example: { de: 'Erzähl mir eine Geschichte!', en: 'Tell me a story!' } },
      { pattern: 'prep', prep: 'von', prepCase: 'dat', sense: 'to tell about', example: { de: 'Er erzählt von seinem Urlaub.', en: 'He is telling us about his holiday.' } },
    ],
  },

  // -------------------------------------------- fixed preposition: über + Akk
  { id: 'sich_aergern', verb: 'sich ärgern', en: 'to be annoyed about', level: 'B1', frames: [{ pattern: 'prep', prep: 'über', prepCase: 'akk', example: { de: 'Ich ärgere mich über den Fehler.', en: 'I am annoyed about the mistake.' } }] },
  { id: 'sich_wundern', verb: 'sich wundern', en: 'to be surprised at', level: 'B1', frames: [{ pattern: 'prep', prep: 'über', prepCase: 'akk', example: { de: 'Ich wundere mich über seine Reaktion.', en: 'I am surprised at his reaction.' } }] },
  { id: 'lachen', verb: 'lachen', en: 'to laugh at', level: 'A2', frames: [{ pattern: 'prep', prep: 'über', prepCase: 'akk', example: { de: 'Wir lachen über den Witz.', en: 'We are laughing at the joke.' } }] },
  { id: 'sich_beschweren', verb: 'sich beschweren', en: 'to complain about', level: 'B2', frames: [{ pattern: 'prep', prep: 'über', prepCase: 'akk', example: { de: 'Sie beschwert sich über den Lärm.', en: 'She is complaining about the noise.' } }] },
  { id: 'nachdenken', verb: 'nachdenken', en: 'to think about, to reflect on', level: 'B1', frames: [{ pattern: 'prep', prep: 'über', prepCase: 'akk', example: { de: 'Ich denke über den Vorschlag nach.', en: 'I am thinking the suggestion over.' } }] },

  // --------------------------------------------- fixed preposition: vor + Dat
  { id: 'sich_fuerchten', verb: 'sich fürchten', en: 'to be afraid of', level: 'B1', frames: [{ pattern: 'prep', prep: 'vor', prepCase: 'dat', example: { de: 'Ich fürchte mich vor Spinnen.', en: 'I am afraid of spiders.' } }] },
  { id: 'angst_haben', verb: 'Angst haben', en: 'to be afraid of', level: 'A2', frames: [{ pattern: 'prep', prep: 'vor', prepCase: 'dat', example: { de: 'Ich habe Angst vor der Prüfung.', en: 'I am afraid of the exam.' } }] },
  { id: 'warnen', verb: 'warnen', en: 'to warn about', level: 'B2', frames: [{ pattern: 'prep', prep: 'vor', prepCase: 'dat', example: { de: 'Sie warnt mich vor dem Hund.', en: 'She warns me about the dog.' } }] },
  { id: 'schuetzen', verb: 'schützen', en: 'to protect from', level: 'B2', frames: [{ pattern: 'prep', prep: 'vor', prepCase: 'dat', example: { de: 'Der Hut schützt dich vor der Sonne.', en: 'The hat protects you from the sun.' } }] },

  // ------------------------------------------- fixed preposition: zu/in + more
  { id: 'fuehren', verb: 'führen', en: 'to lead to', level: 'B2', frames: [{ pattern: 'prep', prep: 'zu', prepCase: 'dat', example: { de: 'Das führt zu Problemen.', en: 'That leads to problems.' } }] },
  { id: 'einladen', verb: 'einladen', en: 'to invite', level: 'A1', frames: [{ pattern: 'prep', prep: 'zu', prepCase: 'dat', example: { de: 'Ich lade dich zum Essen ein.', en: 'I am inviting you to dinner.' } }], note: 'The person invited is accusative, the event is zu + Dativ.' },
  { id: 'sich_verlieben', verb: 'sich verlieben', en: 'to fall in love with', level: 'B1', frames: [{ pattern: 'prep', prep: 'in', prepCase: 'akk', example: { de: 'Sie verliebt sich in ihren Nachbarn.', en: 'She falls in love with her neighbour.' } }], note: 'Accusative because falling in love is a movement into a state.' },
  {
    id: 'bestehen', verb: 'bestehen', en: 'to insist; to consist; to pass', level: 'B2',
    frames: [
      { pattern: 'prep', prep: 'auf', prepCase: 'dat', sense: 'to insist on', example: { de: 'Er besteht auf seinem Recht.', en: 'He insists on his right.' } },
      { pattern: 'prep', prep: 'aus', prepCase: 'dat', sense: 'to be made up of', example: { de: 'Das Team besteht aus vier Personen.', en: 'The team consists of four people.' } },
      { pattern: 'prep', prep: 'in', prepCase: 'dat', sense: 'to consist in (the essence of it is)', example: { de: 'Das Problem besteht in den Kosten.', en: 'The problem lies in the costs.' } },
      { pattern: 'akk', sense: 'to pass an exam', example: { de: 'Ich habe die Prüfung bestanden.', en: 'I passed the exam.' } },
    ],
    note: 'auf takes the dative here. bestehen auf is one of the few exceptions.',
  },
  {
    id: 'ankommen', verb: 'ankommen', en: 'to arrive; to depend on', level: 'B1',
    frames: [
      { pattern: 'prep', prep: 'in', prepCase: 'dat', sense: 'to arrive somewhere', example: { de: 'Wir kommen in Berlin an.', en: 'We arrive in Berlin.' } },
      { pattern: 'prep', prep: 'auf', prepCase: 'akk', sense: 'impersonal: what matters is', example: { de: 'Es kommt auf das Wetter an.', en: 'It depends on the weather.' } },
    ],
  },
]

export const VALENCY_BY_ID = new Map(VALENCY.map((v) => [v.id, v]))

/** Verbs whose meaning changes with the case or preposition. */
export const CONTRASTS = VALENCY.filter((v) => v.frames.length > 1)

/** Verbs that govern a bare case, without a preposition. */
export const CASE_VERBS = VALENCY.filter((v) => v.frames.some((f) => f.pattern !== 'prep'))

/** Verbs with at least one fixed preposition. */
export const PREP_VERBS = VALENCY.filter((v) => v.frames.some((f) => f.pattern === 'prep'))

/**
 * The five position/movement pairs. The stative verb is strong and takes a
 * dative, the causative one is weak and takes an accusative. Between them they
 * test whether the two-way prepositions have actually landed.
 */
export interface PositionPair {
  id: string
  stative: { verb: string; forms: string; en: string }
  dynamic: { verb: string; forms: string; en: string }
  example: { dat: { de: string; en: string }; akk: { de: string; en: string } }
}

export const POSITION_PAIRS: PositionPair[] = [
  {
    id: 'liegen_legen',
    stative: { verb: 'liegen', forms: 'lag, gelegen', en: 'to lie, to be lying' },
    dynamic: { verb: 'legen', forms: 'legte, gelegt', en: 'to lay, to put down' },
    example: {
      dat: { de: 'Das Buch liegt auf dem Tisch.', en: 'The book is lying on the table.' },
      akk: { de: 'Ich lege das Buch auf den Tisch.', en: 'I put the book on the table.' },
    },
  },
  {
    id: 'sitzen_setzen',
    stative: { verb: 'sitzen', forms: 'saß, gesessen', en: 'to sit, to be sitting' },
    dynamic: { verb: 'setzen', forms: 'setzte, gesetzt', en: 'to set down, to seat' },
    example: {
      dat: { de: 'Sie sitzt auf dem Stuhl.', en: 'She is sitting on the chair.' },
      akk: { de: 'Sie setzt sich auf den Stuhl.', en: 'She sits down on the chair.' },
    },
  },
  {
    id: 'stehen_stellen',
    stative: { verb: 'stehen', forms: 'stand, gestanden', en: 'to stand, to be standing' },
    dynamic: { verb: 'stellen', forms: 'stellte, gestellt', en: 'to stand something up, to put' },
    example: {
      dat: { de: 'Die Flasche steht im Kühlschrank.', en: 'The bottle is in the fridge.' },
      akk: { de: 'Ich stelle die Flasche in den Kühlschrank.', en: 'I put the bottle in the fridge.' },
    },
  },
  {
    id: 'haengen',
    stative: { verb: 'hängen', forms: 'hing, gehangen', en: 'to hang, to be hanging' },
    dynamic: { verb: 'hängen', forms: 'hängte, gehängt', en: 'to hang something up' },
    example: {
      dat: { de: 'Der Mantel hängt an der Tür.', en: 'The coat is hanging on the door.' },
      akk: { de: 'Ich hänge den Mantel an die Tür.', en: 'I hang the coat on the door.' },
    },
  },
  {
    id: 'stecken',
    stative: { verb: 'stecken', forms: 'steckte, gesteckt', en: 'to be stuck, to be in' },
    dynamic: { verb: 'stecken', forms: 'steckte, gesteckt', en: 'to stick, to put in' },
    example: {
      dat: { de: 'Der Schlüssel steckt im Schloss.', en: 'The key is in the lock.' },
      akk: { de: 'Ich stecke den Schlüssel ins Schloss.', en: 'I put the key into the lock.' },
    },
  },
]
