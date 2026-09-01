<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Navbar from '$lib/components/navbar.svelte';
	import { onNavigate, afterNavigate } from '$app/navigation';
	import { curtain } from '$lib/curtain.svelte';

	let { children } = $props();

	/** Kept in step with --veil below. */
	const COVER = 420;

	let phase = $state<'idle' | 'in' | 'out'>('idle');

	onNavigate((navigation) => {
		// A hash on the current page is not a page change — "Back to top" should
		// not pull a curtain over the whole site.
		if (navigation.to?.url.pathname === navigation.from?.url.pathname) return;

		// The menu is already covering the screen; it will see this one through.
		if (curtain.menuOpen) return;

		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		phase = 'in';
		curtain.covering = true;
		return new Promise<void>((resolve) => setTimeout(resolve, COVER));
	});

	afterNavigate(() => {
		// Also fires once on first load, when there is nothing to uncover.
		if (phase !== 'in') return;
		phase = 'out';
		setTimeout(() => {
			phase = 'idle';
			curtain.covering = false;
		}, COVER);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<!-- Falls from the top to cover the change, then keeps going rather than
     retreating — so a page change reads as one stroke, not two. -->
<div class="veil" class:in={phase === 'in'} class:out={phase === 'out'} data-nav="dark">
	<div class="edge"></div>
</div>

<Navbar />
{@render children()}

<style>
	.veil {
		--veil: 420ms;
		--ease: cubic-bezier(0.22, 1, 0.36, 1);

		position: fixed;
		inset: 0;
		z-index: 30;
		pointer-events: none;
		background-color: var(--color-neutral);
		/* Parked above the screen, and snaps back there without animating. */
		clip-path: inset(0 0 100% 0);
	}

	.veil.in {
		pointer-events: auto;
		clip-path: inset(0 0 0 0);
		transition: clip-path var(--veil) var(--ease);
	}

	.veil.out {
		clip-path: inset(100% 0 0 0);
		transition: clip-path var(--veil) var(--ease);
	}

	/* The lit leading edge, same as the one the menu arrives on. */
	.edge {
		position: absolute;
		inset-inline: 0;
		top: 0;
		height: 1px;
		opacity: 0;
		background-color: var(--color-accent);
		box-shadow:
			0 0 12px 1px color-mix(in oklab, var(--color-accent) 55%, transparent),
			0 0 44px 6px color-mix(in oklab, var(--color-accent) 22%, transparent);
	}

	/* Two names for one gesture, so the sweep restarts on the way back out. */
	.veil.in .edge {
		animation: sweep-in var(--veil) var(--ease) both;
	}

	.veil.out .edge {
		animation: sweep-out var(--veil) var(--ease) both;
	}

	@keyframes sweep-in {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 1;
			transform: translateY(100vh);
		}
	}

	@keyframes sweep-out {
		from {
			opacity: 1;
			transform: translateY(0);
		}
		to {
			opacity: 1;
			transform: translateY(100vh);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.veil.in,
		.veil.out {
			transition-duration: 1ms;
		}

		.edge {
			display: none;
		}
	}
</style>
