<script lang="ts">
	// Import the assets using SvelteKit's $lib alias
	import productImg from '$lib/assets/landing-product.png';

	// Svelte 5 Runes-compatible Spring class
	import { Spring } from 'svelte/motion';

	// Create a new Spring instance with initial values {x, y}
	const coords = new Spring({ x: 0, y: 0 }, {
		stiffness: 0.05,
		damping: 0.25
	});

	function handleMouseMove(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		// Get the dimensions and position of the hero container
		const { left, top, width, height } = target.getBoundingClientRect();

		// Find the center of the container
		const centerX = left + width / 2;
		const centerY = top + height / 2;

		// Calculate how far the mouse is from the center.
		// Divide by 30 to make the movement subtle.
		const moveX = (e.clientX - centerX) / 30;
		const moveY = (e.clientY - centerY) / 30;

		// Setting the target animates the spring to the new values
		coords.target = { x: moveX, y: moveY };
	}

	function handleMouseLeave() {
		// Smoothly return the image to the exact center when the mouse leaves
		coords.target = { x: 0, y: 0 };
	}
</script>

<!--
  Hero Container:
  Notice the Svelte 5 event handlers: onmousemove and onmouseleave (no colon)
  The video background lives in +page.svelte now, pinned behind this section.
-->
<section
	class="relative flex h-screen w-full items-center justify-center overflow-hidden"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	aria-label="Product Showcase"
>
	<!-- Brand wordmark, sitting behind the product image -->
	<h1
		class="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center px-4 text-center font-primary text-[clamp(2.75rem,15vw,30rem)] leading-none tracking-tight text-black/85 [text-shadow:0_10px_40px_rgba(0,0,0,0.35)]"
	>
		ÆTHERA
	</h1>

	<!-- Product Image Wrapper -->
	<!-- We access the animated values via coords.current -->
	<div
		class="relative z-10 mt-10 transition-transform will-change-transform sm:mt-14 md:mt-20"
		style="transform: translate({coords.current.x}px, {coords.current.y}px);"
	>
		<img
			src={productImg}
			alt="Product Showcase"
			class="object-contain drop-shadow-2xl w-70 sm:w-90 md:w-130 lg:w-190"
		/>
	</div>
</section>
