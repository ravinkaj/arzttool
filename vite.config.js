import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Disable the Vite error overlay in the browser during development.
	// This stops the large red overlay that blocks the page when a compile
	// error occurs. Errors will still be logged in the terminal.
	server: {
		hmr: {
			overlay: false
		}
	}
});
