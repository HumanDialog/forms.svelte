<script lang="ts">
	import { showFloatingToolbar, showMenu, showGridMenu } from './components/menu.js';
    import {contextToolbarOperations, pageToolbarOperations, contextItemsStore} from './stores.js'

    export let mobile :boolean = false

    $: update($pageToolbarOperations, $contextToolbarOperations);

    let operations = [];
    function update(...args)
    {
        if($contextToolbarOperations && $contextToolbarOperations.length > 0)
            operations = $contextToolbarOperations;
        else
            operations = $pageToolbarOperations;
    }

    function on_click(e, operation)
    {
        if(!operation)
            return;

        if(operation.action)
        {
            let focused_item = null
            if($contextItemsStore.focused)
                focused_item = $contextItemsStore[$contextItemsStore.focused]
            
            operation.action(focused_item)
            return;
        }

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()


        if(operation.menu)
            showMenu(rect, operation.menu)
        else if(operation.toolbar)
            showFloatingToolbar(rect, operation.toolbar, operation.props ?? {} )
        else if(operation.grid)
            showGridMenu(rect, operation.grid)

    }

    function mousedown(e)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection) 
        e.preventDefault()
    }
</script>

<div    class="no-print w-full h-10 bg-stone-600 dark:bg-stone-950 overflow-x-clip overflow-y-hidden py-0 text-xs flex flex-row"
        class:flex-row-reverse={mobile}>
    
    {#each operations as operation}
        {#if !operation.separator}

            <button type="button" 
                    class="py-2.5 px-5 
                    text-xs font-medium text-stone-100 dark:text-stone-300 dark:hover:text-white 
                    hover:bg-stone-700 dark:hover:bg-stone-800 active:bg-stone-300 dark:active:bg-stone-600
                    border-stone-200 focus:outline-none dark:border-stone-600
                    inline-flex items-center"
                    on:click={(e) => {on_click(e, operation)}}
                    on:mousedown={mousedown}>
                {#if operation.icon}
                    <div class="w-3 h-3 mr-1"><svelte:component this={operation.icon}/></div>
                {/if}
                {#if operation.caption}
                    <span>{operation.caption}</span>
                {/if}
            </button>    
        {/if}
    {/each}
</div>

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>