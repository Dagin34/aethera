/** The film frame at the top of the landing page — an inset, rounded card that
 *  unwraps to full bleed over the first half-screen of scroll.
 *
 *  The bar rides these values so it can sit *inside* the frame while there is
 *  one, rather than straddling its rounded corner. The defaults match the
 *  landing page's own starting values so the server and the first client paint
 *  agree; a route with no frame sets `active = false` as it initialises. */
export const frame = $state({
	active: false,
	/** 0 while the card is fully inset, 1 once it has gone full bleed. */
	progress: 0,
	/** How far the card is currently inset from the page edge, in px. */
	inset: 16
});
