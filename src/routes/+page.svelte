<script>
	import { onMount } from 'svelte';
	import PraxisCard from '$lib/components/PraxisCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';

	let praxen = [];
	let fach = '';
	let city = '';
	let sort = '';
	let loading = true;
	let message = '';
	import Map from '$lib/components/Map.svelte';

	async function load() {
		loading = true;
		const params = new URLSearchParams();
		if (fach) params.set('fach', fach);
		if (city) params.set('city', city);
		if (sort) params.set('sort', sort);
		const res = await fetch('/api/praxen?' + params.toString());
		praxen = await res.json();
		loading = false;
	}

	// compute coords for map (include fach, city and waitMinutes for popup preview)
	$: mapCoords = praxen.map(p => ({
		lat: p.coords?.lat || (p.coords && p.coords.lat) || 47.3769,
		lng: p.coords?.lng || (p.coords && p.coords.lng) || 8.5417,
		label: p.name,
		id: p._id || p._id,
		fach: p.fach,
		city: p.city,
		waitMinutes: p.waitMinutes
	}));

	function onFilter({ detail }) {
		fach = detail.fach;
		city = detail.city;
		sort = detail.sort;
		load();
	}

	onMount(load);
</script>

	<main>
	<h1>Praxisübersicht</h1>
		<FilterBar on:change={onFilter} {praxen} />
		<div class="layout">
			<section class="mapcol">
				<Map coords={mapCoords} />
			</section>
			<section class="listcol">
				{#if loading}
					<p>Lade Praxen…</p>
				{:else}
					{#if praxen && praxen.length}
						<div class="cards">
							{#each praxen as praxis}
								<PraxisCard {praxis} />
							{/each}
						</div>
					{:else}
						<p>Keine Praxen gefunden.</p>
					{/if}
				{/if}
			</section>
		</div>
</main>

<style>
	.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 1rem; }
	.layout { display:grid; grid-template-columns: 1fr 420px; gap:1rem }
	.mapcol{min-height:320px}
	@media(max-width:900px){ .layout{grid-template-columns:1fr; } .listcol{order:2} .mapcol{order:1} }
</style>
