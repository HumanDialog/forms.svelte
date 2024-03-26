<script lang="ts">
    import FaTimes from 'svelte-icons/fa/FaTimes.svelte'

    export let name: string;
    export let color: string;
    export let onremove: any|undefined = undefined;

    let pr = onremove ? 'pr-1' : 'pr-2';
</script>

<div class="mt-1 pl-2 {pr} rounded text-white flex flex-row" style="background-color:{color}">
    <div class="text-xs mt-0.5 font-semibold">{name}</div>
    {#if onremove}
        <div class="no-print ml-1 mt-1 inline-block w-3 h-3 hover:cursor-pointer" 
            on:click={onremove}><FaTimes/></div>
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