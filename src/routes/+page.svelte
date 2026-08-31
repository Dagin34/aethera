<script lang="ts">
	import Hero from '$lib/components/hero.svelte';
	import Beliefs from '$lib/components/beliefs.svelte';
	import Collection from '$lib/components/collection.svelte';
	import { viridis, aurelis, umbris } from '$lib/collections';
	import videoBg from '$lib/assets/abstract-video.mp4';
	import { onMount } from 'svelte';
	import Footer from '$lib/components/footer.svelte';
	import { frame } from '$lib/frame.svelte';

	// Published rather than kept local: the bar sits inside this frame until it
	// unwraps, so it has to read the same numbers.
	frame.active = true;

	let reducedMotion = $state(false);
	let maxInset = $state(16); // px — matches the original p-4 frame on desktop

	function update() {
		if (reducedMotion) {
			frame.progress = 1;
			frame.inset = 0;
			return;
		}
		const distance = window.innerHeight * 0.5; // unwrap over the first half-screen
		frame.progress = Math.min(window.scrollY / distance, 1);
		frame.inset = maxInset * (1 - frame.progress);
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
			frame.active = false;
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});

	const radius = $derived(2 * (1 - frame.progress)); // rem
</script>

<div class="relative">
	<div class="sticky top-0 -z-10 box-border h-screen w-full" style="padding: {frame.inset}px;">
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

	<main class="mt-[-100vh] flex w-full flex-col items-center justify-center">
		<Hero />

		<Beliefs />

		<Collection collection={viridis} />

		<Collection collection={aurelis} />

		<Collection collection={umbris} />
	</main>
	<Footer />
</div>