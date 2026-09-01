<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import Field from './field.svelte';
	import ambient from '$lib/assets/flavors/03-umbris-concept-bg.mp4';
	import { enquiries, DEFAULT_ENQUIRY, findEnquiry, RESPONSE_TIME } from '$lib/enquiries';
	import type { ContactResult } from '$lib/contact-types';

	let { form }: { form: ContactResult | null } = $props();

	const errors = $derived(form?.errors ?? {});
	const values = $derived(form?.values);

	/** The letter is addressed as it is written, so the chosen desk lives here
	 *  rather than only in the submitted form data. */
	let chosen = $state(DEFAULT_ENQUIRY.slug);
	const desk = $derived(findEnquiry(chosen) ?? DEFAULT_ENQUIRY);

	let sending = $state(false);
	/** Rows are handed in once, when the letter first comes into view. */
	let revealed = $state(true); // true until we know motion is welcome
	let fields = $state<HTMLElement | undefined>();
	let room = $state<HTMLElement | undefined>();
	let smoke = $state<HTMLVideoElement | undefined>();
	/** 0 until motion is known to be welcome, so the plates cut instead of fading. */
	let swap = $state(0);

	/** Swapping the form for the confirmation shortens the page under the reader,
	 *  which would otherwise leave them somewhere up in the head wondering whether
	 *  anything happened. Put the answer back in front of them. */
	async function show() {
		await tick();
		room?.scrollIntoView({
			behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
				? 'auto'
				: 'smooth',
			block: 'start'
		});
	}

	// A rejected submission comes back with what was chosen; keep the room in step.
	$effect(() => {
		const returned = values?.enquiry;
		if (returned && findEnquiry(returned)) chosen = returned;
	});

	const submit: SubmitFunction = () => {
		sending = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			sending = false;
			// Rejections keep their place — the errors are already on screen.
			if (result.type === 'success') await show();
		};
	};

	onMount(() => {
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Several megabytes of smoke that nobody has scrolled to yet. Nothing is
		// fetched, and nothing plays, until the room is actually on screen.
		const film = smoke;
		let watcher: IntersectionObserver | undefined;

		// Armed a frame late, for the same reason the atelier's band is: the head
		// above has not claimed its scroll runway yet on the first frame.
		const armed = requestAnimationFrame(() => {
			if (!film) return;
			watcher = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							film.preload = 'auto';
							if (!reduced) film.play().catch(() => {});
						} else {
							film.pause();
						}
					}
				},
				{ rootMargin: '300px 0px' }
			);
			watcher.observe(film);
		});

		const stopFilm = () => {
			cancelAnimationFrame(armed);
			watcher?.disconnect();
		};

		// Nothing to hand in when the page opened straight onto the confirmation.
		if (reduced || !fields) return stopFilm;
		swap = 620;
		revealed = false;

		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				revealed = true;
				observer.disconnect();
			},
			{ rootMargin: '0px 0px -20% 0px' }
		);

		observer.observe(fields);
		return () => {
			observer.disconnect();
			stopFilm();
		};
	});

	/** The other desks' views are several megabytes between them, so they are not
	 *  fetched until someone reaches for the list. By the time a choice is made
	 *  they are in cache and the plate crossfades instead of flashing empty. */
	let warmed = false;
	function warm() {
		if (warmed) return;
		warmed = true;
		for (const enquiry of enquiries) {
			if (enquiry.slug === chosen) continue;
			new Image().src = enquiry.image;
		}
	}

	/** The confirmation stands until it is dismissed. Held by identity rather than
	 *  a flag so the next submission brings its own confirmation back. */
	let dismissed = $state<ContactResult | null>(null);
	const sent = $derived(form?.success === true && form !== dismissed);
</script>

<section
	bind:this={room}
	class="letter relative w-full shrink-0"
	data-nav="dark"
	style="--glow: {desk.glow};"
