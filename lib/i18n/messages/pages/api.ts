import { tri } from "./_tri";

// Messages the public form endpoints (contact, booking, newsletter, store,
// events, service requests) return to visitors.
export default tri({
  "pages.api.tooMany": [
    "Too many requests. Please try again in a few minutes.",
    "Trop de demandes. Veuillez réessayer dans quelques minutes.",
    "Maombi ni mengi mno. Tafadhali jaribu tena baada ya dakika chache.",
  ],
  "pages.api.tooManyLater": [
    "Too many requests. Please try again later.",
    "Trop de demandes. Veuillez réessayer plus tard.",
    "Maombi ni mengi mno. Tafadhali jaribu tena baadaye.",
  ],
  "pages.api.invalidEmail": [
    "Please enter a valid email address.",
    "Veuillez saisir une adresse e-mail valide.",
    "Tafadhali andika anwani halali ya email.",
  ],
  "pages.api.invalidFirstName": [
    "Please enter your first name.",
    "Veuillez indiquer votre prénom.",
    "Tafadhali andika jina lako la kwanza.",
  ],
  "pages.api.invalidLastName": [
    "Please enter your last name.",
    "Veuillez indiquer votre nom.",
    "Tafadhali andika jina lako la mwisho.",
  ],
  "pages.api.invalidName": ["Please enter your name.", "Veuillez indiquer votre nom.", "Tafadhali andika jina lako."],
  "pages.api.invalidBusinessName": [
    "Please enter your business name.",
    "Veuillez indiquer le nom de votre entreprise.",
    "Tafadhali andika jina la biashara yako.",
  ],
  "pages.api.invalidContactName": [
    "Please enter your full name.",
    "Veuillez indiquer vos nom et prénom.",
    "Tafadhali andika jina lako kamili.",
  ],
  "pages.api.invalidPhone": [
    "Please enter a valid phone number.",
    "Veuillez indiquer un numéro de téléphone valide.",
    "Tafadhali andika namba halali ya simu.",
  ],
  "pages.api.invalidCompany": [
    "The company name is too long.",
    "Le nom de l'entreprise est trop long.",
    "Jina la kampuni ni refu mno.",
  ],
  "pages.api.invalidNotes": ["Your notes are too long.", "Vos notes sont trop longues.", "Maelezo yako ni marefu mno."],
  "pages.api.descriptionRequired": [
    "Please add a description (up to 5,000 characters).",
    "Veuillez ajouter une description (5 000 caractères maximum).",
    "Tafadhali ongeza maelezo (hadi herufi 5,000).",
  ],
  "pages.api.invalidService": ["Please choose a service.", "Veuillez choisir un service.", "Tafadhali chagua huduma."],
  "pages.api.failedRequest": [
    "We couldn't submit your request. Please try again.",
    "Nous n'avons pas pu envoyer votre demande. Veuillez réessayer.",
    "Hatukuweza kutuma ombi lako. Tafadhali jaribu tena.",
  ],

  // Booking
  "pages.api.book.unknownTopic": [
    "Please choose one of the consultation topics.",
    "Veuillez choisir l'un des sujets de consultation.",
    "Tafadhali chagua mojawapo ya mada za ushauri.",
  ],
  "pages.api.book.invalidDate": ["Please choose a valid date.", "Veuillez choisir une date valide.", "Tafadhali chagua tarehe halali."],
  "pages.api.book.pastDate": ["That date has already passed.", "Cette date est déjà passée.", "Tarehe hiyo imeshapita."],
  "pages.api.book.slotNotOffered": [
    "That time is not offered.",
    "Ce créneau n'est pas proposé.",
    "Muda huo haupatikani.",
  ],
  "pages.api.book.dayClosed": [
    "That day is not open for booking.",
    "Ce jour n'est pas ouvert à la réservation.",
    "Siku hiyo haipokei miadi.",
  ],
  "pages.api.book.dateUnavailable": ["That date is unavailable.", "Cette date n'est pas disponible.", "Tarehe hiyo haipatikani."],
  "pages.api.book.slotTaken": [
    "That time has just been booked. Please pick another slot.",
    "Ce créneau vient d'être réservé. Veuillez en choisir un autre.",
    "Muda huo umechukuliwa sasa hivi. Tafadhali chagua muda mwingine.",
  ],
  "pages.api.book.tooManyBookings": [
    "You've already booked several sessions. Reply to your confirmation email if you need another.",
    "Vous avez déjà réservé plusieurs séances. Répondez à votre e-mail de confirmation si vous en avez besoin d'une autre.",
    "Tayari umeweka vikao kadhaa. Jibu email yako ya uthibitisho ikiwa unahitaji kingine.",
  ],
  "pages.api.book.failed": [
    "We couldn't create your booking. Please try again.",
    "Nous n'avons pas pu créer votre réservation. Veuillez réessayer.",
    "Hatukuweza kuweka miadi yako. Tafadhali jaribu tena.",
  ],

  // Newsletter
  "pages.api.news.welcomeBack": [
    "Welcome back! You're re-subscribed.",
    "Bon retour parmi nous ! Votre abonnement est réactivé.",
    "Karibu tena! Umejiandikisha upya.",
  ],
  "pages.api.news.already": ["You're already subscribed!", "Vous êtes déjà abonné !", "Tayari umejiandikisha!"],
  "pages.api.news.subscribed": [
    "Subscribed! Welcome to the TIBLOGICS AI newsletter.",
    "Abonnement confirmé ! Bienvenue dans la newsletter IA de TIBLOGICS.",
    "Umejiandikisha! Karibu kwenye jarida la AI la TIBLOGICS.",
  ],
  "pages.api.news.failed": [
    "We couldn't subscribe you. Please try again.",
    "Nous n'avons pas pu vous abonner. Veuillez réessayer.",
    "Hatukuweza kukuandikisha. Tafadhali jaribu tena.",
  ],
  "pages.api.news.unsubscribed": ["Unsubscribed successfully.", "Désabonnement effectué.", "Umejiondoa kikamilifu."],
  "pages.api.news.notFound": [
    "We couldn't find that subscription.",
    "Nous n'avons pas trouvé cet abonnement.",
    "Hatukupata usajili huo.",
  ],

  // Store
  "pages.api.shop.notConfigured": [
    "Payments are not available right now. Please try again later.",
    "Les paiements ne sont pas disponibles pour le moment. Veuillez réessayer plus tard.",
    "Malipo hayapatikani kwa sasa. Tafadhali jaribu tena baadaye.",
  ],
  "pages.api.shop.cartEmpty": ["Your cart is empty.", "Votre panier est vide.", "Kikapu chako ni tupu."],
  "pages.api.shop.noProducts": [
    "None of the products in your cart are available.",
    "Aucun des produits de votre panier n'est disponible.",
    "Hakuna bidhaa yoyote katika kikapu chako inayopatikana.",
  ],
  "pages.api.shop.outOfStock": [
    "Some items are out of stock.",
    "Certains articles sont en rupture de stock.",
    "Baadhi ya bidhaa zimeisha.",
  ],
  "pages.api.shop.checkoutFailed": [
    "Could not start checkout. Please try again or contact support.",
    "Impossible de lancer le paiement. Veuillez réessayer ou contacter l'assistance.",
    "Imeshindikana kuanza malipo. Tafadhali jaribu tena au wasiliana na huduma kwa wateja.",
  ],
  "pages.api.shop.saveFailed": [
    "We couldn't save your cart.",
    "Nous n'avons pas pu enregistrer votre panier.",
    "Hatukuweza kuhifadhi kikapu chako.",
  ],
  "pages.api.events.saveFailed": [
    "We couldn't add you to the waitlist. Please try again.",
    "Nous n'avons pas pu vous inscrire sur la liste d'attente. Veuillez réessayer.",
    "Hatukuweza kukuweka kwenye orodha ya kusubiri. Tafadhali jaribu tena.",
  ],
});
