<script lang="ts">
	import Hero from '$lib/components/hero.svelte';
	import Beliefs from '$lib/components/beliefs.svelte';
	import videoBg from '$lib/assets/abstract-video.mp4';
	import { onMount } from 'svelte';
    // import HowWeWork from '$lib/components/how-we-work.svelte';

	// The video background starts framed - inset from the screen edges with
	// rounded corners (the original p-2 / md:p-4 look). As the user scrolls
	// through the first half-screen the frame unwraps to a full-bleed backdrop.
	// The video is pinned (sticky) so it then stays put while the sections
	// below scroll over it, just like the reference site.
	let scrollProgress = $state(0);
	let reducedMotion = $state(false);
	let maxInset = $state(16); // px — matches the original p-4 frame on desktop

	function update() {
		if (reducedMotion) {
			scrollProgress = 1;
			return;
		}
		const distance = window.innerHeight * 0.5; // unwrap over the first half-screen
		scrollProgress = Math.min(window.scrollY / distance, 1);
	}

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
		const wide = window.matchMedia('(min-width: 768px)');
		reducedMotion = reduce.matches;

		const setInset = () => (maxInset = wide.matches ? 24 : 8);
		setInset();

		let ticking = false;
		function onScroll() {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(() => {
				update();
				ticking = false;
			});
		}
		function onResize() {
			setInset();
			update();
		}

		update();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});

	// Both the video and its overlay are inset by the same animated amount so
	// the whole frame - dark tint included - unwraps together.
	const inset = $derived(maxInset * (1 - scrollProgress)); // px
	const radius = $derived(2 * (1 - scrollProgress)); // rem
</script>

<!--
  Pinned + unwrapping background: this video sits in its own h-screen slot in
  the flow, then `main` below is pulled up over it with a matching negative
  margin. Because `main`'s content (Hero + the next section) is taller than one
  screen, this wrapper ends up taller than the video's sticky slot too - so the
  video stays stuck in place while everything scrolls over it, only releasing
  once this wrapper runs out of height.
-->
<div class="relative">
	<div class="sticky top-0 -z-10 box-border h-screen w-full" style="padding: {inset}px;">
		<div class="relative h-full w-full overflow-hidden" style="border-radius: {radius}rem;">
			<video
				src={videoBg}
				autoplay
				loop
				muted
				playsinline
				class="absolute inset-0 h-full w-full object-cover"
			></video>
			<div class="pointer-events-none absolute inset-0 bg-black/20"></div>
		</div>
	</div>

	<main class="mt-[-100vh] flex flex-col items-center justify-center">
		<Hero />

		<!--
		  Scrolls up over the pinned video and then parks there, writing itself
		  out as you keep scrolling. Its own pin releases at the same point the
		  video's does, so the two clear the screen together.
		-->
		<Beliefs />
	</main>
	<!-- <HowWeWork /> -->
</div>