>
	<!-- Smoke behind the ground, barely there. The room is lit and occupied, not
	     a black rectangle — but nothing here may compete with what is being read. -->
	<div class="film absolute inset-0 overflow-hidden" aria-hidden="true">
		<!-- Held to the viewport rather than stretched down the whole section, which
		     is long enough that cover would crop it to a smear. -->
		<div class="sticky top-0 h-screen">
			<video
				bind:this={smoke}
				src={ambient}
				loop
				muted
				playsinline
				preload="none"
				class="h-full w-full object-cover"
			></video>
		</div>
	</div>

	<div class="ground absolute inset-0" aria-hidden="true"></div>
	<!-- The leading edge of the room, same gesture the nav curtain arrives on. -->
	<div class="meniscus" aria-hidden="true"></div>

	<div class="relative mx-auto w-full max-w-6xl px-6 py-28 md:px-16 md:py-40 lg:px-24">
		{#if sent}
			<div class="confirmation" role="status">
				<p class="eyebrow">Sent</p>
				<p class="statement">
					Your letter is with {form?.desk?.toLowerCase() ?? 'the house'}.
				</p>
				<p class="lead">We answer within {RESPONSE_TIME}.</p>
				<button
					type="button"
					class="again rule"
					onclick={() => {
						dismissed = form;
						show();
					}}
				>
					Write another
				</button>
			</div>
		{:else}
			<form method="POST" use:enhance={submit} novalidate>
				<div class="grid gap-14 md:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] md:gap-20">
					<!-- Who it is to. The one thing on the page that answers back. -->
					<div class="addressee md:sticky md:top-32 md:self-start">
						<p class="eyebrow">This letter is to</p>

						<div aria-live="polite">
							{#key desk.slug}
								<p class="ink-line desk">
									<span class="sr-only">{desk.desk}</span>
									<span aria-hidden="true"
										>{#each [...desk.desk] as glyph, i (i)}<span class="ink" style="--i: {i};"
												>{glyph}</span
											>{/each}</span
									>
								</p>
								<p class="to">{desk.to}</p>
							{/key}
						</div>

						<!-- What the desk has in front of it. Changing the address changes
						     the view, so the choice is felt and not merely recorded. -->
						<figure class="plate">
							{#key desk.slug}
								<img
									src={desk.image}
									alt={desk.imageAlt}
									in:fade={{ duration: swap }}
									out:fade={{ duration: swap * 0.6 }}
								/>
							{/key}
						</figure>
					</div>

					<div bind:this={fields} class="grid gap-12" class:in={revealed}>
						<fieldset class="row reasons" style="--i: 0;">
							<legend class="eyebrow">Reason for writing</legend>

							<div class="mt-5 grid gap-1">
								{#each enquiries as enquiry (enquiry.slug)}
									<label
										class="reason"
										class:picked={chosen === enquiry.slug}
										onpointerenter={warm}
										onfocusin={warm}
									>
										<input
											type="radio"
											name="enquiry"
											value={enquiry.slug}
											checked={chosen === enquiry.slug}
											onchange={() => (chosen = enquiry.slug)}
										/>
										<span class="pip" aria-hidden="true"></span>
										<span class="name">{enquiry.label}</span>
										<span class="hint">{enquiry.hint}</span>
									</label>
								{/each}
							</div>

							{#if errors.enquiry}
								<p class="error" role="alert">{errors.enquiry}</p>
							{/if}
						</fieldset>

						<div class="row" style="--i: 1;">
							<Field
								name="name"
								label="Your name"
								required
								autocomplete="name"
								value={values?.name}
								error={errors.name}
							/>
						</div>

						<div class="row" style="--i: 2;">
							<Field
								name="email"
								label="Where we should reply"
								type="email"
								required
								autocomplete="email"
								value={values?.email}
								error={errors.email}
							/>
						</div>

						<div class="row" style="--i: 3;">
							<Field
								name="message"
								label="Message"
								type="textarea"
								required
								value={values?.message}
								error={errors.message}
								hint="A few lines is plenty."
							/>
						</div>

						<!-- Quiet company for anything filling every field it finds. -->
						<div class="trap" aria-hidden="true">
							<label for="company">Company</label>
							<input id="company" name="company" type="text" tabindex="-1" autocomplete="off" />
						</div>

						<div class="row flex flex-wrap items-baseline gap-x-8 gap-y-4" style="--i: 4;">
							<button type="submit" class="send rule" disabled={sending}>
								{sending ? 'Sending…' : 'Send the letter'}
							</button>

							{#if errors.form}
								<p class="error" role="alert">{errors.form}</p>
							{:else}
								<p class="aside">Or write to <span class="mono">{desk.to}</span> directly.</p>
							{/if}
						</div>
					</div>
				</div>
			</form>
		{/if}
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

	/* Registered so the room's light can move between desks instead of cutting. */
	@property --glow {
		syntax: '<color>';
		inherits: true;
		initial-value: #cd4631;
	}

	.letter {
		--room: #12100e;
		color: var(--color-background);
		transition: --glow 900ms ease-out;
	}

	/* A scrim, not a lid: the room colour is held just short of opaque so the
	   smoke reads as depth behind the letter without ever fighting the text. */
	.ground {
		background:
			radial-gradient(
				90% 55% at 50% 0%,
				color-mix(in oklab, var(--glow) 20%, transparent) 0%,
				transparent 70%
			),
			color-mix(in oklab, var(--room) 88%, transparent);
		transition: background 900ms ease-out;
	}

	.film {
		background-color: var(--room);
	}

	.meniscus {
		position: absolute;
		inset-inline: 0;
		top: 0;
		height: 1px;
		background-color: var(--glow);
		box-shadow:
			0 0 12px 1px color-mix(in oklab, var(--glow) 55%, transparent),
			0 0 44px 6px color-mix(in oklab, var(--glow) 22%, transparent);
		transition:
			background-color 900ms ease-out,
			box-shadow 900ms ease-out;
	}

	.eyebrow {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		font-weight: 900;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-background) 55%, transparent);
	}

	/* The addressee, written out in the chosen desk's own light and left to dry. */
	.desk {
		margin-top: 1rem;
		font-family: var(--font-primary);
		font-size: clamp(1.75rem, 3.4vw, 2.75rem);
		line-height: 1.1;
		animation: write 1100ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes write {
		from {
			--reveal: 0;
		}
		to {
			--reveal: 60;
		}
	}

	.ink {
		--stroke: 9;
		--settle: 20;
		--wet: clamp(0, calc((var(--reveal) - var(--i)) / var(--stroke)), 1);
		--dry: clamp(0, calc((var(--reveal) - var(--i) - var(--stroke)) / var(--settle)), 1);

		opacity: var(--wet);
		color: color-mix(in oklab, var(--color-background) calc(var(--dry) * 100%), var(--glow));
	}

	.to {
		margin-top: 0.85rem;
		font-family: var(--font-secondary);
		font-size: 0.8125rem;
		letter-spacing: 0.16em;
		color: color-mix(in oklab, var(--color-background) 52%, transparent);
		animation: fade 900ms ease-out both 260ms;
	}

	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* The plates stack so one can fade over the other; the frame holds its own
	   height either way, so nothing below it moves during a change of address. */
	.plate {
		position: relative;
		margin: 2.5rem 0 0;
		overflow: hidden;
		aspect-ratio: 4 / 5;
		background-color: color-mix(in oklab, var(--color-background) 6%, transparent);
	}

	.plate img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Lit from the same source as the rest of the room. */
	.plate::after {
		content: '';
		position: absolute;
		inset: 0;
		box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--glow) 30%, transparent);
		background: linear-gradient(
			to top,
			color-mix(in oklab, var(--room) 55%, transparent),
			transparent 55%
		);
		transition: box-shadow 900ms ease-out;
	}

	.reasons {
		border: 0;
		padding: 0;
		margin: 0;
	}

	.reason {
		display: grid;
		grid-template-columns: auto 1fr;
		align-items: baseline;
		column-gap: 1rem;
		/* Comfortably past the 44px target even at the smallest step. */
		padding: 0.7rem 0;
		border-bottom: 1px solid color-mix(in oklab, var(--color-background) 12%, transparent);
	}

	.reason input {
		position: absolute;
		width: 1px;
		height: 1px;
		opacity: 0;
		pointer-events: none;
	}

	.pip {
		width: 0.4rem;
		height: 0.4rem;
		transform: rotate(45deg) scale(0.6);
		background-color: color-mix(in oklab, var(--color-background) 30%, transparent);
		transition:
			background-color 320ms ease-out,
			transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.reason.picked .pip {
		background-color: var(--glow);
		transform: rotate(45deg) scale(1);
	}

	.name {
		font-family: var(--font-primary);
		font-size: clamp(1.15rem, 2vw, 1.45rem);
		color: color-mix(in oklab, var(--color-background) 62%, transparent);
		transition: color 320ms ease-out;
	}

	.reason.picked .name {
		color: var(--color-background);
	}

	.hint {
		grid-column: 2;
		margin-top: 0.2rem;
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.1em;
		color: color-mix(in oklab, var(--color-background) 38%, transparent);
	}

	.reason:hover .name,
	.reason:focus-within .name {
		color: var(--color-background);
	}

	.reason:focus-within {
		outline: 1px solid color-mix(in oklab, var(--color-background) 55%, transparent);
		outline-offset: 0.5rem;
	}

	.send {
		background: none;
		border: 0;
		padding: 0.75rem 0;
		font-family: var(--font-secondary);
		font-size: 0.8125rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--color-background);
	}

	.send:disabled {
		color: color-mix(in oklab, var(--color-background) 50%, transparent);
		cursor: progress;
	}

	.aside {
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		color: color-mix(in oklab, var(--color-background) 42%, transparent);
	}

	.mono {
		color: color-mix(in oklab, var(--color-background) 70%, transparent);
	}

	.error {
		margin-top: 0.75rem;
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
		color: var(--color-accent-xl);
	}

	.trap {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	/* Each line of the letter is handed in after the one above it. */
	.row {
		opacity: 0;
		transform: translateY(0.6rem);
		transition:
			opacity 420ms ease-out,
			transform 620ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	.in .row {
		opacity: 1;
		transform: none;
		transition-delay: calc(var(--i) * 90ms);
	}

	.confirmation .statement {
		margin-top: 1.25rem;
		max-width: 22ch;
		font-family: var(--font-primary);
		font-size: clamp(2rem, 5.5vw, 4rem);
		line-height: 1.05;
		text-wrap: balance;
	}

	.confirmation .lead {
		margin-top: 1.5rem;
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-background) 55%, transparent);
	}

	.again {
		display: inline-block;
		margin-top: 3rem;
		background: none;
		border: 0;
		padding: 0.5rem 0;
		font-family: var(--font-secondary);
		font-size: 0.8125rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
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
		bottom: 0.15em;
		height: max(1px, 0.045em);
	}

	.rule::before {
		background-color: currentColor;
		opacity: 0.25;
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

	.rule:focus-visible {
		outline: none;
	}

	/* A drawn underline is enough for a link, but not for the controls that send
	   and reset the letter — those take the ring the nav's own button uses. */
	.send:focus-visible,
	.again:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 0.5rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.desk,
		.to {
			animation-duration: 1ms;
		}

		.ink {
			opacity: 1;
			color: var(--color-background);
		}

		.row {
			opacity: 1;
			transform: none;
		}

		.letter,
		.ground,
		.meniscus,
		.pip,
		.name,
		.rule::after {
			transition-duration: 1ms;
		}
	}
</style>
