import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

const STORY_DOC = doc(db, 'config', 'ourStory')

export const DEFAULT_MILESTONES = [
  {
    id: 'm1',
    season: 'Spring 2023',
    title: 'A Rainy Day at Cool Beans',
    body: 'It started with coffee. Jack ordered black, naturally. Kelsey got a cinnamon-spiced cider. They met at Cool Beans — a little café just off the Horseshoe at the University of South Carolina — on a perfectly rainy afternoon. He gave her a silly band, they debated their favorite childhood Disney shows, landed on Dog with a Blog, and both ended up skipping class. The conversation that started that afternoon has never really ended.',
    imageHint: 'Cool Beans café or the Horseshoe at UofSC',
    photoUrl: null,
  },
  {
    id: 'm2',
    season: 'Spring 2023',
    title: 'The First Dates',
    body: 'Dinners around Columbia followed — Green Olive was a favorite — and eventually a home-cooked meal. It was early, but something was unmistakably clear: this was worth showing up for, again and again.',
    imageHint: 'An early date photo — dinner out or a candid together',
    photoUrl: null,
  },
  {
    id: 'm3',
    season: "Valentine's Day",
    title: 'The Otter',
    body: "For their first Valentine's Day together, Jack hand-painted Kelsey an otter. It was their first real gift to each other, and it landed. River otters — playful, loyal, and joyful — became the quiet symbol of their relationship, and they've held that meaning ever since.",
    imageHint: 'The hand-painted otter, or an otter keepsake',
    photoUrl: null,
  },
  {
    id: 'm4',
    season: 'Spring 2023',
    title: 'Formals, Football & "I Love You"',
    body: "Junior year meant football Saturdays, frat parties, and formals. Meeting each other's roommates, merging friend groups, and making memories at every turn. At one of their formals, dressed up and surrounded by friends, Jack told Kelsey he loved her for the first time.",
    imageHint: 'A formal or game day photo from junior year',
    photoUrl: null,
  },
  {
    id: 'm5',
    season: 'Summer 2023',
    title: 'The Summer They Stayed',
    body: 'Jack stayed in Columbia that summer, which meant lazy days, late nights, and a lot of quality time. He introduced Kelsey to his drum kit (she can confirm he provided the drums). She kept her plants at his place. The hours passed the way they always did between them — easily, and all at once.',
    imageHint: 'A summer candid — porch, backyard, or around Columbia',
    photoUrl: null,
  },
  {
    id: 'm6',
    season: 'Fall 2023 – Spring 2024',
    title: 'Senior Year',
    body: "Senior year was everything it should have been: football games together, midnight breakfast at the Russell House, cheering on the Gamecocks women's basketball team, and studying side-by-side before exams. Their friend groups fully merged, two worlds became one, and a lot of good evenings were had.",
    imageHint: "Senior year photos — game day, friends, campus, or graduation",
    photoUrl: null,
  },
  {
    id: 'm7',
    season: 'Summer 2024',
    title: 'Graduation & Europe: The First Trip',
    body: 'They graduated from the University of South Carolina and celebrated with passports. A hostel in Ireland, city centers in Switzerland and France, chocolate in Belgium, and a wander through Bruges. They went as two people who loved each other and came back knowing something equally important: they travel beautifully together.',
    imageHint: 'Europe trip 1 — Ireland, Belgium, France, or Switzerland',
    photoUrl: null,
  },
  {
    id: 'm8',
    season: 'Summer 2025',
    title: 'Europe: The Second Trip',
    body: 'Spain and Portugal called, and they answered. This trip leaned into the landscape — long hikes, medieval castles, and slow afternoons on the coast. A different Europe, the same easy rhythm.',
    imageHint: 'Europe trip 2 — Spain or Portugal landscapes',
    photoUrl: null,
  },
  {
    id: 'm9',
    season: 'September 2025',
    title: 'Coming Home',
    body: 'After years of separate apartments and shared neighborhoods, they found a house in Columbia and made it theirs — plants, drum kit, and all.',
    imageHint: 'A photo of the house or moving day',
    photoUrl: null,
  },
  {
    id: 'm10',
    season: 'November 10, 2025',
    title: 'Quade',
    body: 'On a Monday in November, they drove out to a Petsmart and came home with Quade — part Maine Coon, entirely perfect. He is their one and only begotten son, and the feeling is entirely mutual.',
    imageHint: 'A photo of Quade the cat',
    photoUrl: null,
  },
  {
    id: 'm11',
    season: 'March 14, 2026',
    title: '"Will You Marry Me?"',
    body: 'On their three-year anniversary, at Playa Okatao in Costa Rica, Jack proposed. The same conversation that began at a rainy coffee shop near the Horseshoe — the one that made them both skip class — became a promise for a lifetime.',
    imageHint: 'Engagement photos from Playa Okatao, Costa Rica',
    photoUrl: null,
  },
]

/**
 * Fetch our story milestones from Firestore. Falls back to defaults if not yet saved.
 */
export async function getOurStory() {
  const snap = await getDoc(STORY_DOC)
  if (!snap.exists()) return { milestones: DEFAULT_MILESTONES }
  const data = snap.data()
  return { milestones: data.milestones ?? DEFAULT_MILESTONES }
}

/**
 * Persist the full milestones array to Firestore.
 * @param {Array} milestones
 */
export async function saveOurStory(milestones) {
  await setDoc(STORY_DOC, { milestones })
}
