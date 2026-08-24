<script lang="ts">
	import productImg from '$lib/assets/landing-product.png';

	import { Spring } from 'svelte/motion';

	const coords = new Spring({ x: 0, y: 0 }, {
		stiffness: 0.01,
		damping: 2
	});

	function handleMouseMove(e: MouseEvent) {
		const target = e.currentTarget as HTMLElement;
		const { left, top, width, height } = target.getBoundingClientRect();

		const centerX = left + width / 2;
		const centerY = top + height / 2;

		const moveX = (e.clientX - centerX) / 3;
		const moveY = (e.clientY - centerY) / 3;

		coords.target = { x: moveX, y: moveY };
	}

	function handleMouseLeave() {
		coords.target = { x: 0, y: 0 };
	}
</script>

<section
	class="relative flex h-screen w-full items-center justify-center overflow-hidden"
	onmousemove={handleMouseMove}
	onmouseleave={handleMouseLeave}
	aria-label="Product Showcase"
>
	<h1
		class="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center px-4 text-center font-primary text-[clamp(2.75rem,15vw,30rem)] leading-none tracking-tight text-background [text-shadow:0_10px_40px_rgba(0,0,0,0.35)]"
	>
		ÆTHERA
	</h1>

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
