/**
 * Bedtime Stories Library
 * 
 * Sleep stories with calming narratives, ambient sounds,
 * and professional voice narration.
 */
import { ImageSourcePropType } from 'react-native';

// Local story artwork images (Unsplash - royalty-free)
export const STORY_ARTWORK = {
  'quiet-forest': require('../../assets/stories/quiet-forest.jpg'),
  'train-alps': require('../../assets/stories/train-alps.jpg'),
  'rainy-cottage': require('../../assets/stories/rainy-cottage.jpg'),
  'starlight-garden': require('../../assets/stories/starlight-garden.jpg'),
  'ocean-lighthouse': require('../../assets/stories/ocean-lighthouse.jpg'),
  'japanese-garden': require('../../assets/stories/japanese-garden.jpg'),
  'northern-lights': require('../../assets/stories/northern-lights.jpg'),
  'moonlit-boat': require('../../assets/stories/moonlit-boat.jpg'),
  'lavender-fields': require('../../assets/stories/lavender-fields.jpg'),
  'cloud-castle': require('../../assets/stories/cloud-castle.jpg'),
  'mountain-cabin': require('../../assets/stories/mountain-cabin.jpg'),
  'bali-temple': require('../../assets/stories/bali-temple.jpg'),
  'desert-stars': require('../../assets/stories/desert-stars.jpg'),
  'irish-coast': require('../../assets/stories/irish-coast.jpg'),
  'enchanted-library': require('../../assets/stories/enchanted-library.jpg'),
  'tuscany-vineyard': require('../../assets/stories/tuscany-vineyard.jpg'),
  'sleepy-village': require('../../assets/stories/sleepy-village.jpg'),
  'body-scan-sleep': require('../../assets/stories/body-scan-sleep.jpg'),
  'ocean-soundscape': require('../../assets/stories/ocean-soundscape.jpg'),
  'rain-soundscape': require('../../assets/stories/rain-soundscape.jpg'),
  'forest-soundscape': require('../../assets/stories/forest-soundscape.jpg'),
  'night-soundscape': require('../../assets/stories/night-soundscape.jpg'),
  'fireplace-soundscape': require('../../assets/stories/fireplace-soundscape.jpg'),
  'alice-wonderland': require('../../assets/stories/alice-wonderland.jpg'),
  'wind-willows': require('../../assets/stories/wind-willows.jpg'),
} as const;

export type StoryArtworkId = keyof typeof STORY_ARTWORK;

// Helper to get local artwork for a story
export function getStoryArtwork(storyId: string): ImageSourcePropType | undefined {
  return STORY_ARTWORK[storyId as StoryArtworkId];
}

export interface BedtimeStory {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  narrator: string;
  duration: number; // minutes
  audioUrl: string;
  artworkUrl?: string;
  artworkLocal?: ImageSourcePropType; // Local bundled image
  category: StoryCategory;
  tags: string[];
  isPremium: boolean;
  mood: 'calm' | 'dreamy' | 'cozy' | 'magical';
  backgroundSound?: string;
}

export type StoryCategory = 
  | 'nature' 
  | 'travel' 
  | 'fantasy' 
  | 'meditation' 
  | 'soundscapes'
  | 'classics';

export const STORY_CATEGORIES = [
  { id: 'all', label: 'All Stories', icon: '📚' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'fantasy', label: 'Fantasy', icon: '🌙' },
  { id: 'meditation', label: 'Meditation', icon: '🧘' },
  { id: 'soundscapes', label: 'Soundscapes', icon: '🎵' },
  { id: 'classics', label: 'Classics', icon: '📖' },
] as const;

