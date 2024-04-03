<script>
	import { setContext, onMount } from 'svelte';
	import {
		contextItemsStore,
		data_tick_store,
		contextTypesStore,
		context_info_store,
		contextToolbarOperations,
		pageToolbarOperations,
		page_title
	} from './stores.js';

	//import {chnages} from './utils.js'

	export let context = 'data';
	export let self = null;
	export let typename = '';
	export let focused_only = false;
	export let inContext = '';
	export let cl =
		'w-full h-full flex flex-col dark:bg-stone-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0'; // border-green-500
	export let c = '';

	export let toolbarOperations = undefined;
	export let clears_context = '';
	export let title = '';

	switch (c) {
		case 'main':
			cl =
				'w-full h-full flex flex-col dark:bg-stone-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0';
			break;
		case 'main-d':
			cl =
				'bg-stone-800 w-full h-full flex flex-col dark:bg-stone-800  overflow-y-hidden  overflow-x-hidden py-1 px-1 border-0';
			break;
		default:
		//NOP
	}

	onMount(() => {
		if (toolbarOperations != undefined && Array.isArray(toolbarOperations))
			$pageToolbarOperations = [...toolbarOperations];

		$page_title = title;

		//clear_selection();
		$contextToolbarOperations = [];
		$data_tick_store = $data_tick_store + 1;

		return () => {
			$pageToolbarOperations = [];
			$page_title = '';
		};
	});

	setContext('ctx', context);
	let item = null;
	let visibilty = 'hidden';
	if (inContext == '') inContext = context;
	let last_tick = 0;
	if (self != null) $contextItemsStore[context] = self;

	if (typename) $contextTypesStore[context] = typename;

	item = $contextItemsStore[context];
	visibilty = 'hidden';
	if (item != null) {
		if (focused_only) {
			if ($contextItemsStore.focused == inContext) visibilty = '';
		} else visibilty = '';
	}
	let t = 0;
	$: {
		t = $data_tick_store;
		//chnages.just_changed_context = false;

		if (t > last_tick) {
			last_tick = t;
			if (self != null) $contextItemsStore[context] = self;

			if (typename) $contextTypesStore[context] = typename;

			item = $contextItemsStore[context];
			visibilty = 'hidden';
			if (item != null) {
				if (focused_only) {
					if ($contextItemsStore.focused == inContext) visibilty = '';
				} else visibilty = '';
			}
			//console.log("$page[" + inContext + ", " + context + "]: " + visibilty)
			//console.log(item)
			//console.log("--------------")
		}
	}

	function clear_selection(e) {
		//console.log('page click', chnages.just_changed_context)
		if (!clears_context) return;

		let contexts = clears_context.split(' ');
		contexts.forEach((c) => {
			$contextItemsStore[c] = null;
			$context_info_store[c] = '';
		});

		//e.stopPropagation();

		$contextToolbarOperations = [];
		$data_tick_store = $data_tick_store + 1;
	}
</script>

<div class="bg-stone-100 dark:bg-stone-800 {visibilty} {cl}" on:click={clear_selection}>
	{#if visibilty == ''}
		<slot />
	{/if}
</div>
