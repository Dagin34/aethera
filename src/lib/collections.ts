import viridisVideo from '$lib/assets/flavors/02-virdis-concept-bg.mp4';
import viridisBottle from '$lib/assets/flavors/virdis-collection.png';
import aurelisVideo from '$lib/assets/flavors/01-aurelis-concept-bg.mp4';
import aurelisBottle from '$lib/assets/flavors/aurelis-collection.png';
import umbrisVideo from '$lib/assets/flavors/03-umbris-concept-bg.mp4';
import umbrisBottle from '$lib/assets/flavors/umbris-collection.png';

/** One movement of the dry-down — what the fragrance is doing at a given hour. */
export type Phase = {
	time: string;
	notes: string[];
	text: string;
};

export type Collection = {
	slug: string;
	name: string;
	meta: string;
	tagline: string;
	phases: Phase[];
	link: { label: string; href: string };
	video: string;
	bottle: string;
	bottleAlt: string;
	/** Which way the composition falls open: the side the bottle takes when the
	 *  stage splits, with the notes going to the other. Read as a diptych, so
	 *  consecutive collections should lean opposite ways. */
	lean: 'left' | 'right';
	/** Per-collection grade. `deep` is the ground, `glow` the single warm point of
	 *  light. A pale `deep` inverts the section: dark type on a lit field, and a
	 *  film that blooms rather than dims as the fragrance dries down.
	 *
	 *  `halo` makes that point of light literal — how strongly the glow burns
	 *  behind the bottle, 0 to 1. Worth having only where the ground is dark
	 *  enough for a light to be visible in it; defaults to none. */
	tone: { deep: string; ink: string; glow: string; halo?: number };
};

export const viridis: Collection = {
	slug: 'viridis',
	name: 'VIRIDIS',
	meta: 'Extrait de Parfum · 100 ML',
	tagline: 'Cut stems, cold water.',
	phases: [
		{
			time: 'First fifteen minutes',
			notes: ['Crushed fig leaf', 'Green mandarin', 'Violet leaf'],
			text: 'Sharp, and a little bitter — like breaking a stem with your thumbnail.'
		},
		{
			time: 'The next three hours',
			notes: ['Galbanum', 'Tomato vine', 'Neroli'],
			text: 'The bitterness settles into shade. This is the part that lasts.'
		},
		{
			time: "What's left by evening",
			notes: ['Haitian vetiver', 'Wet stone', 'Moss and cedar'],
			text: 'Dry, mineral, close to the skin. Less a scent by then than a kind of weather.'
		}
	],
	link: { label: 'See the collection', href: '/fragrances' },
	video: viridisVideo,
	bottle: viridisBottle,
	bottleAlt: 'The ÆTHERA Viridis extrait de parfum, in dark green glass beaded with water',
	lean: 'left',
	tone: { deep: '#0A100D', ink: '#F8F2DC', glow: '#CD4631' }
};

export const aurelis: Collection = {
	slug: 'aurelis',
	name: 'AURELIS',
	meta: 'Extrait de Parfum · 100 ML',
	tagline: 'Low sun, warm skin.',
	phases: [
		{
			time: 'First fifteen minutes',
			notes: ['Bitter orange peel', 'Immortelle', 'Pink pepper'],
			text: 'Sweet for a moment, then dry — peel torn open and held in the sun.'
		},
		{
			time: 'The next three hours',
			notes: ['Beeswax', 'Labdanum', 'Orris'],
			text: 'It thickens and slows. Warm the way a room stays warm after the sun has left it.'
		},
		{
			time: "What's left by evening",
			notes: ['Benzoin', 'Tonka bean', 'Sandalwood'],
			text: 'Soft, and a little powdery. It outlasts the skin and stays in the wool.'
		}
	],
	link: { label: 'See the collection', href: '/fragrances' },
	video: aurelisVideo,
	bottle: aurelisBottle,
	bottleAlt: 'The ÆTHERA Aurelis extrait de parfum, in amber glass lit from within',
	lean: 'right',
	tone: { deep: '#EFDFBB', ink: '#2A1A0B', glow: '#B4531C' }
};

export const umbris: Collection = {
	slug: 'umbris',
	name: 'UMBRIS',
	meta: 'Extrait de Parfum · 100 ML',
	tagline: 'Struck match, cold room.',
	phases: [
		{
			time: 'First fifteen minutes',
			notes: ['Frankincense', 'Black pepper', 'Cade'],
			text: 'The match before the smoke — bright and resinous, and gone almost at once.'
		},
		{
			time: 'The next three hours',
			notes: ['Birch tar', 'Labdanum', 'Orris root'],
			text: 'The smoke settles and stops moving. Warmer underneath than it first lets on.'
		},
		{
			time: "What's left by evening",
			notes: ['Myrrh', 'Smoked vetiver', 'Ambergris'],
			text: 'Barely there, and still in the room. What is left of a fire is not the fire.'
		}
	],
	link: { label: 'See the collection', href: '/fragrances' },
	video: umbrisVideo,
	bottle: umbrisBottle,
	bottleAlt: 'The ÆTHERA Umbris extrait de parfum, in dark glass clouded with red-lit smoke',
	lean: 'left',
	tone: { deep: '#0B0706', ink: '#F8F2DC', glow: '#C1452A', halo: 0.6 }
};
