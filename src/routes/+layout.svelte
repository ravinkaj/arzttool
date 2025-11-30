<script>
	import favicon from '$lib/assets/favicon.svg';
	import Nav from '$lib/components/Nav.svelte';
	import '$lib/styles/global.css';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Leaflet (CDN) for simple maps in prototype -->
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-sA+e2kRkG7kq9+JvT3q6bKQ9Q5b1wVQYg2XvC6p0h54=" crossorigin="" />
	<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" defer integrity="sha256-QV7qP0qgqM9kq1xQ7GkOe0Q5c1V9j5h6b2k1s9h0j3A=" crossorigin=""></script>
</svelte:head>

<div class="app-shell">
	<Nav />
	<main class="container">
		{@render children()}
	</main>
</div>

<style>
	.app-shell { display:flex; flex-direction:column; min-height:100vh }
	.container { padding:1rem; max-width:1100px; margin:0 auto; width:100% }
</style>
