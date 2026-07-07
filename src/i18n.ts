// ponytail: a flat object and a lookup, not an i18n framework
import { observable } from '@legendapp/state'
import { use$ } from '@legendapp/state/react'

export const LANGS = ['en', 'fr', 'pt', 'nl'] as const
export type Lang = (typeof LANGS)[number]

// Flat dict keyed like `today.title`. Warm, playful, short: a summer-camp
// scrapbook. Portuguese is pt-BR (você, Brazilian vocab), French is informal
// (tutoiement), Dutch is informal (je/jij). No em dashes in any language.
export const dict = {
  'common.save': { en: 'Save', fr: 'Enregistrer', pt: 'Salvar', nl: 'Opslaan' },
  'common.cancel': { en: 'Cancel', fr: 'Annuler', pt: 'Cancelar', nl: 'Annuleren' },
  'common.edit': { en: 'Edit', fr: 'Modifier', pt: 'Editar', nl: 'Bewerken' },
  'common.delete': { en: 'Delete', fr: 'Supprimer', pt: 'Excluir', nl: 'Verwijderen' },
  'common.back': { en: 'Back', fr: 'Retour', pt: 'Voltar', nl: 'Terug' },
  'common.add': { en: 'Add', fr: 'Ajouter', pt: 'Adicionar', nl: 'Toevoegen' },

  'today.title': { en: 'Today', fr: "Aujourd'hui", pt: 'Hoje', nl: 'Vandaag' },
  'whoshere.title': { en: "Who's here", fr: 'Qui est là', pt: 'Quem tá aqui', nl: 'Wie is er allemaal' },
  'profiles.title': { en: 'The crew', fr: 'La bande', pt: 'A turma', nl: 'De bende' },
  'costs.title': { en: 'Costs', fr: 'Les comptes', pt: 'As contas', nl: 'De kosten' },
  'tournaments.title': { en: 'Tournaments', fr: 'Tournois', pt: 'Torneios', nl: 'Toernooien' },
  'oscars.title': { en: 'Oscars', fr: 'Les Oscars', pt: 'Oscars', nl: 'De Oscars' },
  'wifi.title': { en: 'Wifi', fr: 'Wifi', pt: 'Wi-Fi', nl: 'Wifi' },
  'wifi.networkName': { en: 'Network name', fr: 'Nom du réseau', pt: 'Nome da rede', nl: 'Netwerknaam' },
  'wifi.password': { en: 'Password', fr: 'Mot de passe', pt: 'Senha', nl: 'Wachtwoord' },
  'wifi.networkPlaceholder': { en: 'e.g. Chalet-Guest', fr: 'ex. Chalet-Invite', pt: 'ex. Chale-Visitante', nl: 'bijv. Chalet-Gast' },
  'wifi.passwordPlaceholder': { en: 'The wifi password', fr: 'Le mot de passe du wifi', pt: 'A senha do Wi-Fi', nl: 'Het wifi-wachtwoord' },
  'wifi.tapToCopy': { en: 'Tap to copy', fr: 'Appuie pour copier', pt: 'Toque para copiar', nl: 'Tik om te kopiëren' },
  'wifi.copied': { en: 'Copied!', fr: 'Copié !', pt: 'Copiado!', nl: 'Gekopieerd!' },
  'wifi.scanToJoin': { en: 'Scan to hop on', fr: 'Scanne pour te connecter', pt: 'Escaneie para entrar', nl: 'Scan om te verbinden' },
  'wifi.qrAlt': { en: 'Wifi join code', fr: 'QR code du wifi', pt: 'QR code do Wi-Fi', nl: 'Wifi-QR-code' },

  'screen.backToToday': { en: 'Back to today', fr: "Retour à aujourd'hui", pt: 'Voltar para hoje', nl: 'Terug naar vandaag' },

  'whoshere.empty': { en: 'No dates on the calendar yet', fr: 'Pas encore de dates au calendrier', pt: 'Nenhuma data no calendário ainda', nl: 'Nog geen data op de kalender' },
  'whoshere.needDatesTitle': { en: 'Still need to pick dates', fr: 'Il manque encore des dates', pt: 'Ainda faltam datas', nl: 'Nog datums nodig' },
  'whoshere.setYourDates': { en: 'Set your dates', fr: 'Choisis tes dates', pt: 'Escolha suas datas', nl: 'Kies je datums' },

  'profiles.addPerson': { en: '+ Add person', fr: "+ Ajouter quelqu'un", pt: '+ Adicionar pessoa', nl: '+ Iemand toevoegen' },
  'profiles.editMyProfile': { en: 'Edit my profile', fr: 'Modifier mon profil', pt: 'Editar meu perfil', nl: 'Mijn profiel bewerken' },
  'profiles.addTitle': { en: 'Who is joining?', fr: 'Qui nous rejoint ?', pt: 'Quem tá chegando?', nl: 'Wie komt erbij?' },
  'profiles.theirName': { en: 'Their name', fr: 'Son prénom', pt: 'O nome da pessoa', nl: 'Hun naam' },
  'profiles.datesTbd': { en: 'Dates to come', fr: 'Dates à venir', pt: 'Datas a definir', nl: 'Data volgt nog' },
  'profiles.empty': { en: 'Nobody here yet', fr: 'Personne pour le moment', pt: 'Ninguém por aqui ainda', nl: 'Nog niemand hier' },

  'common.close': { en: 'Close', fr: 'Fermer', pt: 'Fechar', nl: 'Sluiten' },

  'onboarding.title': { en: 'Welcome', fr: 'Bienvenue', pt: 'Bem-vindo', nl: 'Welkom' },
  'onboarding.whoAreYou': { en: 'Who are you?', fr: "C'est qui, toi ?", pt: 'Quem é você?', nl: 'Wie ben jij?' },
  'onboarding.imNew': { en: "I'm new here", fr: 'Je suis nouveau', pt: 'Sou novo por aqui', nl: 'Ik ben nieuw' },
  'onboarding.namePlaceholder': { en: 'Your name', fr: 'Ton prénom', pt: 'Seu nome', nl: 'Je naam' },
  'onboarding.thatsMe': { en: "That's me", fr: "C'est moi", pt: 'Sou eu', nl: 'Dat ben ik' },
  'onboarding.next': { en: 'Next', fr: 'Suivant', pt: 'Avançar', nl: 'Volgende' },
  'onboarding.buildYourBadge': { en: 'Build your badge', fr: 'Fais ton badge', pt: 'Monte seu crachá', nl: 'Maak je badge' },
  'onboarding.pickEmoji': { en: 'Pick an emoji', fr: 'Choisis un emoji', pt: 'Escolha um emoji', nl: 'Kies een emoji' },
  'onboarding.pickColor': { en: 'Pick a color', fr: 'Choisis une couleur', pt: 'Escolha uma cor', nl: 'Kies een kleur' },
  'onboarding.datesAndVibes': { en: 'Dates and vibes', fr: 'Dates et ambiance', pt: 'Datas e vibe', nl: 'Data en sfeer' },
  'onboarding.work': { en: 'Work', fr: 'Boulot', pt: 'Trabalho', nl: 'Werk' },
  'onboarding.chill': { en: 'Chill', fr: 'Chill', pt: 'Relax', nl: 'Chill' },
  'onboarding.arrival': { en: 'Arrival', fr: 'Arrivée', pt: 'Chegada', nl: 'Aankomst' },
  'onboarding.departure': { en: 'Departure', fr: 'Départ', pt: 'Partida', nl: 'Vertrek' },
  'onboarding.vibes.blaze': { en: 'Down to blaze', fr: 'Chaud pour un joint', pt: 'Topa fumar', nl: 'Zin om te blowen' },
  'onboarding.vibes.drink': { en: 'Down to drink', fr: 'Chaud pour boire', pt: 'Topa beber', nl: 'Zin om te drinken' },
  'onboarding.vibes.hasCar': { en: 'Has a car', fr: 'A une voiture', pt: 'Tem carro', nl: 'Heeft een auto' },
  'onboarding.vibes.worldCupTeam': { en: 'World Cup team', fr: 'Équipe de Coupe du Monde', pt: 'Time da Copa', nl: 'WK-team' },
  'onboarding.vibes.workChill': { en: 'Work or chill', fr: 'Boulot ou chill', pt: 'Trabalho ou relax', nl: 'Werk of chill' },

  'langSwitcher.label': { en: 'Language', fr: 'Langue', pt: 'Idioma', nl: 'Taal' },

  'costs.addExpense': { en: '+ Add an expense', fr: '+ Ajouter une dépense', pt: '+ Adicionar despesa', nl: '+ Uitgave toevoegen' },
  'costs.newExpense': { en: 'New expense', fr: 'Nouvelle dépense', pt: 'Nova despesa', nl: 'Nieuwe uitgave' },
  'costs.editExpense': { en: 'Edit expense', fr: 'Modifier la dépense', pt: 'Editar despesa', nl: 'Uitgave bewerken' },
  'costs.empty': { en: 'No expenses yet. Add the first one!', fr: 'Pas encore de dépenses. Ajoute la première !', pt: 'Nenhuma despesa ainda. Adicione a primeira!', nl: 'Nog geen uitgaven. Voeg de eerste toe!' },
  'costs.whatFor': { en: 'What was it for?', fr: "C'était pour quoi ?", pt: 'Foi pra quê?', nl: 'Waarvoor was het?' },
  'costs.labelPlaceholder': { en: 'e.g. Groceries', fr: 'ex. Les courses', pt: 'ex. Mercado', nl: 'bijv. Boodschappen' },
  'costs.amount': { en: 'Amount', fr: 'Montant', pt: 'Valor', nl: 'Bedrag' },
  'costs.date': { en: 'Date', fr: 'Date', pt: 'Data', nl: 'Datum' },
  'costs.whoPaid': { en: 'Who paid?', fr: 'Qui a payé ?', pt: 'Quem pagou?', nl: 'Wie heeft betaald?' },
  'costs.splitBetween': { en: 'Split between', fr: 'À partager entre', pt: 'Dividir entre', nl: 'Verdelen over' },
  'costs.addPhoto': { en: 'Add a photo', fr: 'Ajoute une photo', pt: 'Adicionar foto', nl: 'Foto toevoegen' },
  'costs.uploading': { en: 'Uploading...', fr: 'Envoi...', pt: 'Enviando...', nl: 'Uploaden...' },
  'costs.tapAgain': { en: 'Tap again to delete', fr: 'Appuie encore pour supprimer', pt: 'Toque de novo pra excluir', nl: 'Tik nog eens om te verwijderen' },
  'costs.settleUp': { en: 'Settle up', fr: 'On se rembourse', pt: 'Acertar as contas', nl: 'Afrekenen' },
  'costs.allSquare': { en: 'All square! Nobody owes anything.', fr: 'Tout est réglé ! Personne ne doit rien.', pt: 'Tudo quitado! Ninguém deve nada.', nl: 'Alles gelijk! Niemand is iets schuldig.' },
  'costs.markPaid': { en: 'Mark paid', fr: 'Marquer payé', pt: 'Marcar como pago', nl: 'Markeer als betaald' },
  'costs.ibanPrompt': { en: 'Add your IBAN so friends can pay you', fr: 'Ajoute ton IBAN pour que les copains te remboursent', pt: 'Adicione seu IBAN pra galera te pagar', nl: 'Voeg je IBAN toe zodat vrienden je kunnen betalen' },
  'costs.ibanPlaceholder': { en: 'Your IBAN', fr: 'Ton IBAN', pt: 'Seu IBAN', nl: 'Je IBAN' },
  'costs.settled': { en: '{from} paid {to} {amount}', fr: '{from} a payé {amount} à {to}', pt: '{from} pagou {amount} pra {to}', nl: '{from} betaalde {amount} aan {to}' },

  'tournaments.empty': { en: 'No tournaments yet. Start one!', fr: 'Pas encore de tournoi. Lance le premier !', pt: 'Nenhum torneio ainda. Comece um!', nl: 'Nog geen toernooien. Begin er een!' },
  'tournaments.newTournament': { en: '+ New tournament', fr: '+ Nouveau tournoi', pt: '+ Novo torneio', nl: '+ Nieuw toernooi' },
  'tournaments.name': { en: 'Tournament name', fr: 'Nom du tournoi', pt: 'Nome do torneio', nl: 'Naam toernooi' },
  'tournaments.namePlaceholder': { en: 'e.g. Ping pong cup', fr: 'ex. Coupe de ping-pong', pt: 'ex. Copa de pingue-pongue', nl: 'bijv. Pingpongbeker' },
  'tournaments.game': { en: 'Game', fr: 'Jeu', pt: 'Jogo', nl: 'Spel' },
  'tournaments.game.pingpong': { en: 'Ping pong', fr: 'Ping-pong', pt: 'Pingue-pongue', nl: 'Pingpong' },
  'tournaments.game.chess': { en: 'Chess', fr: 'Échecs', pt: 'Xadrez', nl: 'Schaken' },
  'tournaments.game.foosball': { en: 'Foosball', fr: 'Baby-foot', pt: 'Pebolim', nl: 'Tafelvoetbal' },
  'tournaments.create': { en: 'Create tournament', fr: 'Créer le tournoi', pt: 'Criar torneio', nl: 'Toernooi maken' },
  'tournaments.standings': { en: 'Standings', fr: 'Classement', pt: 'Classificação', nl: 'Klassement' },
  'tournaments.noStandings': { en: 'No games logged yet', fr: 'Aucune partie enregistrée', pt: 'Nenhuma partida registrada', nl: 'Nog geen potjes gelogd' },
  'tournaments.player': { en: 'Player', fr: 'Joueur', pt: 'Jogador', nl: 'Speler' },
  'tournaments.w': { en: 'W', fr: 'V', pt: 'V', nl: 'W' },
  'tournaments.l': { en: 'L', fr: 'D', pt: 'D', nl: 'V' },
  'tournaments.wins': { en: 'Wins', fr: 'Victoires', pt: 'Vitórias', nl: 'Winst' },
  'tournaments.losses': { en: 'Losses', fr: 'Défaites', pt: 'Derrotas', nl: 'Verlies' },
  'tournaments.winPct': { en: 'Win %', fr: '% vict.', pt: '% vit.', nl: 'Win %' },
  'tournaments.winRate': { en: 'Win rate', fr: 'Taux de victoire', pt: 'Taxa de vitória', nl: 'Winstpercentage' },
  'tournaments.leader': { en: 'Leader', fr: 'En tête', pt: 'Líder', nl: 'Koploper' },
  'tournaments.logGame': { en: 'Log a game', fr: 'Enregistrer une partie', pt: 'Registrar uma partida', nl: 'Log een potje' },
  'tournaments.winner': { en: 'Winner', fr: 'Gagnant', pt: 'Vencedor', nl: 'Winnaar' },
  'tournaments.loser': { en: 'Loser', fr: 'Perdant', pt: 'Perdedor', nl: 'Verliezer' },
  'tournaments.pickPerson': { en: 'Pick someone', fr: 'Choisis quelqu\'un', pt: 'Escolha alguém', nl: 'Kies iemand' },
  'tournaments.mustDiffer': { en: 'Winner and loser must be different', fr: 'Le gagnant et le perdant doivent être différents', pt: 'Vencedor e perdedor devem ser diferentes', nl: 'Winnaar en verliezer moeten verschillen' },
  'tournaments.logIt': { en: 'Log it', fr: 'Enregistrer', pt: 'Registrar', nl: 'Loggen' },
  'tournaments.needPeople': { en: 'Add people first to log games', fr: 'Ajoute des gens pour enregistrer des parties', pt: 'Adicione pessoas para registrar partidas', nl: 'Voeg eerst mensen toe om potjes te loggen' },
  'tournaments.history': { en: 'Games played', fr: 'Parties jouées', pt: 'Partidas jogadas', nl: 'Gespeelde potjes' },
  'tournaments.beat': { en: 'beat', fr: 'a battu', pt: 'venceu', nl: 'versloeg' },
  'tournaments.tapAgain': { en: 'Tap again to delete', fr: 'Appuie encore pour supprimer', pt: 'Toque de novo pra excluir', nl: 'Tik nog eens om te verwijderen' },

  'oscars.phase.propose': { en: 'Propose', fr: 'Proposer', pt: 'Propor', nl: 'Voorstellen' },
  'oscars.phase.vote': { en: 'Vote', fr: 'Voter', pt: 'Votar', nl: 'Stemmen' },
  'oscars.phase.reveal': { en: 'Reveal', fr: 'Révéler', pt: 'Revelar', nl: 'Onthullen' },
  'oscars.phaseAria': { en: 'Oscars phase', fr: 'Phase des Oscars', pt: 'Fase dos Oscars', nl: 'Oscars-fase' },
  'oscars.newCategory': { en: '+ Category', fr: '+ Catégorie', pt: '+ Categoria', nl: '+ Categorie' },
  'oscars.categoryName': { en: 'Category name', fr: 'Nom de la catégorie', pt: 'Nome da categoria', nl: 'Naam categorie' },
  'oscars.categoryPlaceholder': { en: 'e.g. Best wipeout', fr: 'ex. Meilleure gamelle', pt: 'ex. Melhor tombo', nl: 'bijv. Beste smakker' },
  'oscars.createCategory': { en: 'Create category', fr: 'Créer la catégorie', pt: 'Criar categoria', nl: 'Categorie maken' },
  'oscars.emptyCategories': { en: 'No categories yet. Add the first one!', fr: 'Pas encore de catégories. Ajoute la première !', pt: 'Nenhuma categoria ainda. Adicione a primeira!', nl: 'Nog geen categorieën. Voeg de eerste toe!' },
  'oscars.nominate': { en: '+ Propose a moment', fr: '+ Proposer un moment', pt: '+ Propor um momento', nl: '+ Moment voorstellen' },
  'oscars.momentTitle': { en: 'The moment', fr: 'Le moment', pt: 'O momento', nl: 'Het moment' },
  'oscars.momentPlaceholder': { en: 'What happened?', fr: "Qu'est-ce qui s'est passé ?", pt: 'O que rolou?', nl: 'Wat gebeurde er?' },
  'oscars.addPhoto': { en: 'Add a photo', fr: 'Ajoute une photo', pt: 'Adicionar foto', nl: 'Foto toevoegen' },
  'oscars.uploading': { en: 'Uploading...', fr: 'Envoi...', pt: 'Enviando...', nl: 'Uploaden...' },
  'oscars.submitNomination': { en: 'Propose it', fr: 'Proposer', pt: 'Propor', nl: 'Voorstellen' },
  'oscars.emptyNominations': { en: 'No moments proposed yet', fr: 'Aucun moment proposé', pt: 'Nenhum momento proposto ainda', nl: 'Nog geen momenten voorgesteld' },
  'oscars.youVoted': { en: 'You voted ✓', fr: 'Tu as voté ✓', pt: 'Você votou ✓', nl: 'Je hebt gestemd ✓' },
  'oscars.tapAgain': { en: 'Tap again to delete', fr: 'Appuie encore pour supprimer', pt: 'Toque de novo pra excluir', nl: 'Tik nog eens om te verwijderen' },
  'oscars.ceremonyTitle': { en: 'The winners', fr: 'Les gagnants', pt: 'Os vencedores', nl: 'De winnaars' },
  'oscars.scrollHint': { en: 'Scroll to reveal each winner', fr: 'Fais défiler pour chaque gagnant', pt: 'Role para ver cada vencedor', nl: 'Scroll voor elke winnaar' },
  'oscars.winnerIs': { en: 'And the winner is', fr: 'Et le gagnant est', pt: 'E o vencedor é', nl: 'En de winnaar is' },
  'oscars.votes': { en: '{n} votes', fr: '{n} votes', pt: '{n} votos', nl: '{n} stemmen' },
  'oscars.noVotesYet': { en: 'No votes yet', fr: 'Pas encore de votes', pt: 'Nenhum voto ainda', nl: 'Nog geen stemmen' },
  'oscars.emptyReveal': { en: 'Nothing to reveal yet', fr: 'Rien à révéler pour le moment', pt: 'Nada para revelar ainda', nl: 'Nog niets te onthullen' },
} satisfies Record<string, Record<Lang, string>>

