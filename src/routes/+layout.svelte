<script>
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import '$lib/styles/global.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	<Nav />
	<main class="container">
		{@render children()}
	</main>
</div>

<style>
	.app-shell{display:flex;flex-direction:column;min-height:100vh;background:var(--bg)}
	.container{padding:0;max-width:1400px;margin:0 auto;width:100%;background:transparent}
</style>
