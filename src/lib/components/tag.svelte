<script lang="ts">
    import FaTimes from 'svelte-icons/fa/FaTimes.svelte'

    export let name: string;
    export let color: string;
    export let onRemove: any|undefined = undefined;
    export let s: string = 'sm'

    let pr = onRemove ? 'pr-1' : 'pr-2';

    let font;
    let x_size;

    switch(s)
    {
    case 'md':
        font = 'mt-0.5 text-sm font-semibold'
        x_size = 'mt-1 w-3 h-3'
        break;

    case 'sm':
        font = 'mt-0 sm:mt-0.5 text-sm sm:text-xs font-semibold'
        x_size = 'ml-3 sm:ml-1 mt-1 sm:mt-1.5 w-3 sm:w-2 h-3 sm:h-2'
        break;

    case 'xs':
        //font = 'mt-0 sm:mt-0 text-xs sm:text-[0.65rem] font-semibold sm:font-normal'
        //x_size = 'mt-0.5 sm:mt-1 w-3 sm:w-2 h-3 sm:h-2'
        font = 'mt-0 sm:mt-0 text-xs sm:text-[0.65rem] font-semibold sm:font-normal'
        x_size = 'ml-3 sm:ml-1 mt-0.5 sm:mt-1 w-3 sm:w-2 h-3 sm:h-2'
        break;
    }
</script>

<div class="mt-1 pl-2 {pr} rounded text-white flex flex-row" style="background-color:{color}">
    <div class="{font}">{name}</div>
    {#if onRemove}
        <div class="no-print inline-block {x_size} hover:cursor-pointer" 
            on:click={onRemove}><FaTimes/></div>
    {/if}
</div>

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>