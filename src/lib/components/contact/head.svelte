<script lang="ts">
	import { onMount } from 'svelte';
	import { RESPONSE_TIME } from '$lib/enquiries';
	import portrait from '$lib/assets/lady-spraying.png';

	/** How much scroll the head holds before the writing room covers it, in screens. */
	const RUNWAY = 0.85;

	let section: HTMLElement;
	let pinned = $state(false); // false until we know motion is welcome
	let cover = $state(0); // 0 while the head has the screen, 1 as it is covered

	const clamp = (n: number, min = 0, max = 1) => Math.min(Math.max(n, min), max);

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		pinned = true;

		let frame = 0;

		function measure() {
			const rect = section.getBoundingClientRect();
			const travel = rect.height - window.innerHeight;
			cover = travel > 0 ? clamp(-rect.top / travel) : 0;
			frame = 0;
		}

		function onScroll() {
			if (!frame) frame = requestAnimationFrame(measure);
		}

		measure();
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
	bind:this={section}
	data-nav="light"
	aria-labelledby="contact-heading"
	class="relative w-full shrink-0"
	style={pinned ? `height: calc(100vh + ${RUNWAY * 100}vh)` : undefined}
>
	<div
		class="frame"
		class:sticky={pinned}
		class:top-0={pinned}
		class:h-screen={pinned}
		class:min-h-screen={!pinned}
	>
		<!-- The type recedes as it is covered; the picture holds a moment longer,
		     which is what gives the hand-off its depth. -->
		<div
			class="words"
			style="opacity: {1 - cover * 1.25}; transform: translateY({cover * -6}vh) scale({1 -
				cover * 0.04});"
		>
			<p class="eyebrow">Correspondence</p>

			<h1 id="contact-heading" class="statement">Write to the house.</h1>

			<p class="lead">
				A fragrance, a shelf, a page in print, or something made only once — tell us which, and it
				reaches the right desk.
			</p>

			<p class="promise">We answer within {RESPONSE_TIME}.</p>
		</div>

		<!-- Runs off the right edge of the page on purpose: the picture is the
		     ground the type is written on, not an illustration beside it. -->
		<figure class="plate">
			<div class="pan" style="transform: translateY({cover * -4}vh) scale({1 + cover * 0.06});">
				<img
					src={portrait}
					alt="A woman wearing ÆTHERA, caught in the moment the spray lands"
					fetchpriority="high"
				/>
			</div>
			<div class="wash" aria-hidden="true"></div>
		</figure>
	</div>
</section>

<style>
	.frame {
		display: grid;
		width: 100%;
		grid-template-rows: 1fr auto;
		overflow: hidden;
	}

	.words {
		grid-area: 1 / 1;
		align-self: center;
		z-index: 1;
		padding: 7rem 1.5rem 2rem;
	}

	.plate {
		grid-area: 2 / 1;
		position: relative;
		margin: 0;
		height: 46vh;
		overflow: hidden;
		background-color: color-mix(in oklab, var(--color-neutral) 8%, transparent);
	}

	/* On anything with room, the picture takes its own column and runs off the
	   right edge, held clear of the top so the bar always has cream to sit on. */
	@media (min-width: 768px) {
		.frame {
			grid-template-rows: 1fr;
			grid-template-columns: minmax(0, 1fr) minmax(0, 0.92fr);
			align-items: stretch;
		}

		.words {
			grid-area: 1 / 1;
			padding: 6rem 3rem 6rem 4rem;
		}

		.plate {
			grid-area: 1 / 2;
			height: auto;
			margin-top: 5.5rem;
		}
	}

	@media (min-width: 1024px) {
		.words {
			padding-left: 6rem;
			padding-right: 4rem;
		}
	}

	.pan {
		width: 100%;
		height: 100%;
		will-change: transform;
	}

	.plate img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: 50% 28%;
		/* A still photograph, given a breath so the screen is never quite static. */
		animation: drift 26s ease-in-out infinite alternate;
	}

	@keyframes drift {
		from {
			transform: scale(1.06) translate3d(0, 0, 0);
		}
		to {
			transform: scale(1.14) translate3d(-2%, -1.5%, 0);
		}
	}

	/* The picture has to hand back to cream at its inner edge, or the type would
	   be sitting on a hard vertical seam. */
	.wash {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			var(--color-background) 0%,
			color-mix(in oklab, var(--color-background) 55%, transparent) 12%,
			transparent 42%
		);
	}

	@media (min-width: 768px) {
		.wash {
			background: linear-gradient(
				to right,
				var(--color-background) 0%,
				color-mix(in oklab, var(--color-background) 30%, transparent) 14%,
				transparent 38%
			);
		}
	}

	.eyebrow {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		font-weight: 900;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.statement {
		margin-top: 1.25rem;
		font-family: var(--font-primary);
		font-size: clamp(2.75rem, 6.4vw, 6.5rem);
		line-height: 0.98;
		letter-spacing: -0.015em;
		text-wrap: balance;
	}

	.lead {
		max-width: 30ch;
		margin-top: 2rem;
		font-family: var(--font-primary);
		font-size: clamp(1.05rem, 1.7vw, 1.4rem);
		line-height: 1.5;
		color: color-mix(in oklab, var(--color-neutral) 78%, transparent);
	}

	/* The one thing on this screen that answers the reader's real question. */
	.promise {
		/* Not ch: the tracking here is wide enough that a character count badly
		   under-measures the line, and it wraps mid-phrase. */
		max-width: 26rem;
		margin-top: 2.5rem;
		padding-top: 1.25rem;
		border-top: 1px solid color-mix(in oklab, var(--color-neutral) 22%, transparent);
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-neutral) 62%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.plate img {
			animation: none;
			transform: scale(1.06);
		}
	}
</style>
