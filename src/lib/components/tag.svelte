<script lang="ts">
	import FaTimes from 'svelte-icons/fa/FaTimes.svelte';
	import { showFloatingToolbar } from './menu';
    import TagColors from './tag.colors.svelte'
	import { onMount } from 'svelte';

	export let name: string;
	export let color: string;
   // export let classColor: string;
	export let onRemove: any | undefined = undefined;
    export let onColor: any | undefined = undefined;
	export let s: string = 'sm';
	export let onCustomClick: any | undefined = undefined

   /* onMount( () => {

        if(onColor && rootElement)
        {
            rootElement.addEventListener("click", showColorPicker)
            rootElement.classList.add("cursor-pointer")
        }

        return () => {
            
        }
    })
*/

	let pr = onRemove ? 'pr-1' : 'pr-2';

	let font;
	let x_size;

	switch (s) {
		case 'md':
			font = 'mt-0.5 text-sm font-semibold';
			x_size = 'w-3 h-3';
			break;

		case 'sm':
			font = 'mt-0 text-xs mb-0.5 font-semibold';
			x_size = 'ml-2  w-3 h-3 ';
			break;

		case 'xs':
			//font = 'mt-0 sm:mt-0 text-xs sm:text-[0.65rem] font-semibold sm:font-normal'
			//x_size = 'mt-0.5 sm:mt-1 w-3 sm:w-2 h-3 sm:h-2'
			font = 'mt-0 sm:mt-0 text-xs sm:text-[0.65rem] font-semibold sm:font-normal';
			x_size = 'ml-3 sm:ml-1 w-3 sm:w-2 h-3 sm:h-2';
			break;

		default:
			font = ''
			x_size = 'ml-2 w-3 h-3';
	}

    let rootElement;
    let colorPicker = null;
	function showColorPicker(e) 
    {
        const rect = rootElement.getBoundingClientRect();
		colorPicker = showFloatingToolbar(rect, TagColors, {
            onSelect: onSelectColor
        } );
	}

    function onSelectColor(color)
    {
        onColor(name, color)
        colorPicker?.hide();
    }

	function conditionalClick(node, {condition, callback})
    {
        if(condition)
        {
            node.addEventListener('click', callback)
            return {
                destroy() {
                    node.removeEventListener('click', callback)
                }
            }
        }
    }

	const hasClick = (onColor != undefined) || (onCustomClick != undefined)
	function handleClick(e)
	{
		if(onColor)
			showColorPicker(e)		
		else if(onCustomClick)
			onCustomClick(e)
	}

</script>

<span
	class=" pl-2 {pr} rounded text-white flex flex-row {color}  items-center"
	class:cursor-pointer={hasClick}
	use:conditionalClick={{
		condition: hasClick, 
		callback: handleClick
	}}
	bind:this={rootElement}>
	<span class={font}>{name}</span>
	{#if onRemove}
		<span
			class="no-print inline-block {x_size} hover:cursor-pointer"
			on:click|stopPropagation={onRemove}>
			<FaTimes />
		</span>
	{/if}
</span>

<style>
	@media print {
		.no-print,
		.no-print * {
			display: none !important;
		}
	}
</style>
