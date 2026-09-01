<script lang="ts">
	import Head from '$lib/components/contact/head.svelte';
	import Letter from '$lib/components/contact/letter.svelte';
	import Atelier from '$lib/components/contact/atelier.svelte';
	import Footer from '$lib/components/footer.svelte';
	import type { ContactResult } from '$lib/contact-types';

	let { form }: { form: ContactResult | null } = $props();
</script>

<svelte:head>
	<title>Contact — ÆTHERA</title>
	<meta
		name="description"
		content="Write to ÆTHERA. Enquiries reach the house, the press office, wholesale, or the atelier directly."
	/>
</svelte:head>

<main class="w-full">
	<Head />
	<Letter {form} />
	<Atelier />
</main>

<Footer />
