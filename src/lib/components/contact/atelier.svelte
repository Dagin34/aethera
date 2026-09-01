<script lang="ts">
	import { onMount } from 'svelte';
	import atelierFilm from '$lib/assets/flavors/01-aurelis-concept-bg.mp4';

	/** The desks read the form, but nobody should have to use it. Listed from the
	 *  same source the form routes by, so an address can never be right in one
	 *  place and wrong in the other. */
	import { enquiries } from '$lib/enquiries';

	let film = $state<HTMLVideoElement | undefined>();

	// This sits at the far end of a long page, so it costs nothing until it is
	// reached: nothing is fetched, and nothing plays, until it comes into view.
	onMount(() => {
		if (!film) return;

		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		let observer: IntersectionObserver | undefined;

		// Armed a frame late on purpose. On the very first frame the page above
		// has not taken its full height yet, so this band sits near the top and
		// would trigger instantly — pulling megabytes nobody has scrolled to.
		const armed = requestAnimationFrame(() => {
			observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							film!.preload = 'auto';
							if (!reduced) film!.play().catch(() => {});
						} else {
							film!.pause();
						}
					}
				},
				{ rootMargin: '200px 0px' }
			);
			observer.observe(film!);
		});

		return () => {
			cancelAnimationFrame(armed);
			observer?.disconnect();
		};
	});
</script>

<section data-nav="light" aria-labelledby="atelier-heading" class="w-full shrink-0">
	<div class="mx-auto w-full max-w-6xl px-6 py-28 md:px-16 md:py-36 lg:px-24">
		<div class="grid gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] md:gap-20">
			<div>
				<h2 id="atelier-heading" class="eyebrow">The atelier</h2>

				<address class="place">
					Across from Karl Square<br />
					Bisrate Gebriel<br />
					Addis Ababa, Ethiopia
				</address>

				<p class="appointment">By appointment</p>

				<figure class="band">
					<video
						bind:this={film}
						src={atelierFilm}
						loop
						muted
						playsinline
						preload="none"
						aria-label="The atelier, filmed in low light"
					></video>
				</figure>
			</div>

			<div class="grid gap-12">
				<div>
					<h3 class="eyebrow">Write directly</h3>
					<ul class="mt-6 grid gap-0">
						{#each enquiries as enquiry (enquiry.slug)}
							<li class="desk">
								<span class="name">{enquiry.desk}</span>
								<a class="rule address" href="mailto:{enquiry.to}">{enquiry.to}</a>
							</li>
						{/each}
					</ul>
				</div>

				<div>
					<h3 class="eyebrow">Elsewhere</h3>
					<ul class="mt-6 flex flex-wrap gap-x-10 gap-y-3">
						<li>
							<a
								class="rule address"
								href="https://instagram.com/aethera_fragrance"
								target="_blank"
								rel="noopener noreferrer">Instagram</a
							>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.eyebrow {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		font-weight: 900;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--color-accent);
	}

	.place {
		margin-top: 1.5rem;
		font-family: var(--font-primary);
		font-size: clamp(1.35rem, 2.6vw, 2rem);
		font-style: normal;
		line-height: 1.35;
	}

	.appointment {
		margin-top: 1.5rem;
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-neutral) 55%, transparent);
	}

	/* A window rather than a picture — wide, low, and cropped, so it reads as a
	   glimpse of the room the address belongs to. */
	.band {
		position: relative;
		margin: 3rem 0 0;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		background-color: color-mix(in oklab, var(--color-neutral) 8%, transparent);
	}

	.band video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.band::after {
		content: '';
		position: absolute;
		inset: 0;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--color-neutral) 14%, transparent);
	}

	.desk {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		padding: 0.85rem 0;
		border-bottom: 1px solid color-mix(in oklab, var(--color-neutral) 15%, transparent);
	}

	.name {
		font-family: var(--font-primary);
		font-size: clamp(1.05rem, 1.8vw, 1.3rem);
	}

	.address {
		font-family: var(--font-secondary);
		font-size: 0.8125rem;
		letter-spacing: 0.16em;
		color: color-mix(in oklab, var(--color-neutral) 70%, transparent);
	}

	/* The drawn underline the rest of the house uses for its links. */
	.rule {
		position: relative;
		display: inline-block;
		color: inherit;
		text-decoration: none;
	}

	.rule::before,
	.rule::after {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: -0.25em;
		height: 1px;
	}

	.rule::before {
		background-color: currentColor;
		opacity: 0.25;
	}

	.rule::after {
		background-color: var(--color-accent);
		transform: scaleX(0);
		transform-origin: left;
		transition: transform 480ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.rule:hover::after,
	.rule:focus-visible::after {
		transform: scaleX(1);
	}

	.rule:focus-visible {
		outline: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.rule::after {
			transition-duration: 1ms;
		}
	}
</style>
