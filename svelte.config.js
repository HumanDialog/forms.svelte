import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';
import {i18nPreprocess} from './src/lib/i18n-preprocess.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors

	
	preprocess: [
		i18nPreprocess({ dryRun: false }),
		vitePreprocess()
	],

	kit: {
		adapter: adapter()
	}
};

export default config;
