import houseImg from '$lib/assets/product-showcase.png';
import pressImg from '$lib/assets/product-held.png';
import stockistsImg from '$lib/assets/landing-product.png';
import atelierImg from '$lib/assets/plant-for-ingridients.jfif';

/** Who a letter can be addressed to.
 *
 *  Contact is routed rather than pooled: the reason someone writes decides which
 *  desk reads it, so the choice is a real field with a real consequence — the
 *  address on the letter changes as you pick, and so does the light in the room.
 *
 *  `glow` is drawn from the house's own palette rather than invented: the three
 *  collections each lend theirs, and the general desk keeps the house accent. */
export type Enquiry = {
	slug: string;
	/** What the sender calls it. */
	label: string;
	/** What the house calls the desk that reads it. */
	desk: string;
	to: string;
	/** One line on what belongs here, so nobody has to guess which to pick. */
	hint: string;
	/** The point of light behind the writing room while this desk is chosen. */
	glow: string;
	/** What the desk has in front of it. Changes with the address, so choosing a
	 *  reason moves the room's light and its view at the same time. */
	image: string;
	imageAlt: string;
};

export const enquiries: Enquiry[] = [
	{
		slug: 'general',
		label: 'General',
		desk: 'The house',
		to: 'info@aetherafragrance.com',
		hint: 'Anything about the fragrances themselves.',
		glow: '#CD4631',
		image: houseImg,
		imageAlt: 'An ÆTHERA extrait on a marble plinth, in low afternoon sun'
	},
	{
		slug: 'press',
		label: 'Press',
		desk: 'The press office',
		to: 'press@aetherafragrance.com',
		hint: 'Samples, images, and interviews.',
		glow: '#7E8A94',
		image: pressImg,
		imageAlt: 'An ÆTHERA extrait held up to the light against a pale wall'
	},
	{
		slug: 'stockists',
		label: 'Stockists',
		desk: 'Wholesale',
		to: 'stockists@aetherafragrance.com',
		hint: 'Carrying ÆTHERA in your shop.',
		glow: '#5E8163',
		image: stockistsImg,
		imageAlt: 'The ÆTHERA bottle as it stands on a shelf'
	},
	{
		slug: 'bespoke',
		label: 'Bespoke',
		desk: 'The atelier',
		to: 'atelier@aetherafragrance.com',
		hint: 'A composition made only once.',
		glow: '#C08A2E',
		image: atelierImg,
		imageAlt: 'A vanilla orchid in flower, still on the vine'
	}
];

export const DEFAULT_ENQUIRY = enquiries[0];

export const findEnquiry = (slug: string): Enquiry | undefined =>
	enquiries.find((enquiry) => enquiry.slug === slug);

/** How long the house takes to write back. Stated on the page and repeated in the
 *  confirmation, so the promise is the same in both places. */
export const RESPONSE_TIME = 'two working days';
