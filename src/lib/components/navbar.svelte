<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { frame } from '$lib/frame.svelte';
	import { curtain } from '$lib/curtain.svelte';

	const links = [
		{ label: 'Fragrances', href: '/fragrances' },
		{ label: 'Our House', href: '/our-house' },
		{ label: 'Journal', href: '/journal' },
		{ label: 'Contact', href: '/contact' }
	];

	const elsewhere = [
		{ label: 'Instagram', href: 'https://instagram.com/aethera_fragrance' },
		{ label: 'Email', href: 'mailto:info@aetherafragrance.com' }
	];

	/** How long the curtain takes to cross the screen. Kept in step with --curtain below. */
	const CURTAIN = 760;
	/** How long the ink keeps watching after a scroll stops, in ms. Long enough to
	 *  outlast the easing the sections carry on with once the wheel is still. */
	const SETTLE = 900;
	/** Clearance the bar keeps from the film's rounded corner while it is tucked
	 *  inside the frame, in px. Enough that neither end sits on the curve. */
	const TUCK_X = 18;
	const TUCK_Y = 10;

	let open = $state(false);
	/** Tone of the section currently under the bar, so the ink stays legible over both. */
	let tone = $state<'dark' | 'light'>('dark');
	/** Width the scrollbar leaves behind while the page is locked, so nothing jumps. */
	let gutter = $state(0);

	let toggle: HTMLButtonElement;
	let panel: HTMLElement;
	let mark: HTMLElement;
	let resample = 0;

	/** 1 while the bar is still tucked inside the film's frame, 0 once the frame
	 *  has let go and the bar has the page's own corners to itself. */
	const tucked = $derived(frame.active ? 1 - frame.progress : 0);
	const inset = $derived(frame.active ? frame.inset : 0);
	const tuck = $derived(
		`--tuck-x: ${inset + TUCK_X * tucked}px; --tuck-y: ${inset + TUCK_Y * tucked}px; --rest: ${tucked};`
	);

	/** The topmost thing painted under the bar decides the ink. A clipped curtain is
	 *  not hit until it has actually risen past this line, which is exactly right. */
	function sample() {
		// The veil is the only thing under the bar while it is up, and it is dark.
		if (curtain.covering) {
			tone = 'dark';
			return;
		}
		if (open || !mark) return;
		const line = mark.getBoundingClientRect();
		const hit = document
			.elementsFromPoint(window.innerWidth / 2, Math.max(1, line.top + line.height / 2))
			.find((el): el is HTMLElement => el instanceof HTMLElement && !!el.dataset.nav);
		if (hit) tone = hit.dataset.nav === 'light' ? 'light' : 'dark';
	}

	function setOpen(next: boolean) {
		if (next === open) return;
		open = next;
		curtain.menuOpen = next;
		clearTimeout(resample);

		if (next) {
			gutter = window.innerWidth - document.documentElement.clientWidth;
			document.body.style.paddingRight = `${gutter}px`;
			document.body.style.overflow = 'hidden';
			tone = 'dark'; // the panel is the ground now
			tick().then(() => panel.querySelector('a')?.focus());
		} else {
			document.body.style.paddingRight = '';
			document.body.style.overflow = '';
			gutter = 0;
			// The curtain retreats upward, so the bar is covered until the last moment.
			resample = window.setTimeout(sample, CURTAIN);
		}
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;

		if (e.key === 'Escape') {
			setOpen(false);
			toggle.focus();
			return;
		}

		if (e.key !== 'Tab') return;

		// The toggle sits outside the panel but is its close button, so it belongs in the loop.
		const items = [toggle, ...panel.querySelectorAll<HTMLElement>('a[href]')];
		const here = items.indexOf(document.activeElement as HTMLElement);
		if (here === -1) return;

		const next = here + (e.shiftKey ? -1 : 1);
		if (next < 0 || next >= items.length) {
			e.preventDefault();
			items[e.shiftKey ? items.length - 1 : 0].focus();
		}
	}

	// The panel is the page transition while it is up, so it lifts on arrival
	// rather than on the click that started the journey.
	afterNavigate(() => setOpen(false));

	// The veil covers and uncovers without any scrolling, so the ink has to be
	// told to look again — nothing else would prompt it.
	$effect(() => {
		if (curtain.covering) tone = 'dark';
		else sample();
	});

	onMount(() => {
		let watch = 0;
		let until = 0;

		// Sections keep easing for a moment after the scroll that started them, so
		// the ink has to keep looking. Stopping at the scroll event itself leaves it
		// stale whenever a curtain finishes crossing the bar after the wheel does.
		function keepLooking() {
			sample();
			watch = performance.now() < until ? requestAnimationFrame(keepLooking) : 0;
		}

		function onScroll() {
			until = performance.now() + SETTLE;
			if (!watch) watch = requestAnimationFrame(keepLooking);
		}

		sample();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			if (watch) cancelAnimationFrame(watch);
			clearTimeout(resample);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	});
