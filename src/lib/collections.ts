import viridisVideo from '$lib/assets/flavors/02-virdis-concept-bg.mp4';
import viridisBottle from '$lib/assets/flavors/virdis-collection.png';

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
	/** Per-collection grade. `deep` is the ground, `glow` the single warm point of light. */
	tone: { deep: string; ink: string; glow: string };
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
	tone: { deep: '#0A100D', ink: '#F8F2DC', glow: '#CD4631' }
};
