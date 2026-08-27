<script lang="ts">
	import { onMount } from 'svelte';

	type Passage = {
		label: string;
		text: string;
	};

	const passages: Passage[] = [
		{
			label: 'Origin',
			text: "At ÆTHERA, every fragrance begins with a careful selection of nature's finest ingredients. Sourced from trusted growers and expertly blended, each note is chosen for its purity, character, and timeless elegance. The result is a luxurious scent that unfolds beautifully on the skin, leaving behind a sophisticated impression that feels both personal and unforgettable."
		},
		{
			label: 'Composition',
			text: 'Nothing here is rushed. A composition rests for months before it earns a name, and only the accords still holding their shape at the end of that wait are kept. What survives is deliberately small — a handful of notes, each given room to breathe.'
		},
		{
			label: 'Impression',
			text: 'A fragrance should arrive a moment before you do, and stay a moment after you leave. Ours are built to move with the hour and with the skin that carries them, so what you wear at dusk is never quite what you put on at dawn.'
		}
	];

	const SCREENS_PER_PASSAGE = 1.15;

	const WRITE_START = 0.1;
	const WRITE_END = 0.62;
	const HOLD_END = 0.88;

	const HANDOVER = 1 - HOLD_END;

	const OVERSHOOT = 44;

	const FULLY_WRITTEN = 1e6;

	const count = passages.length;

	const written = passages.map((passage) => ({
		...passage,
		glyphs: [...passage.text].map((char, index) => ({ char, index })),
		length: passage.text.length
	}));

	const starts = passages.map((_, i) => (i * HOLD_END) / count);
	const spans = starts.map((start, i) => (starts[i + 1] ?? 1) - start);

	let wrapper: HTMLElement;
	let scrubbing = $state(false); // false until we know motion is welcome
	let target = 0; // raw scroll progress, 0-1
	let progress = $state(0); // same, with a little ink-flow lag

	const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

	const stages = $derived(
		written.map((passage, i) => {
			if (!scrubbing) return { reveal: FULLY_WRITTEN, exit: 0 };

			const local = clamp((progress - starts[i]) * count);

			const stroke = clamp((local - WRITE_START) / (WRITE_END - WRITE_START));
			const reveal = stroke * (passage.length + OVERSHOOT);

			const exit =
				i === count - 1 ? 0 : Math.sqrt(clamp((local - HOLD_END) / HANDOVER));

			return { reveal, exit };
		})
	);

	const active = $derived(Math.max(0, starts.findLastIndex((start) => progress >= start)));

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		scrubbing = true;

		let frame = 0;

		function measure() {
			const rect = wrapper.getBoundingClientRect();
			const travel = rect.height - window.innerHeight;
			target = travel > 0 ? clamp(-rect.top / travel) : 0;
		}

		function flow() {
			measure();

			const delta = target - progress;
			if (Math.abs(delta) < 0.0002) {
				progress = target;
				frame = 0;
				return;
			}
			progress += delta * 0.28;
			frame = requestAnimationFrame(flow);
		}

		function onScroll() {
			if (!frame) frame = requestAnimationFrame(flow);
		}

		measure();
		progress = target;

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<section
	bind:this={wrapper}
	aria-labelledby="beliefs-heading"
	data-nav="light"
	class="relative w-full shrink-0"
	style={scrubbing
		? `height: calc(100vh + ${count * SCREENS_PER_PASSAGE * 100}vh)`
		: undefined}
>
	<div
		class="flex w-full flex-col justify-center gap-10 px-6 py-24 md:gap-16 md:px-16 lg:px-24"
		class:sticky={scrubbing}
		class:top-0={scrubbing}
		class:h-screen={scrubbing}
		class:overflow-hidden={scrubbing}
		class:min-h-screen={!scrubbing}
	>
		<div class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-transparent to-white/20"></div>

		{#if scrubbing}
			<div class="mx-auto w-full max-w-6xl">
				<div
					class="grid font-secondary text-black text-[0.6875rem] tracking-[0.22em] uppercase md:text-sm font-black"
					style="grid-template-columns: {spans.map((s) => `${s}fr`).join(' ')};"
				>
					{#each written as passage, i (passage.label)}
						<span
							class="pr-2 transition-colors duration-500 ease-out"
							class:text-accent={i === active}
							class:text-neutral={i !== active}
							class:opacity-70={i !== active}>{passage.label}</span
						>
					{/each}
				</div>

				<div
					class="relative mt-3 h-px w-full bg-black/50"
					role="progressbar"
					aria-label="Progress through our beliefs"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.round(progress * 100)}
				>
					<div
						class="absolute inset-y-0 left-0 w-full origin-left bg-accent"
						style="transform: scaleX({progress});"
					></div>

					{#each starts.slice(1) as start (start)}
						<span
							class="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-black/50"
							style="left: {start * 100}%;"
						></span>
					{/each}

					<span
						class="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-accent"
						style="left: {progress * 100}%;"
					></span>
				</div>
			</div>
		{/if}

		<div class="mx-auto w-full max-w-6xl">
			<div class="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,4.5fr)] md:gap-16">
				<h2
					id="beliefs-heading"
					class="font-secondary text-sm font-black tracking-[0.22em] text-black/70 uppercase md:pt-3 md:text-sm"
				>
					Who are we?
				</h2>

				<div class="grid gap-8">
					{#each written as passage, i (passage.label)}
						<p
							class="passage font-black text-[clamp(1.3rem,2.6vw,2.6rem)] leading-[1.3] text-balance"
							style="--reveal: {stages[i].reveal}; --exit: {stages[i].exit};"
						>
							<span class="sr-only">{passage.text}</span>
							<span aria-hidden="true"
								>{#each passage.glyphs as glyph (glyph.index)}<span
										class="ink"
										style="--i: {glyph.index};">{glyph.char}</span
									>{/each}</span
							>
						</p>
					{/each}
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	@property --reveal {
		syntax: '<number>';
		inherits: true;
		initial-value: 0;
	}

	@property --i {
		syntax: '<number>';
		inherits: false;
		initial-value: 0;
	}

	.passage {
		grid-area: 1 / 1;
		opacity: calc(1 - var(--exit));
	}

	.ink {
		--stroke: 12;
		--settle: 26;
		--wet: clamp(0, calc((var(--reveal) - var(--i)) / var(--stroke)), 1);
		--dry: clamp(0, calc((var(--reveal) - var(--i) - var(--stroke)) / var(--settle)), 1);

		opacity: var(--wet);
		color: color-mix(
			in oklab,
			var(--color-neutral) calc(var(--dry) * 100%),
			var(--color-accent)
		);
	}

	@media (prefers-reduced-motion: reduce) {
		.passage {
			grid-area: auto;
			opacity: 1;
		}

		.ink {
			opacity: 1;
			color: var(--color-neutral);
		}
	}
</style>
