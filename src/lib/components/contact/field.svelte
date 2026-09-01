<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	/** One line of the letter. The house doesn't draw boxes around things, so a
	 *  field here is a ruled line and the label that names it — the same drawn
	 *  stroke the nav and footer links use, moved from hover to focus. */
	let {
		name,
		label,
		type = 'text',
		value = '',
		error = '',
		hint = '',
		required = false,
		autocomplete,
		rows = 5
	}: {
		name: string;
		label: string;
		type?: 'text' | 'email' | 'textarea';
		value?: string;
		error?: string;
		hint?: string;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		rows?: number;
	} = $props();

	const describedBy = $derived(
		[hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(' ') ||
			undefined
	);
</script>

<div class="field" class:invalid={!!error}>
	<label for={name}>
		{label}{#if !required}<span class="optional">&nbsp;— optional</span>{/if}
	</label>

	{#if type === 'textarea'}
		<textarea
			id={name}
			{name}
			{rows}
			{required}
			defaultValue={value}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		></textarea>
	{:else}
		<input
			id={name}
			{name}
			{type}
			{required}
			{autocomplete}
			defaultValue={value}
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>
	{/if}

	{#if hint}
		<p id="{name}-hint" class="hint">{hint}</p>
	{/if}

	{#if error}
		<p id="{name}-error" class="error" role="alert">{error}</p>
	{/if}
</div>

<style>
	.field {
		display: grid;
		gap: 0.6rem;
	}

	label {
		font-family: var(--font-secondary);
		font-size: 0.6875rem;
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: color-mix(in oklab, var(--color-background) 62%, transparent);
	}

	.optional {
		letter-spacing: 0.18em;
		color: color-mix(in oklab, var(--color-background) 38%, transparent);
	}

	input,
	textarea {
		width: 100%;
		background: none;
		border: 0;
		border-bottom: 1px solid color-mix(in oklab, var(--color-background) 26%, transparent);
		border-radius: 0;
		padding: 0.35rem 0 0.7rem;
		font-family: var(--font-primary);
		font-size: clamp(1.15rem, 2vw, 1.5rem);
		line-height: 1.45;
		color: var(--color-background);
		transition: border-color 420ms ease-out;
	}

	textarea {
		resize: vertical;
		min-height: 7rem;
	}

	/* The drawn stroke is the focus indicator — it has to be unmistakable, so the
	   rule brightens to the room's own light rather than merely tinting. */
	input:focus,
	textarea:focus {
		outline: none;
		border-bottom-color: var(--glow, var(--color-accent));
	}

	.field.invalid input,
	.field.invalid textarea {
		border-bottom-color: var(--color-accent-xl);
	}

	/* Enough of an offset that the stroke reads as deliberate rather than as a
	   browser default, for anyone who can't see the colour change. */
	input:focus-visible,
	textarea:focus-visible {
		outline: 1px solid color-mix(in oklab, var(--color-background) 55%, transparent);
		outline-offset: 0.6rem;
	}

	.hint,
	.error {
		font-family: var(--font-secondary);
		font-size: 0.75rem;
		letter-spacing: 0.12em;
	}

	.hint {
		color: color-mix(in oklab, var(--color-background) 45%, transparent);
	}

	/* The house accent is too dark to read against the writing room, so errors
	   take the lightest step of it. */
	.error {
		color: var(--color-accent-xl);
	}

	@media (prefers-reduced-motion: reduce) {
		input,
		textarea {
			transition-duration: 1ms;
		}
	}
</style>
