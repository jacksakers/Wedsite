import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const CONTENT_DOC = doc(db, 'config', 'siteContent')

export const DEFAULT_SCHEDULE = [
  { id: 's1', time: '2:30 PM', event: 'Guest Arrival & Seating', note: 'Please arrive 30 minutes before the ceremony.' },
  { id: 's2', time: '3:00 PM', event: 'Ceremony Begins', note: 'Ceremony will be held in the garden.' },
  { id: 's3', time: '3:45 PM', event: 'Cocktail Hour', note: 'Light refreshments on the veranda.' },
  { id: 's4', time: '5:00 PM', event: 'Reception Dinner', note: '' },
  { id: 's5', time: '8:00 PM', event: 'Dancing & Celebration', note: '' },
  { id: 's6', time: '10:00 PM', event: 'Grand Send-Off', note: '' },
]

export const DEFAULT_HOTELS = [
  { id: 'h1', name: 'Hotel Block 1', distance: '5 min drive', note: 'Room block available — mention our wedding when booking.', href: '#' },
  { id: 'h2', name: 'Hotel Block 2', distance: '10 min drive', note: 'Great value option near I-26.', href: '#' },
]

export const DEFAULT_COLUMBIA_GUIDE = [
  { id: 'g1', category: 'Restaurants', items: ['Add your favorites here', 'Another recommendation', 'A third spot'] },
  { id: 'g2', category: 'Things To Do', items: ['Riverbanks Zoo & Garden', 'Soda City Market', 'Congaree National Park'] },
  { id: 'g3', category: 'Coffee & Sweets', items: ['Add a local café here'] },
]

export const DEFAULT_FAQS = [
  { id: 'f1', question: 'What is the dress code?', answer: 'Garden Formal or Cocktail Attire. Think florals, pastels, and elegance. Please avoid wearing white or ivory. We recommend block heels or wedges as portions of the reception are on grass.' },
  { id: 'f2', question: 'Can I bring a plus-one?', answer: 'Due to our intimate venue size, plus-ones are limited. Your invitation will specify if a guest is included. Please reach out to us directly with any questions.' },
  { id: 'f3', question: 'Are children welcome?', answer: 'We adore your little ones! However, our celebration is designed as an adult evening. We encourage you to use this as a well-deserved night out.' },
  { id: 'f4', question: 'Will there be dietary options?', answer: 'Absolutely. Please note any dietary restrictions (vegetarian, vegan, gluten-free, allergies) in your RSVP and we will do our best to accommodate everyone.' },
  { id: 'f5', question: 'Is the venue accessible?', answer: 'Yes. The venue is fully accessible. Please contact us directly if you have specific needs and we will make sure you are taken care of.' },
  { id: 'f6', question: 'What happens if it rains?', answer: 'The venue has a beautiful indoor contingency space. The celebration goes on, rain or shine!' },
]

/**
 * Fetch site content from Firestore. Falls back to defaults if not yet saved.
 */
export async function getSiteContent() {
  const snap = await getDoc(CONTENT_DOC)
  if (!snap.exists()) {
    return {
      schedule: DEFAULT_SCHEDULE,
      hotels: DEFAULT_HOTELS,
      columbiaGuide: DEFAULT_COLUMBIA_GUIDE,
      faqs: DEFAULT_FAQS,
    }
  }
  const data = snap.data()
  return {
    schedule: data.schedule ?? DEFAULT_SCHEDULE,
    hotels: data.hotels ?? DEFAULT_HOTELS,
    columbiaGuide: data.columbiaGuide ?? DEFAULT_COLUMBIA_GUIDE,
    faqs: data.faqs ?? DEFAULT_FAQS,
  }
}

/**
 * Save a single section of site content. Uses merge so other sections are unaffected.
 * @param {'schedule'|'hotels'|'columbiaGuide'|'faqs'} section
 * @param {Array} data
 */
export async function saveSiteSection(section, data) {
  await setDoc(CONTENT_DOC, { [section]: data }, { merge: true })
}
