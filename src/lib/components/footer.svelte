<script lang="ts">
	import abstractImg from '$lib/assets/abstract-image.png';

	const nav = [
		{ label: 'Fragrances', href: '/fragrances' },
		{ label: 'Our House', href: '/our-house' },
		{ label: 'Journal', href: '/journal' },
		{ label: 'Contact', href: '/contact' }
	];

	const elsewhere = [
		{ label: 'Instagram', href: 'https://instagram.com/aethera_fragrance' },
		{ label: 'Email', href: 'mailto:info@aetherafragrance.com' }
	];

	const wordmark = [...'ÆTHERA'];
	const year = new Date().getFullYear();
</script>

<footer data-nav="dark" class="relative overflow-hidden bg-neutral text-background">
	<div class="pointer-events-none absolute inset-0" aria-hidden="true">
		<img src={abstractImg} alt="" class="h-full w-full object-cover opacity-20 mix-blend-screen" />
		<div class="absolute inset-0 bg-black/80"></div>
	</div>

	<div class="relative mx-auto w-full  px-6 pt-24 pb-10 md:px-16 md:pt-32 lg:px-24">
		<div class="flex flex-col gap-14 sm:flex-row sm:items-start sm:justify-between">

			<nav aria-label="Footer">
				<ul class="flex flex-col items-start gap-3 md:gap-4">
					{#each nav as link (link.href)}
						<li>
							<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
							<a href={link.href} class="rule font-primary leading-[1.05] text-[clamp(2.25rem,7vw,5.5rem)]"
								>{link.label}</a
							>
						</li>
					{/each}
				</ul>
			</nav>

			<ul class="flex flex-row gap-8 font-secondary text-xs tracking-[0.22em] uppercase sm:flex-col sm:gap-3 sm:text-sm sm:text-right">
				{#each elsewhere as link (link.href)}
					<li>
						<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
						<a href={link.href} class="rule"
							target={link.href.startsWith('http') ? '_blank' : undefined}
							rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
							>{link.label}</a
						>
					</li>
				{/each}
			</ul>
		</div>

		<div
			class="flex flex-col items-start gap-4 border-t border-background/15 pt-6 font-secondary text-xs tracking-[0.22em] uppercase sm:flex-row sm:items-center sm:justify-between mt-16 md:mt-20"
		>
			<p class="text-background/55">© {year} ÆTHERA</p>
			<a href="#top" class="rule text-background/70">Back to top</a>
		</div>
	</div>

	<div class="relative mx-auto w-full px-6 md:px-16 lg:px-24" aria-hidden="true">
		<div class="h-[1em] overflow-hidden text-[clamp(3rem,15vw,18rem)]">
			<span
				class="flex select-none justify-between font-primary text-[1em] leading-none text-background/16"
			>
				{#each wordmark as letter, i (i)}<span>{letter}</span>{/each}
			</span>
		</div>
	</div>
</footer>

<style>
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
		.rule::after {
			transition-duration: 1ms;
		}
	}
</style>
