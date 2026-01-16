<script>
	import { setContext, getContext, onMount, onDestroy } from 'svelte';
	import {
		contextItemsStore,
		data_tick_store,
		contextTypesStore,
		context_info_store,
		contextToolbarOperations,
		pageToolbarOperations,
		page_title
	} from './stores.js';

	import {pushChanges} from './updates.js'


	//import {chnages} from './utils.js'

	export let context = 'data';
	export let self = null;
	export let typename = '';
	export let focused_only = false;
	export let inContext = '';
	export let cl =	'w-full overflow-x-hidden py-0 sm:px-3 border-0' ;
	export let c = '';

	export let toolbarOperations = undefined;
	export let clearsContext = '';
	export let title = '';
	export let paper=false

	switch (c) {
		case 'main':
			cl =
				'w-full h-full flex flex-col dark:bg-stone-800  overflow-y-hidden  overflow-x-hidden py-0 px-0 border-0';
			break;
		case 'main-d':
			cl =
				'bg-stone-800 w-full h-full flex flex-col dark:bg-stone-800  overflow-y-hidden  overflow-x-hidden py-0 px-0 border-0';
			break;
		case 'xy-scroll':
			cl =	'py-0  xborder-0 xbg-lime-700';
			break;
		default:
		//NOP
	}

	if($$props.class)
		cl += ' ' + $$props.class

	onDestroy(() => {
		console.log('#jcache the component is being destroyed');
		pushChanges();
	});


	onMount(() => {
		if (toolbarOperations != undefined)
		{
			if(Array.isArray(toolbarOperations))
				$pageToolbarOperations = [...toolbarOperations];
			else
				$pageToolbarOperations = {...toolbarOperations};
		}

		$page_title = title;

		//clear_selection();
		$contextToolbarOperations = [];
		$data_tick_store = $data_tick_store + 1;

		return () => {
			$pageToolbarOperations = [];
			$page_title = '';
		};
	});


	setContext('rIs-page-component', true);
	setContext('ctx', context);

	const cascadingParams = getContext('rPage-cascading-params')

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
	let heightClass = ''
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

		if(cascadingParams && cascadingParams.min_h_class)
			heightClass = cascadingParams.min_h_class;
		else
			heightClass = '';
	}

	function clear_selection(e)
	{
		if (!clearsContext) return;

		let contexts = clearsContext.split(' ');
		contexts.forEach((c) => {
			$contextItemsStore[c] = null;
			$context_info_store[c] = '';
		});

		//e.stopPropagation();

		$contextToolbarOperations = [];
		$data_tick_store = $data_tick_store + 1;
	}
</script>

<div class="page  {visibilty} {cl} {heightClass}" on:click={clear_selection}>
	{#if visibilty == ''}
		<slot />
	{/if}
</div>
