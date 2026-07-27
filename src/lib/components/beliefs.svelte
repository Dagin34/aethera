<script lang="ts">
	import { onMount } from 'svelte';

	// Scroll-scrubbed "written by hand" section.
	//
	// The whole thing lives inside a tall wrapper with a `sticky` pane, so the
	// pane parks in the viewport while the wrapper's remaining height scrolls
	// past. That parked stretch is the budget we spend on writing the passages:
	// scroll position maps straight onto how many characters have been laid
	// down, which is why scrolling faster writes faster and scrolling back up
	// un-writes. Native sticky rather than scroll hijacking, so the scrollbar,
	// keyboard, and trackpad all keep behaving normally.

	type Passage = {
		/** Short name for the progress rail — these are the movements of a scent. */
		label: string;
		text: string;
	};

	// Passage one is the house statement. Two and three continue it, and each
	// one is a real stage in how a fragrance is made and worn, which is what
	// gives the rail above something true to count.
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

	/** Screens of scroll spent on each passage: write it, hold it, clear it. */
	const SCREENS_PER_PASSAGE = 1.15;

	/** Fraction of a passage's slot spent waiting / writing / holding / clearing. */
	const WRITE_START = 0.1;
	const WRITE_END = 0.62;
	const HOLD_END = 0.88;

	// Each passage starts its slot the moment the previous one starts clearing,
	// so the handover is one continuous gesture instead of a blank beat. The
	// short WRITE_START pause above is what keeps the two from colliding: the
	// outgoing passage is nearly gone by the time new ink appears.
	const HANDOVER = 1 - HOLD_END;

	// Characters of lead-in past the last glyph. It has to cover the full
	// stroke + settle distance from the CSS below, or the closing words would
	// still be wet terracotta when the passage reaches its hold.
	const OVERSHOOT = 44;

	/** Stand-in for "everything is written" when there is nothing to scrub. */
	const FULLY_WRITTEN = 1e6;

	const count = passages.length;

	// One span per character, each stamped with its position in the passage.
	// Spaces get a span too, which keeps them as ordinary line-break
	// opportunities so the text wraps exactly as unsplit prose would.
	const written = passages.map((passage) => ({
		...passage,
		glyphs: [...passage.text].map((char, index) => ({ char, index })),
		length: passage.text.length
	}));

	// Where each passage takes over, as a fraction of the whole scrub. The rail
	// is laid out from these same numbers, so its ticks sit exactly on the
	// handovers and the last segment reads as wide as its longer hold really is.
	const starts = passages.map((_, i) => (i * HOLD_END) / count);
	const spans = starts.map((start, i) => (starts[i + 1] ?? 1) - start);

	let wrapper: HTMLElement;
	let scrubbing = $state(false); // false until we know motion is welcome
	let target = 0; // raw scroll progress, 0-1
	let progress = $state(0); // same, with a little ink-flow lag

	const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

	/** Per-passage state, derived once per progress change rather than per glyph. */
	const stages = $derived(
		written.map((passage, i) => {
			if (!scrubbing) return { reveal: FULLY_WRITTEN, exit: 0 };

			const local = clamp((progress - starts[i]) * count);

			const stroke = clamp((local - WRITE_START) / (WRITE_END - WRITE_START));
			const reveal = stroke * (passage.length + OVERSHOOT);

			// The last passage never clears — it stays standing as the section
			// ends. The square root front-loads the fade so the block is mostly
			// gone early, leaving the tail of the clear to overlap harmlessly.
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

		// Easing toward the scroll position gives the ink a touch of flow without
		// ever untethering it from the scrollbar. Measuring inside the frame keeps
		// the layout read to once per paint instead of once per scroll event, and
		// the loop parks itself as soon as the ink catches up.
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
		<!-- Cream veil: lifts the text off the moving video without hiding it. -->
		<div class="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-transparent to-background/20"></div>

		{#if scrubbing}
			<!--
			  Progress rail. It sits above the passage and counts the three
			  movements by name, so it reports where you are in the sequence
			  rather than just that something is moving.
			-->
			<div class="mx-auto w-full max-w-6xl">
				<div
					class="grid font-secondary text-[0.6875rem] tracking-[0.22em] uppercase md:text-xs"
					style="grid-template-columns: {spans.map((s) => `${s}fr`).join(' ')};"
				>
					<!--
					  Every label stays readable — the active one shifts to the
					  accent rather than the others dimming out of contrast. The
					  fill and the marker below carry the position, so nothing
					  here depends on telling the colours apart.
					-->
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
					class="relative mt-3 h-px w-full bg-neutral/20"
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

					<!-- A tick on each handover, so the marker crossing one means something. -->
					{#each starts.slice(1) as start (start)}
						<span
							class="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-neutral/25"
							style="left: {start * 100}%;"
						></span>
					{/each}

					<!-- The head of the stroke: the one thing your eye tracks. -->
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
					class="font-secondary text-xs tracking-[0.22em] text-neutral/70 uppercase md:pt-3 md:text-sm"
				>
					Our Beliefs
				</h2>

				<!--
				  All passages share one grid cell, so replacing one with the next
				  is a matter of what is inked in — nothing moves position, and the
				  cell is already as tall as the longest passage, so no reflow. The
				  gap only bites in the reduced-motion fallback below, where the
				  passages un-stack into three ordinary rows.
				-->
				<div class="grid gap-8">
					{#each written as passage, i (passage.label)}
						<p
							class="passage font-secondary text-[clamp(1.3rem,2.6vw,2.6rem)] leading-[1.3] text-balance"
							style="--reveal: {stages[i].reveal}; --exit: {stages[i].exit};"
						>
							<!-- Split text is hostile to screen readers, so they get the real thing. -->
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
	/* Registered so the browser resolves the arithmetic below as numbers. */
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
		/* Clearing a passage is a whole-block fade; the next one writes in fresh. */
		opacity: calc(1 - var(--exit));
	}

	/*
	  Every glyph carries its own index and reads the shared --reveal, so a
	  single style write on the paragraph advances hundreds of characters — no
	  per-character JavaScript, and the compositor does the rest.

	  --wet is how far this glyph is into the stroke; --dry trails it, which is
	  what makes fresh ink land terracotta and settle into the deep green a beat
	  later. That lag is the whole point of the effect.
	*/
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

	/* Nothing to scrub, so nothing to hide: passages stack and read as prose. */
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
