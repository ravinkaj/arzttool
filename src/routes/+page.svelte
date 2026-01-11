<script>
	import { onMount } from 'svelte';
	import { session } from '$lib/auth/auth.js';
	import PraxisCard from '$lib/components/PraxisCard.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import WartezeitBadge from '$lib/components/WartezeitBadge.svelte';

	let praxen = [];
	let fach = '';
	let city = '';
	let sort = '';
	let searchQuery = '';
	let loading = true;
	let message = '';

	// Favorites stored as array of ids in localStorage
	const LS_KEY = 'favoritenPraxis';
	let favorites = [];
	let showOnlyFavorites = false;

	function getPraxisId(p) {
		return p?._id || p?.id; // ✅ supports both Mongo-style _id and plain id
	}

	function loadFavorites() {
		try {
			const raw = localStorage.getItem(LS_KEY);
			favorites = raw ? JSON.parse(raw) : [];
		} catch (e) {
			favorites = [];
		}
	}

	function persistFavorites() {
		try {
			localStorage.setItem(LS_KEY, JSON.stringify(favorites));
		} catch (e) {}
	}

	function toggleFavorite(id) {
		if (!id) return;

		if (favorites.includes(id)) {
			favorites = favorites.filter((x) => x !== id);
		} else {
			favorites = [...favorites, id];
		}
		persistFavorites();
	}

	$: favoritesSet = new Set(favorites);

	// Load praxen from API with basic error handling
	async function load() {
		loading = true;
		message = '';

		try {
			const params = new URLSearchParams();
			if (fach) params.set('fach', fach);
			if (city) params.set('city', city);
			if (sort) params.set('sort', sort);

			const res = await fetch('/api/praxen?' + params.toString());
			if (!res.ok) throw new Error('Fehler beim Laden');

			praxen = await res.json();
		} catch (err) {
			console.error(err);
			message = 'Fehler beim Laden der Praxen. Bitte Seite neu laden.';
			praxen = [];
		}

		loading = false;
	}

	// Derived lists
	$: filteredPraxen = praxen.filter((p) => {
		const id = getPraxisId(p);
		// Apply favorites filter
		if (showOnlyFavorites && !favoritesSet.has(id)) return false;
		
		// Apply search filter
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			const matchesName = (p.name || '').toLowerCase().includes(query);
			const matchesFach = (p.fach || '').toLowerCase().includes(query);
			const matchesCity = (p.city || '').toLowerCase().includes(query);
			if (!matchesName && !matchesFach && !matchesCity) return false;
		}
		
		return true;
	});

	$: fastest =
		filteredPraxen && filteredPraxen.length
			? filteredPraxen.reduce((best, p) => {
					if (p?.waitMinutes == null) return best;
					if (!best) return p;
					return p.waitMinutes < best.waitMinutes ? p : best;
			  }, null)
			: null;

	onMount(() => {
		loadFavorites();
		load();
	});
</script>