</script>

<svelte:window onkeydown={onKeydown} />

<!-- Transparent to clicks except for its two controls, so it never steals the page. -->
<header
	id="top"
	class="bar pointer-events-none fixed inset-x-0 top-0 z-50"
	data-tone={tone}
	style="{tuck} margin-right: {gutter}px;"
>
	<div class="inner">
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a bind:this={mark} href="/" class="mark pointer-events-auto">ÆTHERA</a>

		<button
			bind:this={toggle}
			type="button"
			class="toggle pointer-events-auto"
			class:open
			aria-expanded={open}
			aria-controls="site-menu"
			aria-label={open ? 'Close menu' : 'Open menu'}
			onclick={() => setOpen(!open)}
		>
			<span class="label hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
			<span class="icon" aria-hidden="true"><span></span><span></span></span>
		</button>
	</div>
</header>

<!-- The leading edge of the curtain, same gesture as the collection's meniscus. -->
<div class="meniscus" class:open aria-hidden="true"></div>

<div
	bind:this={panel}
	id="site-menu"
	class="panel"
	class:open
	data-nav="dark"
	style={tuck}
	inert={!open}
>
	<div class="vignette" aria-hidden="true"></div>

	<nav class="sheet relative flex h-full flex-col justify-center" aria-label="Main">
		<ul class="flex flex-col items-start gap-3 md:gap-5">
			{#each links as link, i (link.href)}
				<li class="row flex items-baseline gap-4 md:gap-7" style="--i: {i};">
					<span class="ordinal" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
					<!-- Deliberately not closed on click. The panel is already covering
					     the screen, so it stays put and hides the page change behind
					     it, then lifts once the new page has landed. -->
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={link.href} class="rule link">{link.label}</a>
				</li>
			{/each}
		</ul>

		<ul class="aside absolute bottom-8 flex gap-8">
			{#each elsewhere as link, i (link.href)}
				<li class="row" style="--i: {links.length + i};">
					<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
					<a href={link.href}
						class="rule"
						target={link.href.startsWith('http') ? '_blank' : undefined}
						rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
						onclick={() => setOpen(false)}>{link.label}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</div>

<style>
	/* Kept in step with CURTAIN in the script. */
	.panel,
	.meniscus {
		--curtain: 760ms;
		--ease: cubic-bezier(0.22, 1, 0.36, 1);
	}

	.bar {
		color: var(--color-background);
		filter: drop-shadow(0 2px 14px rgb(0 0 0 / 0.5));
		transition:
			color 520ms ease-out,
			filter 520ms ease-out;
	}

	/* Over the cream sections the same ink would disappear. */
	.bar[data-tone='light'] {
		color: var(--color-neutral);
		filter: none;
	}

	/* Held inside the film's frame until it unwraps, then handed the page's corners.
	   The panel shares the margin, so the menu lines up under the mark that opened it. */
	.bar,
	.panel {
		--pad-x: calc(1.5rem + var(--tuck-x, 0px));
	}

	@media (min-width: 768px) {
		.bar,
		.panel {
			--pad-x: calc(2.5rem + var(--tuck-x, 0px));
		}
	}

	.inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: calc(1.25rem + var(--tuck-y, 0px)) var(--pad-x) 1.25rem;
	}

	@media (min-width: 768px) {
		.inner {
			padding-top: calc(1.5rem + var(--tuck-y, 0px));
			padding-bottom: 1.5rem;
		}
	}

	.sheet {
		padding: 7rem var(--pad-x) 6rem;
	}

	/* On the film it is a title card; off it, a navigation mark. */
	.mark {
		font-family: var(--font-primary);
		font-size: calc(clamp(1.05rem, 1.5vw, 1.35rem) * (1 + 0.16 * var(--rest, 0)));
		line-height: 1;
		letter-spacing: calc(0.22em + 0.2em * var(--rest, 0));
		text-decoration: none;
		color: inherit;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		background: none;
		border: 0;
		padding: 0.25rem 0;
		color: inherit;
	}

	.label {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
	}

	/* The rules run long on the film and draw in with the wordmark. */
	.icon {
		position: relative;
		display: block;
		width: calc(1.75rem + 0.5rem * var(--rest, 0));
		height: 12px;
	}

	.icon span {
		position: absolute;
		inset-inline: 0;
		height: 1px;
		background-color: currentColor;
		transition: transform 480ms var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.icon span:first-child {
		top: 0;
	}

	.icon span:last-child {
		bottom: 0;
	}

	.toggle.open .icon span:first-child {
		transform: translateY(5.5px) rotate(45deg);
	}

	.toggle.open .icon span:last-child {
		transform: translateY(-5.5px) rotate(-45deg);
	}

	.toggle:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 0.5rem;
	}

	/* The curtain falls from the top and retreats back into it. */
	.panel {
		position: fixed;
		inset: 0;
		z-index: 40;
		visibility: hidden;
		background-color: var(--color-neutral);
		color: var(--color-background);
		clip-path: inset(0 0 100% 0);
		transition:
			clip-path var(--curtain) var(--ease),
			visibility 0s linear var(--curtain);
	}

	.panel.open {
		visibility: visible;
		clip-path: inset(0 0 0 0);
		transition:
			clip-path var(--curtain) var(--ease),
			visibility 0s;
	}

	.vignette {
		position: absolute;
		inset: 0;
		background: radial-gradient(
			120% 82% at 50% 44%,
			transparent 34%,
			color-mix(in oklab, black 55%, transparent) 100%
		);
	}

	.meniscus {
		position: fixed;
		inset-inline: 0;
		top: 0;
		z-index: 41;
		height: 1px;
		visibility: hidden;
		background-color: var(--color-accent);
		box-shadow:
			0 0 12px 1px color-mix(in oklab, var(--color-accent) 55%, transparent),
			0 0 44px 6px color-mix(in oklab, var(--color-accent) 22%, transparent);
		transform: translateY(0);
		opacity: 1;
		transition:
			transform var(--curtain) var(--ease),
			opacity 200ms linear,
			visibility 0s linear var(--curtain);
	}

	.meniscus.open {
		visibility: visible;
		transform: translateY(100vh);
		opacity: 0;
		transition:
			transform var(--curtain) var(--ease),
			opacity 200ms linear calc(var(--curtain) - 200ms),
			visibility 0s;
	}

	/* Each row is handed in after the curtain, one behind the next. */
	.row {
		opacity: 0;
		transform: translateY(0.35em);
		transition:
			opacity 320ms ease-out,
			transform 520ms var(--ease, cubic-bezier(0.22, 1, 0.36, 1));
	}

	.panel.open .row {
		opacity: 1;
		transform: none;
		transition-delay: calc(240ms + var(--i) * 70ms);
	}

	.ordinal {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		letter-spacing: 0.28em;
		color: var(--color-accent);
	}

	.link {
		font-family: var(--font-primary);
		font-size: clamp(2rem, 6.5vw, 5rem);
		line-height: 1.05;
	}

	.aside {
		inset-inline: var(--pad-x);
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-background) 70%, transparent);
	}

	/* The drawn underline, same gesture as the footer's links. */
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
		bottom: -0.06em;
		height: max(1px, 0.045em);
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

	/* The drawn stroke is the focus indicator, so it needs room to be seen. */
	.rule:focus-visible {
		outline: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.panel,
		.meniscus {
			--curtain: 1ms;
		}

		.bar,
		.row,
		.icon span,
		.rule::after {
			transition-duration: 1ms;
		}

		.panel.open .row {
			transition-delay: 0ms;
		}
	}
</style>
