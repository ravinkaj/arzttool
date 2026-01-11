// Central slot/appointment management utilities
// All slots are generated between 08:00-18:00 only

/**
 * Generates available time slots for a practice
 * @param {string} praxisId - Practice ID
 * @param {Date} startDate - Start date (default: today)
 * @param {number} days - Number of days to generate slots for (default: 14)
 * @returns {string[]} Array of ISO date strings representing available slots
 */
export function generateSlotsForPraxis(praxisId, startDate = new Date(), days = 14) {
	const slots = [];
	
	// Time slots between 08:00 and 18:00
	const timeSlots = [
		'08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
		'12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
		'16:00', '16:30', '17:00', '17:30'
	];
	
	// Use praxisId to create deterministic but varied patterns
	const idHash = String(praxisId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
	const slotsPerDay = 3 + (idHash % 6); // 3-8 slots per day
	const offset = idHash % timeSlots.length;
	
	const now = new Date();
	
	for (let d = 0; d < days; d++) {
		const day = new Date(startDate);
		day.setDate(day.getDate() + d);
		day.setHours(0, 0, 0, 0);
		
		// Skip weekends (optional - remove if practices work weekends)
		// const dayOfWeek = day.getDay();
		// if (dayOfWeek === 0 || dayOfWeek === 6) continue;
		
		// Select slots for this day
		for (let s = 0; s < slotsPerDay; s++) {
			const timeIndex = (offset + d * 2 + s * 3) % timeSlots.length;
			const timeStr = timeSlots[timeIndex];
			const [hh, mm] = timeStr.split(':').map(Number);
			
			const slotDate = new Date(day);
			slotDate.setHours(hh, mm, 0, 0);
			
			// Only add future slots
			if (slotDate > now) {
				slots.push(slotDate.toISOString());
			}
		}
	}
	
	return slots;
}

/**
 * Gets the next available slot for a practice
 * @param {string} praxisId - Practice ID
 * @param {string[]} bookedSlots - Array of already booked slot ISO strings
 * @returns {Date|null} Next available slot as Date or null
 */
export function getNextAvailableSlot(praxisId, bookedSlots = []) {
	const allSlots = generateSlotsForPraxis(praxisId, new Date(), 14);
	const bookedSet = new Set(bookedSlots);
	
	for (const slot of allSlots) {
		if (!bookedSet.has(slot)) {
			return new Date(slot);
		}
	}
	
	return null;
}

/**
 * Formats a date as a user-friendly label (e.g., "Heute, 14:30" or "Mo, 15.1 09:00")
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateLabel(date) {
	const d = typeof date === 'string' ? new Date(date) : date;
	if (!d || isNaN(d)) return '';
	
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	
	const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	const time = `${hh}:${mm}`;
	
	if (targetDay.getTime() === today.getTime()) {
		return `Heute, ${time}`;
	}
	
	if (targetDay.getTime() === tomorrow.getTime()) {
		return `Morgen, ${time}`;
	}
	
	// Weekday short names
	const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const day = days[d.getDay()];
	const date_num = d.getDate();
	const month = d.getMonth() + 1;
	
	return `${day}, ${date_num}.${month} ${time}`;
}

/**
 * Gets available slots for a specific date
 * @param {string} praxisId - Practice ID
 * @param {Date|string} date - Target date
 * @param {string[]} bookedSlots - Array of already booked slot ISO strings
 * @returns {Object[]} Array of slot objects with time and label
 */
export function getSlotsForDate(praxisId, date, bookedSlots = []) {
	const targetDate = typeof date === 'string' ? new Date(date) : date;
	const allSlots = generateSlotsForPraxis(praxisId, new Date(), 14);
	const bookedSet = new Set(bookedSlots);
	
	const dayStart = new Date(targetDate);
	dayStart.setHours(0, 0, 0, 0);
	const dayEnd = new Date(targetDate);
	dayEnd.setHours(23, 59, 59, 999);
	
	return allSlots
		.filter(slot => {
			const slotDate = new Date(slot);
			return slotDate >= dayStart && slotDate <= dayEnd && !bookedSet.has(slot);
		})
		.map(slot => {
			const d = new Date(slot);
			const hh = String(d.getHours()).padStart(2, '0');
			const mm = String(d.getMinutes()).padStart(2, '0');
			return {
				value: slot,
				label: `${hh}:${mm}`,
				time: `${hh}:${mm}`
			};
		})
		.sort((a, b) => {
			const [aHh, aMm] = a.time.split(':').map(Number);
			const [bHh, bMm] = b.time.split(':').map(Number);
			const aTime = aHh * 60 + aMm;
			const bTime = bHh * 60 + bMm;
			return aTime - bTime;
		});
}

/**
 * Checks if a slot can be cancelled (must be >24h in future)
 * @param {Date|string} slotTime - Appointment time
 * @returns {boolean} True if cancellation is allowed
 */
export function canCancelSlot(slotTime) {
	const slot = typeof slotTime === 'string' ? new Date(slotTime) : slotTime;
	if (!slot || isNaN(slot)) return false;
	
	const now = new Date();
	const hoursUntil = (slot - now) / (1000 * 60 * 60);
	
	return hoursUntil > 24;
}

/**
 * Gets appointment store from localStorage
 * @returns {Array} Array of appointments
 */
export function getStoredAppointments() {
	try {
		const stored = localStorage.getItem('termine');
		return stored ? JSON.parse(stored) : [];
	} catch (e) {
		return [];
	}
}

/**
 * Saves appointments to localStorage
 * @param {Array} appointments - Array of appointments to save
 */
export function saveAppointments(appointments) {
	try {
		localStorage.setItem('termine', JSON.stringify(appointments));
	} catch (e) {
		console.error('Failed to save appointments:', e);
	}
}

/**
 * Gets booked slots for a specific practice
 * @param {string} praxisId - Practice ID
 * @returns {string[]} Array of booked slot ISO strings
 */
export function getBookedSlotsForPraxis(praxisId) {
	const appointments = getStoredAppointments();
	return appointments
		.filter(apt => apt.praxisId === praxisId && apt.status !== 'abgesagt')
		.map(apt => apt.time);
}
