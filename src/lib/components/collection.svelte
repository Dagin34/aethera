<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Spring } from 'svelte/motion';
	import type { Collection } from '$lib/collections';

	let { collection }: { collection: Collection } = $props();

	/** Screens of the preceding section this one rises over. Slightly more than one,
	 *  so the curtain starts while that section is still pinned rather than after it
	 *  has already scrolled away. */
	const OVERLAP = 1.15;
	/** Screens of scroll the whole section is scrubbed across. */
	const TRAVEL = 4.8;

	// Choreography, as fractions of TRAVEL.
	const OPEN_END = 0.13; // curtain has finished rising
	const ARRIVE_START = 0.06;
	const ARRIVE_END = 0.27; // bottle and wordmark have landed
	// The notes travel an L: right along the bottom of the frame first, then up into
	// the right column. A straight diagonal would drag them across the bottle.
	const SLIDE_START = 0.38; // bottle moves left, notes move right
	const SLIDE_END = 0.5;
	const RISE_START = 0.47; // notes climb to the middle of the right column
	const RISE_END = 0.6;
	const DRY_START = 0.6; // the reel starts rolling
	const DRY_END = 0.96;

	/** Below this the composition never splits — there is no room for two columns. */
	const SPLIT_AT = '(min-width: 1024px)';

	/** Share of each hand-over spent holding still before the reel rolls. */
	const HOLD = 0.4;
	/** Letters still in flight at any one moment as the wordmark assembles. */
	const SPREAD = 5;
	/** Breathing room between the bottle and the notes before they separate. */
	const GAP = 32;
	/** Depth of the soft edge a note dissolves through as the reel rolls. */
	const FADE = 34;

	const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);
	const easeOut = (t: number) => 1 - (1 - t) ** 3;
	const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

	const letters = $derived([...collection.name]);
	const phases = $derived(collection.phases);
	const count = $derived(phases.length);

	let wrapper: HTMLElement;
	let body: HTMLElement;
	let film: HTMLVideoElement;
	let phaseEls: HTMLElement[] = $state([]);

	let scrubbing = $state(false); // false until we know motion is welcome
	let target = 0;
	let progress = $state(0);

	// Measured rather than guessed, so the split lands exactly on the column grid
	// at any viewport width.
	let splits = $state(false);
	let noteHeight = $state(0);
	let shiftX = $state(0);
	let shiftY = $state(0);
	let productX = $state(0);

	/** The reel is the tallest note plus a soft edge at each end to roll through. */
	const reelHeight = $derived(noteHeight + FADE * 2);

	const pointer = new Spring({ x: 0, y: 0 }, { stiffness: 0.015, damping: 0.9 });

	const open = $derived(scrubbing ? easeInOut(clamp(progress / OPEN_END)) : 1);
	const arrive = $derived(
		scrubbing ? easeOut(clamp((progress - ARRIVE_START) / (ARRIVE_END - ARRIVE_START))) : 1
	);
	/** How far the fragrance has travelled overall — drives the grade and the drift. */
	const mood = $derived(
		scrubbing ? clamp((progress - ARRIVE_END) / (DRY_END - ARRIVE_END)) : 0
	);
	const dry = $derived(scrubbing ? clamp((progress - DRY_START) / (DRY_END - DRY_START)) : 0);

	const slide = $derived(
		scrubbing && splits ? easeInOut(clamp((progress - SLIDE_START) / (SLIDE_END - SLIDE_START))) : 0
	);
	const rise = $derived(
		scrubbing && splits ? easeInOut(clamp((progress - RISE_START) / (RISE_END - RISE_START))) : 0
	);
	/** The tagline has had the whole centred composition to itself; it steps aside. */
	const taglineOut = $derived(
		scrubbing && splits
			? clamp((progress - SLIDE_START) / ((SLIDE_END - SLIDE_START) * 0.8))
			: 0
	);

	const glyphs = $derived(
		letters.map((_, i) => clamp((arrive * (letters.length + SPREAD) - i) / SPREAD))
	);

	/** Reel position in phase-indices, holding on each note before rolling to the next. */
	const reel = $derived.by(() => {
		if (!scrubbing || count < 2) return 0;
		const raw = dry * (count - 1);
		const i = Math.min(count - 2, Math.floor(raw));
		const f = raw - i;
		return i + easeInOut(clamp((f - HOLD) / (1 - HOLD)));
	});

	const active = $derived(Math.round(reel));

	function place() {
		if (!body) return;

		noteHeight = phaseEls.reduce((tallest, el) => Math.max(tallest, el?.offsetHeight ?? 0), 0);

		const bw = body.clientWidth;
		const bh = body.clientHeight;

		// The reel starts flush to the bottom-left of the stage and ends in the right
		// column, vertically centred.
		shiftX = bw * 0.52;
		shiftY = -(bh - noteHeight - FADE * 2) / 2;
		productX = -bw * 0.26;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!scrubbing || !(e.currentTarget instanceof HTMLElement)) return;
		const { left, top, width, height } = e.currentTarget.getBoundingClientRect();

		pointer.target = {
			x: (e.clientX - (left + width / 2)) / 22,
			y: (e.clientY - (top + height / 2)) / 22
		};
	}

	function handleMouseLeave() {
		pointer.target = { x: 0, y: 0 };
	}

	onMount(() => {
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const roomToSplit = window.matchMedia(SPLIT_AT);

		// The film is heavy; only spend decode time on it while the section is in view,
		// and hold it on a single frame for anyone who asked for less motion.
		const watcher = new IntersectionObserver(
			([entry]) => {
				if (!film) return;
				if (!entry.isIntersecting) {
					film.pause();
					return;
				}
				if (reduce) {
					film.pause();
					if (film.readyState >= 2 && film.currentTime === 0) film.currentTime = 1;
				} else {
					film.play().catch(() => {});
				}
			},
			{ rootMargin: '25%' }
		);
		watcher.observe(wrapper);

		if (reduce) {
			// Nothing will play, so pull down enough of the file to paint one frame.
			film.preload = 'auto';
			film.addEventListener('loadeddata', () => (film.currentTime = 1), { once: true });
			film.load();
			return () => watcher.disconnect();
		}
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

		function onLayout() {
			splits = roomToSplit.matches;
			place();
			measure();
			onScroll();
		}

		measure();
		progress = target;

		// The reel's height depends on how the notes wrap, which depends on the fonts.
		tick().then(onLayout);
		document.fonts?.ready.then(onLayout);

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onLayout);
		roomToSplit.addEventListener('change', onLayout);
		return () => {
			if (frame) cancelAnimationFrame(frame);
			watcher.disconnect();
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onLayout);
			roomToSplit.removeEventListener('change', onLayout);
		};
	});
