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

  'tabs.crew': { en: 'Crew', fr: 'Bande', pt: 'Turma', nl: 'Bende' },
  'tabs.costs': { en: 'Costs', fr: 'Comptes', pt: 'Contas', nl: 'Kosten' },
  'tabs.games': { en: 'Games', fr: 'Jeux', pt: 'Jogos', nl: 'Spellen' },
  'tabs.oscars': { en: 'Oscars', fr: 'Oscars', pt: 'Oscars', nl: 'Oscars' },
  'tabs.info': { en: 'Info', fr: 'Infos', pt: 'Info', nl: 'Info' },

  'today.appTitle': { en: 'ChinChin 26', fr: 'ChinChin 26', pt: 'ChinChin 26', nl: 'ChinChin 26' },
  'today.navAria': { en: 'Screens', fr: 'Écrans', pt: 'Telas', nl: 'Schermen' },
  'today.daysToGo': { en: '{n} days to go ☀️', fr: 'Plus que {n} jours ☀️', pt: 'Faltam {n} dias ☀️', nl: 'Nog {n} dagen ☀️' },
  'today.daysToGo.one': { en: '{n} day to go ☀️', fr: 'Plus que {n} jour ☀️', pt: 'Falta {n} dia ☀️', nl: 'Nog {n} dag ☀️' },
  'today.stillMissing': { en: 'Still missing a badge or dates: {names}', fr: 'Badge ou dates manquants : {names}', pt: 'Ainda sem crachá ou datas: {names}', nl: 'Nog geen badge of datums: {names}' },
  'today.shareLink': { en: 'Share the link 💌', fr: 'Partage le lien 💌', pt: 'Compartilhe o link 💌', nl: 'Deel de link 💌' },
  'today.inviteLine': { en: 'Join our getaway scrapbook!', fr: 'Rejoins notre carnet de vacances !', pt: 'Entre no nosso álbum da viagem!', nl: 'Doe mee met ons vakantieplakboek!' },
  'today.arrivingToday': { en: 'Arriving today 👋', fr: "Ils arrivent aujourd'hui 👋", pt: 'Chegando hoje 👋', nl: 'Komen vandaag aan 👋' },
  'today.leavingToday': { en: 'Leaving today 🧳', fr: "Ils partent aujourd'hui 🧳", pt: 'Indo embora hoje 🧳', nl: 'Vertrekken vandaag 🧳' },
  'today.hereNow': { en: 'Here now', fr: 'Sur place', pt: 'Aqui agora', nl: 'Nu hier' },
  'today.shareRecap': { en: 'Share a recap 💌', fr: 'Partage le souvenir 💌', pt: 'Compartilhe a recordação 💌', nl: 'Deel een terugblik 💌' },
  'today.recapLine': { en: 'What a trip! Relive it here:', fr: 'Quel séjour ! Revis-le ici :', pt: 'Que viagem! Reviva aqui:', nl: 'Wat een trip! Herbeleef het hier:' },
  'whoshere.title': { en: "Who's here", fr: 'Qui est là', pt: 'Quem tá aqui', nl: 'Wie is er allemaal' },
  'profiles.title': { en: 'The crew', fr: 'La bande', pt: 'A turma', nl: 'De bende' },
  'costs.title': { en: 'Costs', fr: 'Les comptes', pt: 'As contas', nl: 'De kosten' },
  'tournaments.title': { en: 'Tournaments', fr: 'Tournois', pt: 'Torneios', nl: 'Toernooien' },
  'oscars.title': { en: 'Oscars', fr: 'Les Oscars', pt: 'Oscars', nl: 'De Oscars' },
  'whoshere.empty': { en: 'No dates on the calendar yet', fr: 'Pas encore de dates au calendrier', pt: 'Nenhuma data no calendário ainda', nl: 'Nog geen data op de kalender' },
  'whoshere.headcount': { en: 'Here', fr: 'Présents', pt: 'Presentes', nl: 'Aanwezig' },
  'whoshere.peopleOnDay': { en: '{n} here', fr: '{n} présents', pt: '{n} presentes', nl: '{n} aanwezig' },
  'whoshere.crewTotal': { en: 'We are {n} on the trip', fr: 'On est {n} pour le séjour', pt: 'Somos {n} na viagem', nl: 'We zijn met {n} op reis' },
  'whoshere.crewTotal.one': { en: 'It is just you so far', fr: "Pour l'instant, il n'y a que toi", pt: 'Por enquanto é só você', nl: 'Voorlopig ben jij de enige' },
  'whoshere.movementsTitle': { en: 'Arrivals & departures', fr: 'Arrivées & départs', pt: 'Chegadas & partidas', nl: 'Aankomsten & vertrek' },
  'whoshere.hereEachDay': { en: 'Here each day', fr: 'Présents chaque jour', pt: 'Presentes por dia', nl: 'Aanwezig per dag' },
  'whoshere.needDatesTitle': { en: 'Still need to pick dates', fr: 'Il manque encore des dates', pt: 'Ainda faltam datas', nl: 'Nog datums nodig' },
  'whoshere.setYourDates': { en: 'Set your dates', fr: 'Choisis tes dates', pt: 'Escolha suas datas', nl: 'Kies je datums' },
  'whoshere.markerLaeti': { en: "Laeti's birthday", fr: 'Anniversaire de Laeti', pt: 'Aniversário da Laeti', nl: 'Verjaardag van Laeti' },
  'whoshere.marker14juillet': { en: '14 juillet + World Cup semi-final', fr: '14 juillet + demi-finale de la Coupe du monde', pt: '14 de julho + semifinal da Copa', nl: 'Quatorze juillet + WK halve finale' },
  'whoshere.markerSemi': { en: 'World Cup semi-final', fr: 'Demi-finale de la Coupe du monde', pt: 'Semifinal da Copa', nl: 'WK halve finale' },
  'whoshere.markerFinal': { en: 'World Cup final', fr: 'Finale de la Coupe du monde', pt: 'Final da Copa', nl: 'WK finale' },

  'profiles.addPerson': { en: '+ Add person', fr: "+ Ajouter quelqu'un", pt: '+ Adicionar pessoa', nl: '+ Iemand toevoegen' },
  'profiles.addMany': { en: '+ Add a bunch', fr: '+ Ajouter plusieurs', pt: '+ Adicionar vários', nl: '+ Meerdere toevoegen' },
  'profiles.addManyHint': { en: 'One name per line, or commas', fr: 'Un prénom par ligne, ou des virgules', pt: 'Um nome por linha, ou vírgulas', nl: 'Eén naam per regel, of komma\'s' },
  'profiles.editMyProfile': { en: 'Edit my profile', fr: 'Modifier mon profil', pt: 'Editar meu perfil', nl: 'Mijn profiel bewerken' },
  'profiles.tapAgainDelete': { en: 'Tap again to delete', fr: 'Appuie encore pour supprimer', pt: 'Toque de novo pra excluir', nl: 'Tik nog eens om te verwijderen' },
  'profiles.addTitle': { en: 'Who is joining?', fr: 'Qui nous rejoint ?', pt: 'Quem tá chegando?', nl: 'Wie komt erbij?' },
  'profiles.theirName': { en: 'Their name', fr: 'Son prénom', pt: 'O nome da pessoa', nl: 'Hun naam' },
  'profiles.datesTbd': { en: 'Dates to come', fr: 'Dates à venir', pt: 'Datas a definir', nl: 'Data volgt nog' },
  'profiles.empty': { en: 'Nobody here yet', fr: 'Personne pour le moment', pt: 'Ninguém por aqui ainda', nl: 'Nog niemand hier' },

  'info.installTitle': { en: 'Put me on your home screen 📌', fr: "Mets-moi sur ton écran d'accueil 📌", pt: 'Me coloca na sua tela inicial 📌', nl: 'Zet me op je beginscherm 📌' },
  'info.installIos': { en: 'Tap Share, then "Add to Home Screen"', fr: 'Appuie sur Partager, puis "Sur l\'écran d\'accueil"', pt: 'Toque em Compartilhar e depois em "Adicionar à Tela de Início"', nl: 'Tik op Delen en dan op "Zet op beginscherm"' },
  'info.installButton': { en: 'Install the app', fr: "Installer l'appli", pt: 'Instalar o app', nl: 'Installeer de app' },
  'info.installFallback': { en: 'In your browser menu, pick "Add to Home screen"', fr: 'Dans le menu du navigateur, choisis "Ajouter à l\'écran d\'accueil"', pt: 'No menu do navegador, escolha "Adicionar à tela inicial"', nl: 'Kies in je browsermenu "Toevoegen aan startscherm"' },

  'common.close': { en: 'Close', fr: 'Fermer', pt: 'Fechar', nl: 'Sluiten' },
  'common.uploadFailed': { en: 'Upload failed. Try again.', fr: "Échec de l'envoi. Réessaie.", pt: 'Falha no envio. Tente de novo.', nl: 'Uploaden mislukt. Probeer opnieuw.' },

  'onboarding.title': { en: 'Hey, you made it!', fr: 'Salut toi !', pt: 'Aí, você chegou!', nl: 'Hé, daar ben je!' },
  'onboarding.whoAreYou': { en: 'Who goes there?', fr: 'Qui va là ?', pt: 'Quem vem lá?', nl: 'Wie is daar?' },
  'onboarding.imNew': { en: 'New around here', fr: 'Petit nouveau ici', pt: 'Novato por aqui', nl: 'Nieuw hier' },
  'onboarding.namePlaceholder': { en: 'Your name (the real one)', fr: 'Ton prénom (le vrai)', pt: 'Seu nome (o de verdade)', nl: 'Je naam (je echte)' },
  'onboarding.thatsMe': { en: "That's me", fr: "C'est moi", pt: 'Sou eu', nl: 'Dat ben ik' },
  'onboarding.claimHint': { en: 'Only tap your own name 😉', fr: 'Appuie seulement sur ton prénom 😉', pt: 'Só toque no seu próprio nome 😉', nl: 'Tik alleen op je eigen naam 😉' },
  'onboarding.next': { en: 'Next', fr: 'Suivant', pt: 'Avançar', nl: 'Volgende' },
  'onboarding.buildYourBadge': { en: 'Build your badge', fr: 'Fais ton badge', pt: 'Monte seu crachá', nl: 'Maak je badge' },
  'onboarding.pickEmoji': { en: 'Which emoji is so you?', fr: 'Quel emoji te ressemble ?', pt: 'Qual emoji é a sua cara?', nl: 'Welke emoji ben jij?' },
  'onboarding.pickColor': { en: 'Pick a color (choose wisely)', fr: 'Ta couleur (choisis bien)', pt: 'Sua cor (escolha com sabedoria)', nl: 'Je kleur (kies verstandig)' },
  'onboarding.customEmoji': { en: 'Or type your own', fr: 'Ou tape le tien', pt: 'Ou digite o seu', nl: 'Of typ je eigen' },
  'onboarding.stayDates': { en: 'When are you around?', fr: 'Tu es là quand ?', pt: 'Quando você vai estar aí?', nl: 'Wanneer ben je er?' },
  'calendar.hint': { en: 'Tap your arrival, then your departure', fr: "Appuie sur ton arrivée, puis ton départ", pt: 'Toque na chegada, depois na partida', nl: 'Tik op je aankomst, dan je vertrek' },
  'onboarding.datesAndVibes': { en: 'Now, the important questions', fr: 'Passons aux questions sérieuses', pt: 'Agora, as perguntas que importam', nl: 'Nu de echte vragen' },
  'onboarding.work': { en: 'Work', fr: 'Boulot', pt: 'Trabalho', nl: 'Werk' },
  'onboarding.chill': { en: 'Chill', fr: 'Chill', pt: 'Relax', nl: 'Chill' },
  'onboarding.arrival': { en: 'Arrival', fr: 'Arrivée', pt: 'Chegada', nl: 'Aankomst' },
  'onboarding.departure': { en: 'Departure', fr: 'Départ', pt: 'Partida', nl: 'Vertrek' },
  'onboarding.vibes.blaze': { en: 'Do you smoke up?', fr: 'Tu fumes ?', pt: 'Você fuma um?', nl: 'Rook je mee?' },
  'onboarding.vibes.drink': { en: 'First in line at apéro?', fr: "Premier à l'apéro ?", pt: 'Primeiro da fila no brinde?', nl: 'Eerste bij de borrel?' },
  'onboarding.vibes.hasCar': { en: 'Bringing wheels?', fr: 'Tu ramènes une caisse ?', pt: 'Vem de carro (é o motora)?', nl: 'Neem je wielen mee?' },
  'onboarding.vibes.meat': { en: 'Meat on your plate?', fr: "De la viande dans l'assiette ?", pt: 'Carne no prato?', nl: 'Vlees op je bord?' },
  'onboarding.vibes.worldCupTeam': { en: 'Screaming for who at the World Cup?', fr: 'Tu cries pour qui à la Coupe du Monde ?', pt: 'Torcendo pra quem na Copa?', nl: 'Voor wie schreeuw je bij het WK?' },
  'onboarding.vibes.teamPlaceholder': { en: 'e.g. Cabo Verde', fr: 'ex. le Cap-Vert', pt: 'ex. Cabo Verde', nl: 'bijv. Kaapverdië' },
  'onboarding.vibes.workChill': { en: 'Laptop or hammock?', fr: 'Ordi ou transat ?', pt: 'Notebook ou rede?', nl: 'Laptop of hangmat?' },

  'langSwitcher.label': { en: 'Language', fr: 'Langue', pt: 'Idioma', nl: 'Taal' },

  'costs.addExpense': { en: '+ Add an expense', fr: '+ Ajouter une dépense', pt: '+ Adicionar despesa', nl: '+ Uitgave toevoegen' },
  'costs.newExpense': { en: 'New expense', fr: 'Nouvelle dépense', pt: 'Nova despesa', nl: 'Nieuwe uitgave' },
  'costs.editExpense': { en: 'Edit expense', fr: 'Modifier la dépense', pt: 'Editar despesa', nl: 'Uitgave bewerken' },
  'costs.empty': { en: 'No expenses yet. Add the first one!', fr: 'Pas encore de dépenses. Ajoute la première !', pt: 'Nenhuma despesa ainda. Adicione a primeira!', nl: 'Nog geen uitgaven. Voeg de eerste toe!' },
  'costs.whatFor': { en: 'What was it for?', fr: "C'était pour quoi ?", pt: 'Foi pra quê?', nl: 'Waarvoor was het?' },
  'costs.labelPlaceholder': { en: 'e.g. Groceries', fr: 'ex. Les courses', pt: 'ex. Mercado', nl: 'bijv. Boodschappen' },
  'costs.amount': { en: 'Amount', fr: 'Montant', pt: 'Valor', nl: 'Bedrag' },
  'costs.date': { en: 'Date', fr: 'Date', pt: 'Data', nl: 'Datum' },
  'costs.until': { en: 'Until (optional)', fr: "Jusqu'au (optionnel)", pt: 'Até (opcional)', nl: 'Tot (optioneel)' },
  'costs.perDayHint': { en: 'Split by days on site', fr: 'Partagé selon les jours sur place', pt: 'Dividido pelos dias no local', nl: 'Verdeeld naar dagen ter plaatse' },
  'costs.drinkers': { en: 'Drinkers', fr: 'Buveurs', pt: 'Do brinde', nl: 'Drinkers' },
  'costs.meatEaters': { en: 'Meat eaters', fr: 'Carnivores', pt: 'Carnívoros', nl: 'Vleeseters' },
  'costs.whoPaid': { en: 'Who paid?', fr: 'Qui a payé ?', pt: 'Quem pagou?', nl: 'Wie heeft betaald?' },
  'costs.splitBetween': { en: 'Split between', fr: 'À partager entre', pt: 'Dividir entre', nl: 'Verdelen over' },
  'costs.everyone': { en: 'Everyone', fr: 'Tout le monde', pt: 'Todo mundo', nl: 'Iedereen' },
  'costs.addPhoto': { en: 'Add a photo', fr: 'Ajoute une photo', pt: 'Adicionar foto', nl: 'Foto toevoegen' },
  'costs.uploading': { en: 'Uploading...', fr: 'Envoi...', pt: 'Enviando...', nl: 'Uploaden...' },
  'costs.tapAgain': { en: 'Tap again to delete', fr: 'Appuie encore pour supprimer', pt: 'Toque de novo pra excluir', nl: 'Tik nog eens om te verwijderen' },
  'costs.settleUp': { en: 'Settle up', fr: 'On se rembourse', pt: 'Acertar as contas', nl: 'Afrekenen' },
  'costs.expenses': { en: 'Expenses', fr: 'Les dépenses', pt: 'Despesas', nl: 'Uitgaven' },  'costs.youOwe': { en: 'You owe {amount}', fr: 'Tu dois {amount}', pt: 'Você deve {amount}', nl: 'Je moet {amount} betalen' },
  'costs.youAreOwed': { en: "You're owed {amount}", fr: 'On te doit {amount}', pt: 'Estão te devendo {amount}', nl: 'Je krijgt nog {amount}' },
  'costs.yourShare': { en: 'Your share: {amount}', fr: 'Ta part : {amount}', pt: 'Sua parte: {amount}', nl: 'Jouw deel: {amount}' },
  'costs.allSquare': { en: 'All square! Nobody owes anything.', fr: 'Tout est réglé ! Personne ne doit rien.', pt: 'Tudo quitado! Ninguém deve nada.', nl: 'Alles gelijk! Niemand is iets schuldig.' },
  'costs.markPaid': { en: 'Mark paid', fr: 'Marquer payé', pt: 'Marcar como pago', nl: 'Markeer als betaald' },
  'costs.sentPartial': { en: 'Sent part of it', fr: "J'ai envoyé une partie", pt: 'Enviei uma parte', nl: 'Deel verstuurd' },
  'costs.amountSent': { en: 'How much did you send?', fr: 'Combien as-tu envoyé ?', pt: 'Quanto você enviou?', nl: 'Hoeveel heb je verstuurd?' },
  'costs.recordPayment': { en: 'Record payment', fr: 'Enregistrer le paiement', pt: 'Registrar pagamento', nl: 'Betaling vastleggen' },
  'costs.partialHint': { en: 'The rest stays on the tab.', fr: 'Le reste reste à régler.', pt: 'O resto continua na conta.', nl: 'De rest blijft openstaan.' },
  'costs.ibanPrompt': { en: 'Add your IBAN so friends can pay you', fr: 'Ajoute ton IBAN pour que les copains te remboursent', pt: 'Adicione seu IBAN pra galera te pagar', nl: 'Voeg je IBAN toe zodat vrienden je kunnen betalen' },
  'costs.ibanPlaceholder': { en: 'Your IBAN', fr: 'Ton IBAN', pt: 'Seu IBAN', nl: 'Je IBAN' },
  'costs.settled': { en: '{from} paid {to} {amount}', fr: '{from} a payé {amount} à {to}', pt: '{from} pagou {amount} pra {to}', nl: '{from} betaalde {amount} aan {to}' },
  'costs.undoPayment': { en: 'Undo this payment', fr: 'Annuler ce paiement', pt: 'Desfazer este pagamento', nl: 'Deze betaling ongedaan maken' },
  'costs.tapToUndo': { en: 'Tap again to undo', fr: 'Appuie encore pour annuler', pt: 'Toque de novo pra desfazer', nl: 'Tik nog eens om ongedaan te maken' },
  'costs.totalSoFar': { en: 'Total so far: {total} · your part: {mine}', fr: 'Total pour le moment : {total} · ta part : {mine}', pt: 'Total até agora: {total} · sua parte: {mine}', nl: 'Totaal tot nu toe: {total} · jouw deel: {mine}' },
  'costs.perHead': { en: 'Per person per day', fr: 'Par personne et par jour', pt: 'Por pessoa por dia', nl: 'Per persoon per dag' },
  'costs.perHeadNote': { en: '{rate} per person per day', fr: '{rate} par personne et par jour', pt: '{rate} por pessoa por dia', nl: '{rate} per persoon per dag' },
  'costs.copyIban': { en: 'Copy IBAN', fr: "Copier l'IBAN", pt: 'Copiar IBAN', nl: 'IBAN kopiëren' },
  'costs.copied': { en: 'Copied ✓', fr: 'Copié ✓', pt: 'Copiado ✓', nl: 'Gekopieerd ✓' },
  'costs.customAmounts': { en: 'Custom amounts', fr: 'Montants perso', pt: 'Valores personalizados', nl: 'Eigen bedragen' },
  'costs.equalSplit': { en: 'Split equally', fr: 'Partager également', pt: 'Dividir igualmente', nl: 'Gelijk verdelen' },
  'costs.remaining': { en: '{amount} remaining', fr: '{amount} restant', pt: '{amount} restante', nl: '{amount} resterend' },
  'costs.over': { en: '{amount} over', fr: '{amount} en trop', pt: '{amount} a mais', nl: '{amount} te veel' },
  'costs.hereOnDate': { en: 'Here', fr: 'Sur place', pt: 'Aqui', nl: 'Hier' },
  'costs.goneOnDate': { en: 'Gone', fr: 'Absents', pt: 'Ausentes', nl: 'Afwezig' },
  'costs.noDates': { en: 'No dates', fr: 'Pas de dates', pt: 'Sem datas', nl: 'Geen datums' },

  'tournaments.empty': { en: 'No tournaments yet. Start one!', fr: 'Pas encore de tournoi. Lance le premier !', pt: 'Nenhum torneio ainda. Comece um!', nl: 'Nog geen toernooien. Begin er een!' },
  'tournaments.newTournament': { en: '+ New tournament', fr: '+ Nouveau tournoi', pt: '+ Novo torneio', nl: '+ Nieuw toernooi' },
  'tournaments.name': { en: 'Tournament name', fr: 'Nom du tournoi', pt: 'Nome do torneio', nl: 'Naam toernooi' },
  'tournaments.namePlaceholder': { en: 'e.g. Ping pong cup', fr: 'ex. Coupe de ping-pong', pt: 'ex. Copa de pingue-pongue', nl: 'bijv. Pingpongbeker' },
  'tournaments.game': { en: 'Game', fr: 'Jeu', pt: 'Jogo', nl: 'Spel' },
  'tournaments.game.pingpong': { en: 'Ping pong', fr: 'Ping-pong', pt: 'Pingue-pongue', nl: 'Pingpong' },
  'tournaments.game.chess': { en: 'Chess', fr: 'Échecs', pt: 'Xadrez', nl: 'Schaken' },
  'tournaments.game.foosball': { en: 'Foosball', fr: 'Baby-foot', pt: 'Pebolim', nl: 'Tafelvoetbal' },
  'tournaments.game.tennis': { en: 'Tennis', fr: 'Tennis', pt: 'Tênis', nl: 'Tennis' },
  'tournaments.game.other': { en: 'Something else…', fr: 'Autre chose…', pt: 'Outra coisa…', nl: 'Iets anders…' },
  'tournaments.customGame': { en: 'Your sport', fr: 'Ton sport', pt: 'Seu esporte', nl: 'Jouw sport' },
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
  'tournaments.deleteTournament': { en: 'Delete tournament', fr: 'Supprimer le tournoi', pt: 'Excluir torneio', nl: 'Toernooi verwijderen' },

  'oscars.phase.propose': { en: 'Propose', fr: 'Proposer', pt: 'Propor', nl: 'Voorstellen' },
  'oscars.phase.vote': { en: 'Vote', fr: 'Voter', pt: 'Votar', nl: 'Stemmen' },
  'oscars.phase.reveal': { en: 'Reveal', fr: 'Révéler', pt: 'Revelar', nl: 'Onthullen' },
  'oscars.phaseAria': { en: 'Oscars phase', fr: 'Phase des Oscars', pt: 'Fase dos Oscars', nl: 'Oscars-fase' },
  'oscars.startVoting': { en: 'Open the vote 🗳️', fr: 'Ouvrir le vote 🗳️', pt: 'Abrir a votação 🗳️', nl: 'Open de stemming 🗳️' },
  'oscars.startCeremony': { en: 'Start the ceremony 🎬', fr: 'Lancer la cérémonie 🎬', pt: 'Começar a cerimônia 🎬', nl: 'Start de ceremonie 🎬' },
  'oscars.confirmPhase': { en: 'Tap again to confirm. This changes it for everyone!', fr: 'Appuie encore pour confirmer. Ça change pour tout le monde !', pt: 'Toque de novo pra confirmar. Vale pra todo mundo!', nl: 'Tik nog eens om te bevestigen. Dit geldt voor iedereen!' },
  'oscars.backToProposing': { en: 'Back to proposing', fr: 'Retour aux propositions', pt: 'Voltar às propostas', nl: 'Terug naar voorstellen' },
  'oscars.reopenVoting': { en: 'Reopen the vote', fr: 'Rouvrir le vote', pt: 'Reabrir a votação', nl: 'Stemming heropenen' },
  'oscars.votedProgress': { en: 'You voted in {done}/{total} categories', fr: 'Tu as voté dans {done}/{total} catégories', pt: 'Você votou em {done}/{total} categorias', nl: 'Je stemde in {done}/{total} categorieën' },
  'oscars.allVoted': { en: 'All voted! Waiting for the ceremony 🍿', fr: 'Tout voté ! En attendant la cérémonie 🍿', pt: 'Tudo votado! Esperando a cerimônia 🍿', nl: 'Alles gestemd! Wachten op de ceremonie 🍿' },
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
  if (typeof document !== 'undefined') document.documentElement.lang = value
})

if (typeof document !== 'undefined') document.documentElement.lang = lang$.peek()

export function useT(): (key: string, vars?: Record<string, string | number>) => string {
  const lang = use$(lang$)
  return (key, vars) => translate(lang, key, vars)
}
