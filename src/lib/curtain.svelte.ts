/** Whether the nav's own curtain is currently covering the screen.
 *
 *  The page transition and the menu draw the same gesture, so only one of them
 *  may run at a time: when a link is followed from the open menu, the panel is
 *  already covering and stays put until the new page has landed. The layout's
 *  veil sits this one out rather than drawing a second curtain behind the first. */
export const curtain = $state({
	menuOpen: false,
	/** True while the layout's veil is over the page. The bar rides above it, so
	 *  it has to take the curtain's own ink rather than the ink of a section it
	 *  can no longer see. */
	covering: false
});
