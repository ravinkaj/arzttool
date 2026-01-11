<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import TerminCard from '$lib/components/TerminCard.svelte';
	import WartezeitBadge from '$lib/components/WartezeitBadge.svelte';
	import { validateAppointment } from '$lib/utils/validation.js';
	import { session } from '$lib/auth/auth.js';
	import { getSlotsForDate, formatDateLabel, getBookedSlotsForPraxis } from '$lib/utils/slots.js';
	import { addTermin } from '$lib/utils/termineStore.js';

	export let params;

	let praxis = null;
	let termine = [];
	let loading = true;

	let selectedDate = '';
	let selectedSlot = '';
	let note = '';
	let message = '';
	let error = '';
	let availableSlots = [];
	let bookedSlots = [];

	// Reviews
	let reviewSearchTerm = '';
	let reviewRatingFilter = 'all';
	let reviewSort = 'date_desc';
	let reviewRating = 5;
	let reviewText = '';
	let reviewAuthor = '';
	let reviewMessage = '';
	let reviewError = '';
	let reviewTab = 'top';

	let editMode = false;
	let editData = { openingHours: '', services: [], description: '', team: [] };

	$: isOwner = $session && $session.role === 'praxis' && praxis && (praxis.ownerId === $session.userId || String(praxis.ownerId).startsWith($session.userId));

	function getId(obj) {
		return obj?._id || obj?.id;
	}

	function slugifyName(name){
		return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
	}

	// Initialize date picker with today's date
	$: if (!selectedDate && typeof window !== 'undefined') {
		const today = new Date();
		selectedDate = today.toISOString().split('T')[0];
	}

	// Update available slots when date changes
	$: if (selectedDate && praxis) {
		const praxisId = getId(praxis) || params.id;
		bookedSlots = getBookedSlotsForPraxis(praxisId);
		availableSlots = getSlotsForDate(praxisId, selectedDate, bookedSlots);
	}

	// Get min and max dates for date picker
	$: minDate = new Date().toISOString().split('T')[0];
	$: maxDate = (() => {
		const d = new Date();
		d.setDate(d.getDate() + 14);
		return d.toISOString().split('T')[0];
	})();

	// Derive why patients choose this practice
	$: whyChoose = praxis ? getWhyPatientsChoose(praxis) : [];

	$: allReviews = Array.isArray(praxis?.reviews) ? [...praxis.reviews] : [];
	$: filteredReviews = (() => {
		let list = Array.isArray(allReviews) ? [...allReviews] : [];
		if (reviewRatingFilter !== 'all') {
			const min = Number(reviewRatingFilter);
			list = list.filter((r) => Number(r.rating || 0) >= min);
		}
		if (reviewSearchTerm) {
			const q = reviewSearchTerm.toLowerCase();
			list = list.filter((r) =>
				String(r.author || '').toLowerCase().includes(q) || String(r.text || '').toLowerCase().includes(q)
			);
		}
		if (reviewSort === 'date_desc') list.sort((a, b) => new Date(b.date) - new Date(a.date));
		if (reviewSort === 'date_asc') list.sort((a, b) => new Date(a.date) - new Date(b.date));
		if (reviewSort === 'rating_desc') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
		if (reviewSort === 'rating_asc') list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
		return list;
	})();

	$: displayedReviews = reviewTab === 'all' ? filteredReviews : filteredReviews.slice(0, 3);

	$: reviewAvg = praxis?.avgRating ?? (allReviews.length
		? Number((allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / allReviews.length).toFixed(1))
		: null);
	$: reviewCount = praxis?.reviewCount ?? allReviews.length;
	$: reviewAuthor = $session?.name && !reviewAuthor ? $session.name : reviewAuthor;
	
	function getWhyPatientsChoose(praxis) {
		const reasons = [];
		if (praxis.waitMinutes && praxis.waitMinutes < 20) {
			reasons.push('Kurze Wartezeiten');
		}
		if (praxis.city && ['Zürich', 'Bern', 'Basel', 'Luzern'].includes(praxis.city)) {
			reasons.push('Zentrale Lage / gute Erreichbarkeit');
		}
		if (praxis.avgRating && praxis.avgRating >= 4) {
			reasons.push('Hohe Patientenzufriedenheit');
		}
		if (praxis.services && praxis.services.length >= 3) {
			reasons.push('Breites Leistungsspektrum');
		}
		return reasons.slice(0, 4); // Max 4 reasons
	}

	function updateReviews(updatedReviews) {
		if (!praxis) return;
		const avg = updatedReviews.length
			? Number((updatedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / updatedReviews.length).toFixed(1))
			: 0;
		praxis = {
			...praxis,
			reviews: updatedReviews,
			reviewCount: updatedReviews.length,
			avgRating: avg
		};
	}

	function submitReview() {
		reviewMessage = '';
		reviewError = '';
		if (!$session || $session.role !== 'patient') {
			reviewError = 'Bitte als Patient anmelden, um eine Bewertung abzugeben.';
			return;
		}
		if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
			reviewError = 'Bitte Sterne-Bewertung auswählen.';
			return;
		}
		if (!reviewText.trim()) {
			reviewError = 'Bitte einen kurzen Kommentar ergänzen.';
			return;
		}

		const newReview = {
			rating: Number(reviewRating),
			text: reviewText.trim(),
			author: reviewAuthor?.trim() || 'Anonym',
			date: new Date().toISOString()
		};
		const updated = [newReview, ...(praxis?.reviews || [])];
		updateReviews(updated);
		reviewText = '';
		reviewRating = 5;
		reviewMessage = 'Bewertung gespeichert (Demo)';
	}

	async function load() {
		loading = true;
		error = '';
		message = '';

		try {
			const res = await fetch('/api/praxen/' + params.id);
			if (!res.ok) throw new Error('Praxis konnte nicht geladen werden.');
			praxis = await res.json();

			const resT = await fetch('/api/termine');
			if (!resT.ok) throw new Error('Termine konnten nicht geladen werden.');
			const t = await resT.json();

			const pid = getId(praxis) || params.id;
			termine = Array.isArray(t) ? t.filter((x) => x.praxisId == pid) : [];
		} catch (e) {
			console.error(e);
			error = e?.message || 'Fehler beim Laden der Daten.';
			praxis = null;
			termine = [];
		} finally {
			loading = false;
		}
	}

	async function submit() {
		message = '';
		error = '';

		// require logged-in patient
		if (!$session || $session.role !== 'patient') {
			error = 'Bitte als Patient anmelden, um Termine zu buchen.';
			return;
		}

		if (!selectedSlot) {
			error = 'Bitte wählen Sie einen Zeitslot aus.';
			return;
		}

		const payload = { 
			praxisId: params.id, 
			time: selectedSlot, 
			note: note,
			patient: $session.name || $session.userId || 'Unbekannt' 
		};
		
		const err = validateAppointment(payload);
		if (err) {
			error = err;
			return;
		}

		try {
			const res = await fetch('/api/termine', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const data = await res.json();

			if (res.ok) {
				const slotDate = new Date(selectedSlot);
				const formattedDate = formatDateLabel(slotDate);
				const slotTime = slotDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
				
				// Speichere Termin über den zentralen Store
				const terminObj = {
					praxisId: params.id,
					praxisName: praxis.name,
					fach: praxis.fach,
					city: praxis.city,
					address: praxis.address,
					phone: praxis.phone,
					email: praxis.email,
					date: selectedSlot.split('T')[0],
					time: slotTime,
					dateTime: selectedSlot,
					note: note,
					status: 'Bestätigt'
				};
				
				const savedTermin = addTermin(terminObj);
				
				// Speichere Booking-Info für Banner auf Terminseite
				const bookingInfo = {
					date: formattedDate,
					time: slotTime,
					praxisName: praxis.name
				};
				localStorage.setItem('lastBooking', JSON.stringify(bookingInfo));
				
				// Navigiere zur Terminseite
				await goto('/termine');
			} else {
				error = data?.error || 'Fehler beim Speichern.';
			}
		} catch (e) {
			console.error(e);
			error = 'Netzwerkfehler beim Speichern.';
		}
	}

	async function saveEdit(){
		message = '';
		error = '';
		if(!praxis || !praxis._id) return;
		// basic validation
		if(!Array.isArray(editData.services)) editData.services = [];
		if(!Array.isArray(editData.team)) editData.team = [];
		try{
			const payload = { openingHours: editData.openingHours, services: editData.services, description: editData.description, team: editData.team };
			const res = await fetch('/api/praxen/' + (praxis._id || praxis._id), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
			const j = await res.json();
			if(res.ok){
				message = 'Praxisdaten wurden gespeichert.';
				editMode = false;
				await load();
			} else {
				error = j?.error || 'Fehler beim Speichern der Praxisdaten.';
			}
		}catch(e){
			console.error(e);
			error = 'Netzwerkfehler beim Speichern der Praxisdaten.';
		}
	}

	onMount(load);
</script>

<main class="page">
	{#if loading}
		<p class="muted">Lade…</p>
	{:else if error && !praxis}
		<div class="msg error">{error}</div>
			<a class="btn" href="/">← Zurück zur Übersicht</a>
	{:else}
		<div class="container">
			<div class="header-row">
				<div>
					<h1 class="title">{praxis.name}</h1>
					<p class="muted">{praxis.fach} — {praxis.city}</p>
					<div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem">
						{#if praxis._id && (String(praxis._id).slice(-1) % 2 === 0)}
							<span class="badge">Verifiziert</span>
						{/if}
						<div class="muted">Zuletzt aktualisiert: {praxis.updatedAt ? new Date(praxis.updatedAt).toLocaleDateString() : 'k.A.'}</div>
						<div class="muted">Ø Antwortzeit: ~2h</div>
					</div>
				</div>

				<div class="actions">
					<a class="btn" href="/">← Zurück zur Übersicht</a>
				</div>
			</div>

			<div class="info-row">
				<div class="card info">
					<h3>Geschätzte Wartezeit</h3>
					<WartezeitBadge minutes={praxis.waitMinutes ?? 0} />
					<div class="waiting-patients-highlight">
						<p style="margin: 0;">
							Aktuelle wartende Patienten: <strong style="font-size: 1.2rem; color: #d97706;">{praxis.waitingPatients ?? 0}</strong>
						</p>
					</div>
					<p class="muted" style="font-size: 0.85rem; margin-top: 0.5rem;">
						Die angegebene Wartezeit ist ein geschätzter Durchschnitt basierend auf aktuellen Daten und
						kann variieren.
					</p>
				</div>

				<div class="card info">
					<h3>Kontakt & Adresse</h3>
					<div><strong>Kontakt {praxis.name}</strong></div>
					{#if praxis.address}
						<div><strong>Adresse:</strong> {praxis.address}</div>
					{:else}
						<div><strong>Adresse:</strong> Musterstrasse 1, 8000 Musterstadt</div>
					{/if}

					{#if praxis.phone}
						<div><strong>Telefon:</strong> <a href={`tel:${praxis.phone}`}>{praxis.phone}</a></div>
					{:else}
						<div><strong>Telefon:</strong> +41 44 123 45 67</div>
					{/if}

					{#if praxis.email}
						<div><strong>E-Mail:</strong> <a href={`mailto:${praxis.email}`}>{praxis.email}</a></div>
					{:else}
						<div><strong>E-Mail:</strong> kontakt@{slugifyName(praxis.name)}.ch</div>
					{/if}
					{#if praxis.website}
						<div>
							<strong>Website:</strong>
							<a target="_blank" rel="noreferrer" href={praxis.website}>{praxis.website}</a>
						</div>
					{/if}
				</div>
			</div>

			<div class="info-row">
				<div class="card info">
					<h3>Öffnungszeiten</h3>
					<p class="muted">{praxis.openingHours ?? 'Mo–Fr 08:00–18:00'}</p>
				</div>

				<div class="card info">
					<h3>Schwerpunkt</h3>
					<p class="muted">{praxis.shortProfile ?? 'Allgemeine Versorgung mit Fokus auf Prävention.'}</p>
				</div>
			</div>

			{#if praxis.description}
				<section class="section">
					<h2>Über die Praxis</h2>
					<p class="card">{praxis.description}</p>
				</section>
			{/if}

			<section class="section">
				<h2>Leistungen</h2>
				{#if praxis.services && praxis.services.length}
					<ul class="card list">
						{#each praxis.services as s}
							<li>{s}</li>
						{/each}
					</ul>
				{:else}
					<p class="muted">Keine speziellen Leistungen gelistet.</p>
				{/if}
			</section>
		{#if whyChoose.length > 0}
			<section class="section card info-box">
				<h3>Warum Patienten diese Praxis wählen</h3>
				<ul class="why-list">
					{#each whyChoose as reason}
						<li>✓ {reason}</li>
					{/each}
				</ul>
			</section>
		{/if}
			<section class="section">
				<h2>Bewertungen</h2>
				{#if reviewAvg !== null}
					<div class="card review-summary">
						<div style="display:flex;align-items:center;gap:0.75rem">
							<strong style="font-size:1.1rem">{reviewAvg} ★</strong>
							<span class="muted">{reviewCount} Bewertungen</span>
						</div>
					</div>
				{/if}

				{#if allReviews.length}
					<div class="card review-controls">
						<div class="filter-grid">
							<label>Suche
								<input
									type="search"
									placeholder="Autor oder Text"
									bind:value={reviewSearchTerm}
								/>
							</label>
							<label>Min. Sterne
								<select bind:value={reviewRatingFilter}>
									<option value="all">Alle</option>
									<option value="5">5</option>
									<option value="4">4+</option>
									<option value="3">3+</option>
									<option value="2">2+</option>
									<option value="1">1+</option>
								</select>
							</label>
							<label>Sortierung
								<select bind:value={reviewSort}>
									<option value="date_desc">Neueste zuerst</option>
									<option value="date_asc">Älteste zuerst</option>
									<option value="rating_desc">Beste zuerst</option>
									<option value="rating_asc">Niedrigste zuerst</option>
								</select>
							</label>
						</div>
						<div class="muted small">Zeige {filteredReviews.length} von {allReviews.length} Bewertungen</div>
					</div>
				{/if}

				{#if filteredReviews.length}
					<div class="review-tabs">
						<button class:active={reviewTab === 'top'} on:click={() => reviewTab = 'top'}>Top</button>
						<button class:active={reviewTab === 'all'} on:click={() => reviewTab = 'all'}>Alle Bewertungen</button>
					</div>
					<div class="cards reviews-grid">
						{#each displayedReviews as r}
							<div class="card review-card">
								<div class="review-head">
									<div>
										<div><strong>{r.author}</strong> — <span class="muted">{new Date(r.date).toLocaleDateString()}</span></div>
										<div class="stars">{'★'.repeat(r.rating) + '☆'.repeat(5-r.rating)}</div>
									</div>
								</div>
								<p class="muted" style="margin-top:0.5rem">{r.text}</p>
							</div>
						{/each}
					</div>
				{:else}
					<p class="muted">Noch keine Bewertungen vorhanden.</p>
				{/if}

				<div class="card review-form">
					<h3>Neue Bewertung abgeben</h3>
					{#if !$session || $session.role !== 'patient'}
						<p class="muted">Bitte als Patient anmelden, um eine Bewertung zu schreiben.</p>
					{:else}
						<div class="form-grid">
							<label>Sterne
								<select bind:value={reviewRating}>
									<option value="5">5</option>
									<option value="4">4</option>
									<option value="3">3</option>
									<option value="2">2</option>
									<option value="1">1</option>
								</select>
							</label>
							<label>Dein Name (optional)
								<input bind:value={reviewAuthor} placeholder="Anonym" />
							</label>
						</div>
						<label>Kommentar
							<textarea bind:value={reviewText} rows="3" placeholder="Wie war deine Erfahrung?"></textarea>
						</label>
						<button class="btn-primary" type="button" on:click={submitReview}>Bewertung speichern</button>
						{#if reviewMessage}<div class="msg success" style="margin-top:0.5rem">{reviewMessage}</div>{/if}
						{#if reviewError}<div class="msg error" style="margin-top:0.5rem">{reviewError}</div>{/if}
					{/if}
				</div>
			</section>

			<section class="section">
				<h2>Unser Team</h2>
				<div class="cards team-cards">
					{#each (praxis.team || []) as member}
						<div class="team-card card">
							<div class="avatar">{member.initials || (member.name || '').split(' ').map(n=>n[0]).slice(0,2).join('')}</div>
							<div>
								<div class="member-name">{member.name}</div>
								<div class="member-role">{member.role} — {member.specialization}</div>
							</div>
						</div>
					{/each}
				</div>
			</section>

			{#if isOwner}
			<section class="section card">
				<h3>Praxisdaten</h3>
				<p class="muted">Du bist als Praxis angemeldet. Änderungen nimmst du über die Bearbeiten‑Seite vor.</p>
				<div style="margin-top:0.75rem">
					<a class="btn-primary" href={'/praxis/' + (praxis._id||praxis.id) + '/bearbeiten'}>Praxis bearbeiten</a>
				</div>
			</section>
			{/if}

			{#if $session && $session.role === 'patient'}
		<section class="section card booking-section">
			<h2>Termin buchen</h2>
			
			<div class="form">
				<label>
					<strong>Datum wählen:</strong>
					<input 
						type="date" 
						bind:value={selectedDate} 
						min={minDate}
						max={maxDate}
					/>
				</label>

				{#if selectedDate}
					<div class="slots-section">
						<strong>Verfügbare Zeitslots am {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}:</strong>
						{#if availableSlots.length > 0}
							<div class="slots">
								{#each availableSlots as slot}
									<button
										type="button"
										class="slot-btn"
										class:selected={selectedSlot === slot.value}
										on:click={() => selectedSlot = slot.value}
									>
										{slot.label}
									</button>
								{/each}
							</div>
						{:else}
							<p class="muted">Keine freien Slots an diesem Tag verfügbar. Bitte wählen Sie ein anderes Datum.</p>
						{/if}
					</div>
				{/if}

				{#if selectedSlot}
					<div class="selected-info">
						✓ Gewählter Termin: {formatDateLabel(selectedSlot)}
					</div>
				{/if}

				<label>
					<strong>Notiz (optional):</strong>
					<input bind:value={note} placeholder="z.B. Grund des Besuchs" />
				</label>

				<button class="btn-primary" on:click={submit} disabled={!selectedSlot}>
					Termin anfragen
				</button>

				<p class="cancellation-notice">
					💡 Hinweis: Termine können bis 24 h vorher kostenfrei storniert werden.
				</p>

				{#if message}
					<div class="msg success">
						{message}
						<div style="margin-top:0.5rem">
							<a href="/termine" class="link-primary">→ Zu meinen Terminen</a>
						</div>
					</div>
				{/if}
				{#if error}
					<div class="msg error">{error}</div>
				{/if}
			</div>

			<div class="preparation-box">
				<h3>📝 Vorbereitung für Ihren Termin</h3>
				<ul>
					<li>Versicherungskarte mitbringen</li>
					<li>Vorbefunde bereithalten</li>
					<li>Bei Ersttermin 10 Minuten früher erscheinen</li>
				</ul>
			</div>
		</section>

			<section class="section">
				<h2>Meine Termine bei dieser Praxis</h2>
				{#if termine.length === 0}
					<p class="muted">Keine Termine gebucht.</p>
				{:else}
					<div class="cards">
						{#each termine as t}
							<TerminCard {t} on:deleted={load} on:updated={load} />
						{/each}
					</div>
				{/if}
			</section>
			{/if}
		</div>
	{/if}
</main>

<style>
	.page {
		background: #f6f8fb;
		padding: 24px 16px;
		min-height: 100%;
	}

	.container {
		max-width: 900px;
		margin: 0 auto;
	}

	.title {
		margin: 0;
	}

	.header-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.5rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		text-decoration: none;
		color: inherit;
		background: #fff;
	}

	.btn-primary {
		background: var(--primary);
		color: #fff;
		padding: 0.6rem 1rem;
		border-radius: 10px;
		text-decoration: none;
		border: none;
		cursor: pointer;
		font-weight: 500;
		transition: filter 0.2s ease;
	}

	.btn-primary:hover {
		filter: brightness(0.95);
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.info-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-top: 1rem;
	}

	.card {
		background: #fff;
		border: 1px solid rgba(15, 23, 42, 0.06);
		border-radius: 14px;
		padding: 0.9rem;
	}

	.review-summary,
	.review-controls,
	.review-form {
		margin-top: 0.5rem;
	}

	.review-controls .small,
	.review-form .small {
		margin-top: 0.5rem;
	}

	.card.info h3 {
		margin-top: 0;
	}

	.section {
		margin-top: 1rem;
	}

	.booking-section {
		background: linear-gradient(180deg, #ffffff, #fbfcff);
		border: 2px solid rgba(15, 23, 42, 0.08);
	}

	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 620px;
	}

	label {
		display: grid;
		gap: 0.4rem;
		color: #0f172a;
	}

	input[type="date"] {
		padding: 0.6rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		font-size: 1rem;
	}

	input {
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.12);
	}

	select {
		padding: 0.55rem 0.65rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: #fff;
	}

	textarea {
		padding: 0.65rem 0.7rem;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		resize: vertical;
		min-height: 120px;
	}

	.slots-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.slots {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.slot-btn {
		padding: 0.55rem 0.75rem;
		border-radius: 8px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		background: #fff;
		cursor: pointer;
		transition: all 0.2s ease;
		font-weight: 500;
	}

	.slot-btn:hover {
		border-color: var(--primary);
		background: #f8fafc;
	}

	.slot-btn.selected {
		background: var(--primary);
		color: #fff;
		border-color: transparent;
	}

	.team-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
	}
	
	.team-card {
		display: flex;
		gap: 12px;
		align-items: center;
	}
	
	.team-card .avatar {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--brand);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
	}
	
	.member-name {
		font-weight: 600;
	}
	
	.member-role {
		color: var(--muted);
		font-size: 0.95rem;
	}

	.preparation-box {
		margin-top: 1.5rem;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 10px;
		border: 1px solid rgba(15, 23, 42, 0.06);
	}

	.preparation-box h3 {
		margin: 0 0 0.75rem 0;
		color: #334155;
	}

	.preparation-box ul {
		margin: 0;
		padding-left: 1.25rem;
		color: #475569;
	}

	.preparation-box li {
		margin-bottom: 0.35rem;
	}

	.cancellation-notice {
		font-size: 0.85rem;
		color: #64748b;
		margin: 0;
		font-style: italic;
	}

	.link-primary {
		color: #166534;
		font-weight: 600;
		text-decoration: none;
	}

	.link-primary:hover {
		text-decoration: underline;
	}

	.info-box {
		background: #f8fafc;
	}

	.why-list {
		margin: 0.75rem 0 0 0;
		padding-left: 0;
		list-style: none;
		color: #475569;
	}

	.why-list li {
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.badge {
		background: rgba(51,65,85,0.08);
		padding: 4px 8px;
		border-radius: 6px;
		font-size: 0.8rem;
		color: #475569;
	}

	.cards {
		display: grid;
		gap: 12px;
		margin-top: 12px;
	}

	.reviews-grid {
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
	}

	.review-card .stars {
		color: #f59e0b;
		font-weight: 600;
	}

	.review-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}

	.review-tabs {
		display: flex;
		gap: 8px;
		margin: 8px 0 4px 0;
	}

	.review-tabs button {
		padding: 6px 12px;
		border-radius: 999px;
		border: 1px solid rgba(15,23,42,0.12);
		background: #fff;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.review-tabs button.active {
		background: var(--primary);
		color: #fff;
		border-color: transparent;
	}

	.filter-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: 12px;
		align-items: end;
	}

	.small {
		font-size: 0.85rem;
	}

	.waiting-patients-highlight {
		background: linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%);
		border: 2px solid #d97706;
		border-radius: 8px;
		padding: 12px 16px;
		margin: 12px 0;
		box-shadow: 0 2px 8px rgba(217, 119, 6, 0.15);
	}

	.waiting-patients-highlight p {
		color: #78350f;
		font-size: 0.95rem;
		margin: 0;
	}

	.msg {
		margin: 0.5rem 0;
		padding: 0.75rem;
		border-radius: 10px;
	}

	.msg.success {
		background: #dcfce7;
		color: #166534;
	}

	.msg.error {
		background: #fee2e2;
		color: #991b1b;
	}

	.muted {
		color: var(--muted);
	}

	.list {
		margin: 0;
		padding-left: 1.25rem;
	}

	@media (max-width: 900px) {
		.info-row {
			grid-template-columns: 1fr;
		}
	}

</style>