export const BEDTIME_STORIES: BedtimeStory[] = [
  // FREE STORIES (4)
  {
    id: 'quiet-forest',
    title: 'The Quiet Forest',
    subtitle: 'A walk through peaceful woods',
    description: 'Follow a gentle path through an ancient forest, where sunlight filters through leaves and a distant stream whispers secrets.',
    narrator: 'Emily Rose',
    duration: 20,
    audioUrl: 'https://cdn.restorae.com/stories/quiet-forest.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/quiet-forest.jpg',
    category: 'nature',
    tags: ['forest', 'relaxing', 'nature sounds'],
    isPremium: false,
    mood: 'calm',
    backgroundSound: 'forest-ambient',
  },
  {
    id: 'train-through-alps',
    title: 'Train Through the Alps',
    subtitle: 'A scenic railway journey',
    description: 'Board a vintage train winding through snow-capped mountains, passing through tunnels and over bridges with breathtaking views.',
    narrator: 'James Mitchell',
    duration: 25,
    audioUrl: 'https://cdn.restorae.com/stories/train-alps.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/train-alps.jpg',
    category: 'travel',
    tags: ['train', 'mountains', 'europe'],
    isPremium: false,
    mood: 'dreamy',
    backgroundSound: 'train-ambient',
  },
  {
    id: 'rainy-day-cottage',
    title: 'Rainy Day Cottage',
    subtitle: 'Cozy comfort by the fire',
    description: 'Settle into a warm cottage as rain patters on the windows. The fire crackles, tea steams, and the world outside fades away.',
    narrator: 'Sarah Chen',
    duration: 30,
    audioUrl: 'https://cdn.restorae.com/stories/rainy-cottage.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/rainy-cottage.jpg',
    category: 'nature',
    tags: ['rain', 'cozy', 'fireplace'],
    isPremium: false,
    mood: 'cozy',
    backgroundSound: 'rain-fire',
  },
  {
    id: 'starlight-garden',
    title: 'The Starlight Garden',
    subtitle: 'Where dreams bloom at night',
    description: 'Discover a magical garden where flowers glow under starlight and gentle creatures tend to your worries until morning.',
    narrator: 'Luna Wei',
    duration: 22,
    audioUrl: 'https://cdn.restorae.com/stories/starlight-garden.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/starlight-garden.jpg',
    category: 'fantasy',
    tags: ['magic', 'garden', 'stars'],
    isPremium: false,
    mood: 'magical',
    backgroundSound: 'night-garden',
  },

  // PREMIUM STORIES (16+)
  {
    id: 'ocean-lighthouse',
    title: 'The Ocean Lighthouse',
    subtitle: 'Keeper of the coastal light',
    description: 'Spend a night in an old lighthouse, listening to waves crash against rocks as the beam sweeps across endless sea.',
    narrator: 'Marcus Webb',
    duration: 35,
    audioUrl: 'https://cdn.restorae.com/stories/ocean-lighthouse.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/ocean-lighthouse.jpg',
    category: 'nature',
    tags: ['ocean', 'lighthouse', 'waves'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'ocean-waves',
  },
  {
    id: 'japanese-garden',
    title: 'Japanese Garden at Dusk',
    subtitle: 'Harmony and tranquility',
    description: 'Wander through a serene Japanese garden as lanterns begin to glow and koi swim lazily in moss-bordered ponds.',
    narrator: 'Yuki Tanaka',
    duration: 28,
    audioUrl: 'https://cdn.restorae.com/stories/japanese-garden.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/japanese-garden.jpg',
    category: 'travel',
    tags: ['japan', 'zen', 'garden'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'water-bamboo',
  },
  {
    id: 'northern-lights',
    title: 'Under Northern Lights',
    subtitle: 'Aurora dreams',
    description: 'Lie beneath the dancing aurora borealis in a cozy cabin, as colors paint the arctic sky in swirling greens and purples.',
    narrator: 'Erik Nordstrom',
    duration: 32,
    audioUrl: 'https://cdn.restorae.com/stories/northern-lights.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/northern-lights.jpg',
    category: 'nature',
    tags: ['aurora', 'arctic', 'cabin'],
    isPremium: true,
    mood: 'magical',
    backgroundSound: 'arctic-wind',
  },
  {
    id: 'moonlit-boat',
    title: 'Moonlit Boat Ride',
    subtitle: 'Drifting on silver water',
    description: 'Float gently down a peaceful river under a full moon, as willows trail their branches in the water and owls call softly.',
    narrator: 'Emily Rose',
    duration: 25,
    audioUrl: 'https://cdn.restorae.com/stories/moonlit-boat.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/moonlit-boat.jpg',
    category: 'nature',
    tags: ['river', 'moon', 'boat'],
    isPremium: true,
    mood: 'dreamy',
    backgroundSound: 'river-night',
  },
  {
    id: 'lavender-fields',
    title: 'Lavender Fields of Provence',
    subtitle: 'Purple dreams in summer',
    description: 'Walk through endless rows of fragrant lavender as the sun sets over the French countryside, painting everything in gold.',
    narrator: 'Marie Dubois',
    duration: 22,
    audioUrl: 'https://cdn.restorae.com/stories/lavender-fields.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/lavender-fields.jpg',
    category: 'travel',
    tags: ['lavender', 'france', 'summer'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'summer-breeze',
  },
  {
    id: 'cloud-castle',
    title: 'The Cloud Castle',
    subtitle: 'Where the sky folk live',
    description: 'Rise up through soft clouds to discover a castle made of mist and moonbeams, where gentle beings prepare dreams for the world below.',
    narrator: 'Luna Wei',
    duration: 30,
    audioUrl: 'https://cdn.restorae.com/stories/cloud-castle.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/cloud-castle.jpg',
    category: 'fantasy',
    tags: ['clouds', 'castle', 'dreams'],
    isPremium: true,
    mood: 'magical',
    backgroundSound: 'soft-wind',
  },
  {
    id: 'mountain-cabin',
    title: 'Mountain Cabin Retreat',
    subtitle: 'Snowed in and at peace',
    description: 'Cozy up in a remote mountain cabin as snow falls silently outside. The wood stove crackles and hot cocoa warms your hands.',
    narrator: 'James Mitchell',
    duration: 35,
    audioUrl: 'https://cdn.restorae.com/stories/mountain-cabin.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/mountain-cabin.jpg',
    category: 'nature',
    tags: ['snow', 'cabin', 'mountains'],
    isPremium: true,
    mood: 'cozy',
    backgroundSound: 'snow-fire',
  },
  {
    id: 'bali-temple',
    title: 'Bali Temple at Dawn',
    subtitle: 'Sacred morning rituals',
    description: 'Witness the peaceful morning rituals at an ancient Balinese temple as incense drifts and gentle chanting fills the humid air.',
    narrator: 'Sarah Chen',
    duration: 28,
    audioUrl: 'https://cdn.restorae.com/stories/bali-temple.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/bali-temple.jpg',
    category: 'meditation',
    tags: ['bali', 'temple', 'spiritual'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'temple-bells',
  },
  {
    id: 'desert-stars',
    title: 'Desert Under Stars',
    subtitle: 'Infinite sky, infinite peace',
    description: 'Rest beneath a canopy of stars in the vast desert, where silence speaks louder than words and the Milky Way stretches overhead.',
    narrator: 'Omar Hassan',
    duration: 25,
    audioUrl: 'https://cdn.restorae.com/stories/desert-stars.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/desert-stars.jpg',
    category: 'nature',
    tags: ['desert', 'stars', 'night'],
    isPremium: true,
    mood: 'dreamy',
    backgroundSound: 'desert-night',
  },
  {
    id: 'irish-coast',
    title: 'Irish Coastal Walk',
    subtitle: 'Cliffs, mist, and magic',
    description: 'Walk along dramatic Irish cliffs as seabirds call and the Atlantic mist carries stories of ancient legends.',
    narrator: 'Siobhan Kelly',
    duration: 30,
    audioUrl: 'https://cdn.restorae.com/stories/irish-coast.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/irish-coast.jpg',
    category: 'travel',
    tags: ['ireland', 'cliffs', 'ocean'],
    isPremium: true,
    mood: 'dreamy',
    backgroundSound: 'coastal-wind',
  },
  {
    id: 'enchanted-library',
    title: 'The Enchanted Library',
    subtitle: 'Where books come alive',
    description: 'Discover a magical library where books whisper their stories and friendly ghosts tend the shelves through endless corridors.',
    narrator: 'Luna Wei',
    duration: 28,
    audioUrl: 'https://cdn.restorae.com/stories/enchanted-library.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/enchanted-library.jpg',
    category: 'fantasy',
    tags: ['library', 'magic', 'books'],
    isPremium: true,
    mood: 'magical',
    backgroundSound: 'library-ambient',
  },
  {
    id: 'tuscany-vineyard',
    title: 'Tuscan Vineyard Evening',
    subtitle: 'Golden light and wine',
    description: 'Stroll through rolling Tuscan vineyards as the golden hour bathes ancient stone walls and cypress trees in warm light.',
    narrator: 'Marco Rossi',
    duration: 24,
    audioUrl: 'https://cdn.restorae.com/stories/tuscany-vineyard.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/tuscany-vineyard.jpg',
    category: 'travel',
    tags: ['italy', 'vineyard', 'sunset'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'evening-cicadas',
  },
  {
    id: 'sleepy-village',
    title: 'The Sleepy Village',
    subtitle: 'Where time moves slowly',
    description: 'Visit a village where everyone moves at peace, bread bakes slowly, and the afternoon is for napping under old oak trees.',
    narrator: 'Emily Rose',
    duration: 26,
    audioUrl: 'https://cdn.restorae.com/stories/sleepy-village.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/sleepy-village.jpg',
    category: 'fantasy',
    tags: ['village', 'peaceful', 'slow'],
    isPremium: true,
    mood: 'cozy',
    backgroundSound: 'village-afternoon',
  },
  {
    id: 'body-scan-sleep',
    title: 'Sleep Body Scan',
    subtitle: 'Release every muscle',
    description: 'A gentle guided meditation that progressively relaxes every part of your body from head to toe, preparing you for deep sleep.',
    narrator: 'Dr. Sarah Morgan',
    duration: 20,
    audioUrl: 'https://cdn.restorae.com/stories/body-scan-sleep.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/body-scan-sleep.jpg',
    category: 'meditation',
    tags: ['body scan', 'relaxation', 'guided'],
    isPremium: true,
    mood: 'calm',
    backgroundSound: 'soft-ambient',
  },
  {
    id: 'ocean-soundscape',
    title: 'Ocean Waves',
    subtitle: '8 hours of peaceful shores',
    description: 'Gentle ocean waves rolling onto a sandy beach. Pure, uninterrupted nature sounds for deep sleep and relaxation.',
    narrator: 'Nature',
    duration: 480,
    audioUrl: 'https://cdn.restorae.com/stories/ocean-soundscape.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/ocean-soundscape.jpg',
    category: 'soundscapes',
    tags: ['ocean', 'waves', 'nature'],
    isPremium: true,
    mood: 'calm',
  },
  {
    id: 'rain-soundscape',
    title: 'Night Rain',
    subtitle: '8 hours of gentle rainfall',
    description: 'Continuous gentle rain falling on leaves and rooftops. The perfect backdrop for sleep, study, or relaxation.',
    narrator: 'Nature',
    duration: 480,
    audioUrl: 'https://cdn.restorae.com/stories/rain-soundscape.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/rain-soundscape.jpg',
    category: 'soundscapes',
    tags: ['rain', 'night', 'nature'],
    isPremium: true,
    mood: 'cozy',
  },
  {
    id: 'fireplace-soundscape',
    title: 'Crackling Fireplace',
    subtitle: '8 hours of warming fire',
    description: 'The comforting crackle and pop of a wood fire. Warmth and coziness for cold nights and peaceful sleep.',
    narrator: 'Nature',
    duration: 480,
    audioUrl: 'https://cdn.restorae.com/stories/fireplace-soundscape.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/fireplace-soundscape.jpg',
    category: 'soundscapes',
    tags: ['fire', 'cozy', 'warmth'],
    isPremium: true,
    mood: 'cozy',
  },
  {
    id: 'alice-wonderland',
    title: 'Alice in Wonderland',
    subtitle: 'Down the rabbit hole',
    description: 'A gentle retelling of Lewis Carroll\'s classic, perfect for drifting off to a world of curious dreams.',
    narrator: 'Victoria Sterling',
    duration: 45,
    audioUrl: 'https://cdn.restorae.com/stories/alice-wonderland.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/alice-wonderland.jpg',
    category: 'classics',
    tags: ['classic', 'fantasy', 'adventure'],
    isPremium: true,
    mood: 'magical',
    backgroundSound: 'whimsical-ambient',
  },
  {
    id: 'wind-willows',
    title: 'Wind in the Willows',
    subtitle: 'Messing about in boats',
    description: 'Join Mole and Rat for gentle adventures along the riverbank in this soothing classic tale.',
    narrator: 'Sir Geoffrey Palmer',
    duration: 40,
    audioUrl: 'https://cdn.restorae.com/stories/wind-willows.mp3',
    artworkUrl: 'https://cdn.restorae.com/stories/artwork/wind-willows.jpg',
    category: 'classics',
    tags: ['classic', 'animals', 'countryside'],
    isPremium: true,
    mood: 'cozy',
    backgroundSound: 'river-gentle',
  },
];

// Sleep timer options
export const SLEEP_TIMER_OPTIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: 'End of story', minutes: -1 }, // -1 means until story ends
  { label: 'Off', minutes: 0 },
];

// Helper functions
export function getStoriesByCategory(category: StoryCategory | 'all'): BedtimeStory[] {
  if (category === 'all') return BEDTIME_STORIES;
  return BEDTIME_STORIES.filter(s => s.category === category);
}

export function getStoryById(id: string): BedtimeStory | undefined {
  return BEDTIME_STORIES.find(s => s.id === id);
}

export function getFreeStories(): BedtimeStory[] {
  return BEDTIME_STORIES.filter(s => !s.isPremium);
}

export function getPremiumStories(): BedtimeStory[] {
  return BEDTIME_STORIES.filter(s => s.isPremium);
}

export function getStoriesByMood(mood: BedtimeStory['mood']): BedtimeStory[] {
  return BEDTIME_STORIES.filter(s => s.mood === mood);
}

export function getSoundscapes(): BedtimeStory[] {
  return BEDTIME_STORIES.filter(s => s.category === 'soundscapes');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// =============================================================================
// API RESPONSE MAPPING
// =============================================================================

// API returns UPPERCASE categories, we use lowercase
const categoryMap: Record<string, StoryCategory> = {
  'NATURE': 'nature',
  'TRAVEL': 'travel',
  'FANTASY': 'fantasy',
  'MEDITATION': 'meditation',
  'SOUNDSCAPES': 'soundscapes',
  'CLASSICS': 'classics',
};

// API returns UPPERCASE moods, we use lowercase
const moodMap: Record<string, BedtimeStory['mood']> = {
  'CALM': 'calm',
  'DREAMY': 'dreamy',
  'COZY': 'cozy',
  'MAGICAL': 'magical',
};

// API response type
export interface ApiStory {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  narrator: string | null;
  duration: number;
  audioUrl: string | null;
  artworkUrl: string | null;
  category: string;
  tags: string[];
  isPremium: boolean;
  mood: string;
  backgroundSound: string | null;
  order: number;
  status: string;
  listenCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  locales: Array<{ locale: string; title?: string; description?: string }>;
}

// Map API response to local BedtimeStory format
export function mapApiStoryToLocal(apiStory: ApiStory): BedtimeStory {
  return {
    id: apiStory.id,
    title: apiStory.title,
    subtitle: apiStory.subtitle || '',
    description: apiStory.description || '',
    narrator: apiStory.narrator || 'Unknown',
    duration: apiStory.duration,
    audioUrl: apiStory.audioUrl || '',
    artworkUrl: apiStory.artworkUrl || undefined,
    category: categoryMap[apiStory.category] || 'nature',
    tags: apiStory.tags || [],
    isPremium: apiStory.isPremium,
    mood: moodMap[apiStory.mood] || 'calm',
    backgroundSound: apiStory.backgroundSound || undefined,
  };
}

// Map array of API stories
export function mapApiStoriesToLocal(apiStories: ApiStory[]): BedtimeStory[] {
  return apiStories.map(mapApiStoryToLocal);
}

// Filter stories by category (works with both local and API data)
export function filterStoriesByCategory(
  stories: BedtimeStory[],
  category: StoryCategory | 'all'
): BedtimeStory[] {
  if (category === 'all') return stories;
  return stories.filter(s => s.category === category);
}