<main class="page-root">
	<div class="container">
		<div class="page-header">
			<h1>Praxisübersicht</h1>
			<p class="subtitle">Finde passende Praxen — schnell, übersichtlich und transparent.</p>
		</div>

		{#if !$session}
			<div class="cta-banner">
				<p class="cta-text">
					Jetzt <a href="/login" class="cta-link">anmelden</a> oder <a href="/login" class="cta-link">registrieren</a>, um alle Funktionen zu nutzen.
				</p>
			</div>
		{/if}

		<div class="filter-section">
			<div class="filter-row-top">
				<div class="filter-controls-wrapper">
					<FilterBar
						on:change={(e) => {
							fach = e.detail.fach;
							city = e.detail.city;
							sort = e.detail.sort;
							load();
						}}
						{praxen}
					/>
				</div>
			</div>
			<div class="filter-row-middle">
				<div class="search-wrapper-prominent">
					<span class="search-icon">🔍</span>
					<input 
						class="search-input-prominent" 
						type="text" 
						bind:value={searchQuery} 
						placeholder="Praxis, Fachbereich oder Stadt suchen..."
					/>
					{#if searchQuery}
						<button class="clear-btn" on:click={() => searchQuery = ''}>✕</button>
					{/if}
				</div>
			</div>
			<div class="filter-row-bottom">
				<label class="fav-label">
					<input type="checkbox" bind:checked={showOnlyFavorites} />
					Nur meine Praxen anzeigen
				</label>
				{#if !loading}
					<p class="result-count">{filteredPraxen.length} Praxen gefunden</p>
				{/if}
			</div>
		</div>

		{#if city}
			<section class="highlight card">
				<h2 class="section-title">Schnellster Termin heute</h2>

				{#if loading}
					<p class="muted">Analysiere Wartezeiten…</p>
				{:else if fastest}
					<div class="fast-card">
						<h3 class="fast-title">
							<a href={'/praxis/' + getPraxisId(fastest)}>{fastest.name}</a>
						</h3>
						<p class="muted">{fastest.fach} — {fastest.city}</p>

						<div class="badge-row">
							<WartezeitBadge minutes={fastest.waitMinutes ?? 0} />
						</div>

						<p class="explain">
							Diese Praxis hat aktuell die kürzeste geschätzte Wartezeit und ist deshalb empfohlen.
						</p>
					</div>
				{:else}
					<p class="muted">Keine Wartezeitdaten verfügbar.</p>
				{/if}
			</section>
		{/if}

		<section class="list card">
			<h2 class="section-title">{showOnlyFavorites ? 'Meine Praxen' : 'Praxen'}</h2>

			{#if message}
				<div class="error">{message}</div>
			{:else if loading}
				<p class="muted">Lade Praxen…</p>
			{:else if filteredPraxen && filteredPraxen.length}
				<div class="cards">
					{#each filteredPraxen as praxis}
						<PraxisCard
							{praxis}
							isFavorite={favoritesSet.has(getPraxisId(praxis))}
							on:toggle={(e) => toggleFavorite(e.detail.id)}
						/>
					{/each}
				</div>
			{:else}
				<p class="muted">
					Keine Praxen gefunden. Probiere andere Filter oder entferne die Favoriten-Filter.
				</p>
			{/if}
		</section>
	</div>
</main>

<style>
	/* Page */
	.page-root {
		background: var(--bg);
		min-height: 100%;
	}

	/* Centering */
	.container {
		max-width: 1100px;
		margin: 0 auto;
	}

	/* CTA Banner */
	.cta-banner {
		margin: 1.5rem 0;
		padding: 1.25rem 1.5rem;
		background: linear-gradient(135deg, rgba(31, 58, 95, 0.08) 0%, rgba(31, 58, 95, 0.04) 100%);
		border: 1px solid rgba(31, 58, 95, 0.15);
		border-radius: 12px;
		text-align: center;
		box-shadow: 0 2px 8px rgba(31, 58, 95, 0.06);
	}

	.cta-text {
		margin: 0;
		font-size: 1rem;
		color: var(--text);
		font-weight: 500;
	}

	.cta-link {
		color: var(--primary);
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
		border-bottom: 2px solid transparent;
	}

	.cta-link:hover {
		color: var(--primary-dark, #193652);
		border-bottom-color: var(--primary);
	}

	/* Filter Section */
	.filter-section{
		margin:1.5rem 0 2rem;
		padding:1.5rem;
		background:var(--secondary);
		border:1px solid var(--border);
		border-radius:12px;
	}
	
	/* New Layout Structure */
	.filter-row-top {
		margin-bottom: 1.5rem;
	}
	
	.filter-controls-wrapper {
		width: 100%;
	}
	
	.filter-row-middle {
		margin-bottom: 1.25rem;
	}
	
	.search-wrapper-prominent {
		position: relative;
		width: 100%;
	}
	
	.search-icon {
		position: absolute;
		left: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		font-size: 1rem;
		color: var(--text-secondary);
		pointer-events: none;
		opacity: 0.6;
	}
	
	.search-input-prominent {
		width: 100%;
		padding: 0.6rem 2.5rem 0.6rem 2.5rem;
		border: 1px solid rgba(16,24,40,0.15);
		border-radius: 8px;
		font-size: 0.95rem;
		background-color: #fff;
		transition: all 0.2s ease;
		box-sizing: border-box;
	}
	
	.search-input-prominent:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 3px rgba(31, 58, 95, 0.1);
	}
	
	.search-input-prominent::placeholder {
		color: var(--text-secondary);
	}
	
	.clear-btn {
		position: absolute;
		right: 0.85rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--text-secondary);
		font-size: 1rem;
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
		transition: all 0.2s ease;
		border-radius: 4px;
	}
	
	.clear-btn:hover {
		color: var(--primary);
		background: rgba(31, 58, 95, 0.05);
	}
	
	.filter-row-bottom {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 1.25rem;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
		gap: 1rem;
	}

	/* Reusable */
	.card {
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: var(--shadow);
	}

	.section-title {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text);
	}

	/* Filter result */
	.fav-label {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		font-size: 0.9375rem;
		color: var(--text-primary);
		cursor: pointer;
		font-weight: 500;
		transition: color 0.2s ease;
		padding: 0.5rem 0.75rem;
		border-radius: var(--border-radius);
		background-color: white;
		border: 1px solid var(--border-color);
	}
	
	.fav-label:hover {
		color: var(--primary);
		border-color: var(--primary);
		background-color: rgba(31, 58, 95, 0.02);
	}

	.fav-label input[type="checkbox"] {
		width: 1.125rem;
		height: 1.125rem;
		cursor: pointer;
		accent-color: var(--primary);
	}

	.result-count {
		margin: 0;
		color: var(--text-light);
		font-size: 0.95rem;
		font-weight: 500;
	}

	/* Highlight */
	.highlight {
		margin-bottom: 1.5rem;
		background: linear-gradient(180deg, var(--card), var(--secondary));
	}

	.fast-card {
		display: grid;
		gap: 0.75rem;
	}

	.fast-title {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.fast-title a {
		text-decoration: none;
		color: var(--primary);
	}

	.fast-title a:hover {
		text-decoration: underline;
	}

	.badge-row {
		margin-top: 0.5rem;
	}

	.explain {
		margin: 0.5rem 0 0 0;
		color: var(--text-light);
	}

	/* List */
	.list {
		margin-bottom: 2rem;
	}

	.cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}

	/* Error */
	.error {
		color: var(--danger);
		background: var(--danger-light);
		padding: 1rem;
		border-radius: 8px;
		border: 1px solid rgba(231,76,60,0.25);
	}

	@media (max-width: 768px) {
		.filter-section {
			padding: 1rem;
		}
		
		.filter-row-top {
			margin-bottom: 1rem;
		}
		
		.filter-row-middle {
			margin-bottom: 1rem;
		}
		
		.search-input-prominent {
			font-size: 0.9375rem;
			padding: 0.6rem 2.5rem 0.6rem 2.5rem;
		}
		
		.filter-row-bottom {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		
		.fav-label {
			justify-content: flex-start;
		}
		
		.result-count {
			text-align: left;
		}
	}
</style>
