import type { Locale } from "@/lib/locale";

/**
 * Everything a member reads on the reply page, in English and Spanish.
 * Scripture comes from the Bible SDK in each language and is never translated by AI.
 */
export const REPLY_COPY = {
  en: {
    switchTo: "Español",
    closedHeading: "Replies for this sermon are closed.",
    closedBody: "Thanks for scanning. Look for the code again next Sunday.",
    heading: "What will stick with you?",
    sub: "A word, a line, a verse. However you'd say it.",
    takeawayPlaceholder: "Type what stuck with you",
    charsLeft: (n: number) => `${n} characters left`,
    questionLabel: "Any question it raised?",
    optional: "(optional)",
    questionPlaceholder: "Something you're still wondering about",
    noteLabel: "Send my words back to me on Wednesday",
    noteHint: "One email with the verse. We delete your address after 14 days.",
    emailLabel: "Your email",
    emailPlaceholder: "you@example.com",
    send: "Send",
    sending: "Sending",
    footer: "Anonymous. Your pastor reads every reply. AI helps sort them.",
    emptyTakeaway: "Tell us what will stick with you.",
    emptyEmail: "Add your email, or untick the Wednesday note.",
    thanks: "Thank you.",
    youSaid: "You said",
    pastorReads: "Your pastor reads every reply this week.",
    noteScheduled: " We'll send your words back to you Wednesday morning.",
    nextStepTitle: (church: string) => `Take a next step at ${church}`,
    nextStepBody: "New here, or want to get connected? Fill in the church's connect card.",
    nextStepLink: "Open the connect card",
    another: "Add another thought",
    careHeading: "Thank you for telling us.",
    careBody:
      "It sounds like you may be carrying something heavy. You don't have to carry it alone.",
    crisisTitle: "If you're in danger or thinking about ending your life",
    crisisLine: "Call or text 988, any time, day or night.",
    crisisCall: "Call or text 988",
    crisisText: null as string | null,
    crisisOutside: "Outside the US, call your local emergency number.",
    talkTo: (church: string) => `Talk to someone at ${church}`,
    reachOutTitle: "Want someone to reach out?",
    reachOutBody:
      "Your reply here stays anonymous. On the church's own form you choose what to share and how they can reach you.",
    reachOutButton: "Ask someone to reach out",
    careFooter:
      "Your reply is still anonymous. Your pastor will see it first in this week's replies.",
    verse: {
      text: "Your word is a lamp to my feet and a light to my path.",
      reference: "Psalm 119:105",
      translation: "Berean Standard Bible (BSB)",
    },
  },
  es: {
    switchTo: "English",
    closedHeading: "Ya no se reciben respuestas para este sermón.",
    closedBody: "Gracias por escanear. Busca el código de nuevo el próximo domingo.",
    heading: "¿Qué te vas a llevar de hoy?",
    sub: "Una palabra, una frase, un versículo. Como tú lo dirías.",
    takeawayPlaceholder: "Escribe lo que te quedó",
    charsLeft: (n: number) => `Te quedan ${n} caracteres`,
    questionLabel: "¿Te quedó alguna pregunta?",
    optional: "(opcional)",
    questionPlaceholder: "Algo que todavía te preguntas",
    noteLabel: "Envíame mis palabras el miércoles",
    noteHint: "Un correo con el versículo. Borramos tu correo después de 14 días.",
    emailLabel: "Tu correo electrónico",
    emailPlaceholder: "tu@ejemplo.com",
    send: "Enviar",
    sending: "Enviando",
    footer: "Es anónimo. Tu pastor lee cada respuesta. La IA ayuda a ordenarlas.",
    emptyTakeaway: "Cuéntanos qué te vas a llevar.",
    emptyEmail: "Escribe tu correo o desmarca la nota del miércoles.",
    thanks: "Gracias.",
    youSaid: "Dijiste",
    pastorReads: "Tu pastor lee cada respuesta esta semana.",
    noteScheduled: " Te enviaremos tus palabras el miércoles por la mañana.",
    nextStepTitle: (church: string) => `Da un siguiente paso en ${church}`,
    nextStepBody: "¿Eres nuevo o quieres conectarte? Llena la tarjeta de conexión de la iglesia.",
    nextStepLink: "Abrir la tarjeta de conexión",
    another: "Agregar otra idea",
    careHeading: "Gracias por contárnoslo.",
    careBody: "Parece que estás cargando algo pesado. No tienes que cargarlo solo.",
    crisisTitle: "Si estás en peligro o piensas en quitarte la vida",
    crisisLine: "Llama al 988 y marca 2 para español, a cualquier hora, de día o de noche.",
    crisisCall: "Llamar al 988",
    crisisText: "O envía AYUDA por mensaje de texto al 988.",
    crisisOutside: "Fuera de Estados Unidos, llama al número de emergencias de tu país.",
    talkTo: (church: string) => `Habla con alguien de ${church}`,
    reachOutTitle: "¿Quieres que alguien se comunique contigo?",
    reachOutBody:
      "Tu respuesta aquí sigue siendo anónima. En el formulario de la iglesia tú decides qué compartir y cómo contactarte.",
    reachOutButton: "Pedir que me contacten",
    careFooter:
      "Tu respuesta sigue siendo anónima. Tu pastor la verá primero entre las respuestas de esta semana.",
    verse: {
      // Quoted exactly from the Reina-Valera 1909 via the faith.tools Bible SDK (spa_r09).
      text: "Lámpara es á mis pies tu palabra, y lumbrera á mi camino.",
      reference: "Salmos 119:105",
      translation: "Reina-Valera 1909 (RV1909)",
    },
  },
} as const satisfies Record<Locale, unknown>;

export type ReplyCopy = (typeof REPLY_COPY)[Locale];

/** Messages the server can send back, so a Spanish speaker never sees an English error. */
const SERVER_MESSAGES_ES: Array<[RegExp, string]> = [
  [/^Tell us what will stick with you/, "Cuéntanos qué te vas a llevar."],
  [/^Keep it under (\d+) characters/, "Escríbelo en menos de $1 caracteres."],
  [/^Enter an email address/, "Escribe un correo como nombre@ejemplo.com."],
  [
    /^You've sent a lot of replies/,
    "Enviaste muchas respuestas seguidas. Espera un minuto e inténtalo de nuevo.",
  ],
  [/^Replies for this sermon are closed/, "Ya no se reciben respuestas para este sermón."],
  [/^We couldn't find that sermon/, "No encontramos ese sermón."],
  [/^You seem to be offline/, "Parece que no tienes conexión. Revísala e inténtalo de nuevo."],
  [/^Check this answer/, "Revisa esta respuesta e inténtalo de nuevo."],
];

export function translateServerMessage(message: string | undefined, locale: Locale) {
  if (!message || locale === "en") return message;
  for (const [pattern, spanish] of SERVER_MESSAGES_ES) {
    const match = message.match(pattern);
    if (match) return spanish.replace("$1", match[1] ?? "");
  }
  return "Algo salió mal. Inténtalo de nuevo.";
}