const STORAGE_KEY = 'chindrieux.lang'

function isLang(value: string | null | undefined): value is Lang {
  return value != null && (LANGS as readonly string[]).includes(value)
}

// Map a navigator.language string (e.g. 'pt-BR') to a supported Lang by its
// two-letter prefix; unknown or missing falls back to en.
export function pickLang(navLang: string | undefined): Lang {
  const prefix = (navLang ?? '').slice(0, 2).toLowerCase()
  return isLang(prefix) ? prefix : 'en'
}

// Replace every {name} placeholder with its var. Unknown placeholders are left
// intact so a missing var is visible rather than silently blank.
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  let out = template
  for (const [key, value] of Object.entries(vars))
    out = out.replaceAll(`{${key}}`, String(value))
  return out
}

// Pure lookup: resolve key in the current language, then interpolate. A missing
// key returns the key itself (visible in dev, never throws).
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const entry = (dict as Record<string, Record<Lang, string>>)[key]
  if (!entry) return key
  return interpolate(entry[lang], vars)
}

function initialLang(): Lang {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLang(stored)) return stored
  }
  const navLang = typeof navigator !== 'undefined' ? navigator.language : undefined
  return pickLang(navLang)
}

export const lang$ = observable<Lang>(initialLang())

lang$.onChange(({ value }) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
})

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const lang = use$(lang$)
  return (key, vars) => translate(lang, key, vars)
}