</script>

<section
	bind:this={wrapper}
	aria-labelledby="{collection.slug}-heading"
	class="collection relative z-10 w-full shrink-0"
	style="--deep: {collection.tone.deep}; --ink: {collection.tone.ink}; --glow: {collection.tone
		.glow};{scrubbing
		? ` margin-top: -${OVERLAP * 100}vh; height: calc(100vh + ${TRAVEL * 100}vh);`
		: ''}"
>
	<div
		class="stage w-full overflow-hidden"
		class:h-screen={scrubbing}
		class:min-h-screen={!scrubbing}
		style="position: {scrubbing ? 'sticky' : 'relative'}; top: 0;{scrubbing
			? ` clip-path: inset(${(1 - open) * 100}% 0 0 0);`
			: ''}"
		onmousemove={handleMouseMove}
		onmouseleave={handleMouseLeave}
		role="presentation"
	>
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<video
				bind:this={film}
				src={collection.video}
				loop
				muted
				playsinline
				preload="metadata"
				class="absolute inset-0 h-full w-full object-cover"
				style="transform: translateY({(1 - open) * 6}vh) scale({1.06 +
					mood * 0.07}); filter: brightness({1 - mood * 0.22}) saturate({1 - mood * 0.15});"
			></video>
			<div class="veil"></div>
			<div class="vignette"></div>
		</div>

		{#if scrubbing && open < 1}
			<div
				class="meniscus"
				aria-hidden="true"
				style="top: {(1 - open) * 100}%; opacity: {1 - clamp((open - 0.8) / 0.2)};"
			></div>
		{/if}

		<div
			class="relative mx-auto flex w-full max-w-[100rem] flex-col px-6 pt-6 pb-8 md:px-12 md:pt-8 md:pb-10 lg:px-20"
			class:h-full={scrubbing}
			class:min-h-screen={!scrubbing}
		>
			<div class="shrink-0" style="opacity: {arrive};">
				<div class="masthead">
					<span>ÆTHERA — {collection.name}</span>
					<span class="hidden sm:inline">{collection.meta}</span>
				</div>
				<div
					class="mt-3 h-px w-full origin-left bg-[color-mix(in_oklab,var(--ink)_22%,transparent)]"
					style="transform: scaleX({arrive});"
				></div>
				<p class="tagline" style="opacity: {1 - taglineOut};">{collection.tagline}</p>
			</div>

			<div
				bind:this={body}
				class="body relative min-h-0 flex-1"
				class:flowing={!scrubbing}
				style={scrubbing ? `--lift: ${(1 - rise) * (noteHeight + GAP)}px;` : undefined}
			>
				<h2
					id="{collection.slug}-heading"
					class="wordmark"
					style={scrubbing
						? `--mark: ${(12 - 4.5 * rise).toFixed(1)}%; transform: translate(${productX * slide * 0.85}px, ${(1 - arrive) * 1.5}rem);`
						: undefined}
				>
					<span class="sr-only">{collection.name}</span>
					<span aria-hidden="true"
						>{#each letters as letter, i (i)}<span
								style="opacity: {glyphs[i]}; transform: translateY({(1 - glyphs[i]) *
									0.4}em);">{letter}</span
							>{/each}</span
						>
				</h2>

				<div
					class="product"
					style={scrubbing ? `transform: translateX(${productX * slide}px);` : undefined}
				>
					<img
						src={collection.bottle}
						alt={collection.bottleAlt}
						class="bottle h-auto max-h-full w-auto max-w-[min(70vw,24rem)] object-contain"
						style={scrubbing
							? `opacity: ${arrive}; transform: translate3d(${pointer.current.x}px, calc(${pointer.current.y}px + ${(1 - arrive) * 7}vh - ${mood * 2}vh), 0) scale(${(1.06 - 0.06 * arrive) * (1 - 0.08 * slide)});`
							: undefined}
					/>
				</div>

				<div
					class="reel"
					class:rolling={scrubbing}
					style={scrubbing
						? `height: ${reelHeight}px; transform: translate(${shiftX * slide}px, ${shiftY * rise}px);`
						: undefined}
				>
					{#each phases as phase, i (phase.time)}
						<div
							class="phase"
							style={scrubbing
								? `transform: translateY(${(i - reel) * reelHeight}px); opacity: ${1 - Math.min(1, Math.abs(i - reel) * 1.25)};`
								: undefined}
						>
							<!-- Measured for the reel's height, so it never depends on the height
							     the reel is given. -->
							<div bind:this={phaseEls[i]}>
								<p class="time">{phase.time}</p>
								<p class="notes">
									{#each phase.notes as note, j (note)}<span>{note}</span>{#if j < phase.notes.length - 1}<i
												aria-hidden="true">·</i
											>{/if}{/each}
								</p>
								<p class="line">{phase.text}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="flex shrink-0 items-end justify-end gap-8" style="opacity: {arrive};">
				<div class="flex flex-col items-end gap-5">
					{#if scrubbing}
						<div
							class="gauge"
							role="progressbar"
							aria-label="Progress through the dry-down"
							aria-valuemin={0}
							aria-valuemax={100}
							aria-valuenow={Math.round((reel / (count - 1)) * 100)}
						>
							<div class="fill" style="transform: scaleX({reel / (count - 1)});"></div>
							{#each phases as phase, i (phase.time)}
								<span
									class="pip"
									class:on={i === active}
									style="left: {(i / (count - 1)) * 100}%;"
								></span>
							{/each}
						</div>
					{/if}

					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={collection.link.href} class="rule">{collection.link.label}</a>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	/* `position` is set inline — it toggles with the scrub, and an inline value
	   avoids racing Tailwind's own positioning utilities on specificity. */
	.stage {
		background-color: var(--deep);
		color: var(--ink);
	}

	/* Two scrims: a vertical one to seat the type, a vignette to close the frame in. */
	.veil {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			color-mix(in oklab, var(--deep) 82%, transparent) 0%,
			color-mix(in oklab, var(--deep) 20%, transparent) 44%,
			color-mix(in oklab, var(--deep) 90%, transparent) 100%
		);
	}

	.vignette {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			120% 82% at 50% 46%,
			transparent 32%,
			color-mix(in oklab, var(--deep) 72%, transparent) 100%
		);
	}

	/* The leading edge of the curtain as it rises over the section above. */
	.meniscus {
		position: absolute;
		inset-inline: 0;
		height: 1px;
		background-color: var(--glow);
		box-shadow:
			0 0 12px 1px color-mix(in oklab, var(--glow) 55%, transparent),
			0 0 44px 6px color-mix(in oklab, var(--glow) 22%, transparent);
	}

	.masthead {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--ink) 58%, transparent);
	}

	.tagline {
		margin-top: clamp(1.25rem, 3vh, 2.25rem);
		text-align: center;
		font-family: var(--font-primary);
		font-style: italic;
		font-size: clamp(1.35rem, 3.2vw, 2.6rem);
		line-height: 1.15;
		text-wrap: balance;
	}

	/* Same composition as the hero: the name set behind the thing it names. */
	.wordmark {
		position: absolute;
		inset: 0;
		z-index: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Lifted off centre so it sits behind the bottle's shoulder, not its label. */
		padding-bottom: calc(13% + var(--lift, 0px) * 0.5);
		font-size: clamp(3.25rem, 11.5vw, 13rem);
		line-height: 1;
		letter-spacing: 0.08em;
		white-space: nowrap;
		/* Steps back once the notes take the right-hand column. */
		color: color-mix(in oklab, var(--ink) var(--mark, 12%), transparent);
		user-select: none;
		pointer-events: none;
	}

	.wordmark span span {
		display: inline-block;
	}

	.product {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		/* Room held for the notes until they move out to the right column. */
		padding-bottom: var(--lift, 0px);
	}

	.bottle {
		position: relative;
		z-index: 1;
		filter: drop-shadow(0 30px 60px rgb(0 0 0 / 0.55));
		will-change: transform;
	}

	.reel {
		position: absolute;
		inset-inline-start: 0;
		bottom: 0;
		z-index: 2;
		width: 100%;
		will-change: transform;
	}

	/* Notes dissolve through the reel's edges rather than being cut off by them. */
	.reel.rolling {
		--fade: 34px;
		overflow: hidden;
		mask-image: linear-gradient(
			to bottom,
			transparent 0,
			#000 var(--fade),
			#000 calc(100% - var(--fade)),
			transparent 100%
		);
	}

	@media (min-width: 1024px) {
		.reel {
			width: min(30rem, 46%);
		}
	}

	/* Every note sits optically centred on the bottle, whatever its own height. */
	.reel.rolling .phase {
		position: absolute;
		inset-inline: 0;
		top: 0;
		display: flex;
		height: 100%;
		flex-direction: column;
		justify-content: center;
	}

	/* Never let the flex container squeeze a note: its natural height is what the
	   reel is sized from, so shrinking it here would feed a wrong measurement back. */
	.reel.rolling .phase > * {
		flex: none;
	}

	.time {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--glow);
	}

	.notes {
		margin-top: 0.75rem;
		font-family: var(--font-primary);
		font-size: clamp(1.05rem, 1.9vw, 1.65rem);
		line-height: 1.35;
	}

	.notes i {
		font-style: normal;
		margin-inline: 0.6em;
		color: color-mix(in oklab, var(--ink) 34%, transparent);
	}

	.line {
		margin-top: 0.65rem;
		max-width: 46ch;
		font-family: var(--font-primary);
		font-size: 0.9375rem;
		line-height: 1.6;
		color: color-mix(in oklab, var(--ink) 62%, transparent);
	}

	/* Without the scrub there is no fixed-height stage to fill, so everything
	   that was stacked falls back into ordinary flow. */
	.body.flowing {
		display: flex;
		flex-direction: column;
		gap: 3rem;
		padding-block: 3rem;
	}

	.body.flowing .product {
		position: relative;
		inset: auto;
		min-height: 58vh;
	}

	.body.flowing .reel {
		position: relative;
		inset: auto;
		display: grid;
		gap: 2.5rem;
	}

	.gauge {
		position: relative;
		width: 7rem;
		height: 1px;
		background-color: color-mix(in oklab, var(--ink) 24%, transparent);
	}

	.gauge .fill {
		position: absolute;
		inset: 0;
		transform-origin: left;
		background-color: var(--glow);
	}

	.pip {
		position: absolute;
		top: 50%;
		width: 0.3rem;
		height: 0.3rem;
		translate: -50% -50%;
		rotate: 45deg;
		background-color: color-mix(in oklab, var(--ink) 45%, transparent);
		transition: background-color 400ms ease-out;
	}

	.pip.on {
		background-color: var(--glow);
	}

	/* The drawn underline, same gesture as the footer's links. */
	.rule {
		position: relative;
		display: inline-block;
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		text-decoration: none;
		color: inherit;
	}

	.rule::before,
	.rule::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: -0.45em;
		height: 1px;
	}

	.rule::before {
		background-color: currentColor;
		opacity: 0.3;
	}

	.rule::after {
		background-color: var(--glow);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.rule:hover::after,
	.rule:focus-visible::after {
		transform: scaleX(1);
	}

	/* The drawn stroke is the focus indicator, so it needs room to be seen. */
	.rule:focus-visible {
		outline: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.rule::after {
			transition-duration: 1ms;
		}

		.pip {
			transition-duration: 1ms;
		}
	}
</style>
