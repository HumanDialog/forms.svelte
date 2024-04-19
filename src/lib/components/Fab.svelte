<script lang="ts">
    import {contextToolbarOperations, pageToolbarOperations, contextItemsStore} from '../stores.js'
    import { showFloatingToolbar, showMenu, showGridMenu } from './menu.js';
    import FaChevronUp from 'svelte-icons/fa/FaChevronUp.svelte'
    import FaChevronDown from 'svelte-icons/fa/FaChevronDown.svelte'
    
    let expanded :boolean = false;

    $: update($pageToolbarOperations, $contextToolbarOperations);

    let operations = [];
    function update(...args)
    {
        //expanded = false;
        if($contextToolbarOperations && $contextToolbarOperations.length > 0)
            operations = $contextToolbarOperations;
        else
            operations = $pageToolbarOperations;
    }

    function on_click(e, operation)
    {
        //expanded = false;
        
        if(!operation)
            return;

        if(operation.action)
        {
            let focused_item = null
            if($contextItemsStore.focused)
                focused_item = $contextItemsStore[$contextItemsStore.focused]
        
            operation.action(focused_item)
        }


        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        const margin = 15;
        rect.x -= margin;
        rect.y -= margin;
        rect.width += 2*margin;
        rect.height += 2*margin;

        if(operation.menu)
            showMenu(rect, operation.menu)
        else if(operation.toolbar)
            showFloatingToolbar(rect, operation.toolbar, operation.props ?? {})
        else if(operation.grid)
            showMenu(rect, operation.grid)     // mobile screen too small
            //showGridMenu(rect, operation.grid)
    }

    function toggle_expand(e)
    {
        expanded = !expanded;
    }

    function mousedown(e)
    {
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection) 
        e.preventDefault()
    }

</script>

{#if operations && operations.length > 0}
        
    {@const main_operation = operations[0]}
    <button class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                    font-medium rounded-full text-sm text-center shadow-md
                    w-[55px] h-[55px] 
                    fixed m-0 absolute bottom-[10px] right-[0px]
                    dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                    flex items-center justify-center
                    disable-dbl-tap-zoom"
                    on:click|stopPropagation={(e) => {on_click(e, main_operation)}} 
                    on:mousedown={mousedown} >
        <div class="w-7 h-7"><svelte:component this={main_operation.icon}/></div>
    </button>

    {#if operations.length > 1}
        {@const secondary_operation = operations[1]}
        {#if !secondary_operation.separator}
            <button class=" bg-transparent 
                            w-[55px] h-[55px] 
                            fixed m-0 absolute bottom-[10px] right-[60px]
                            flex items-center justify-center
                            disable-dbl-tap-zoom"
                            on:click|stopPropagation={(e) => {on_click(e, secondary_operation)}} 
                            on:mousedown={mousedown} >
                <div class="    w-10 h-10 
                                text-white bg-zinc-500 hover:bg-zinc-500
                                dark:bg-zinc-500 dark:hover:bg-zinc-500
                                font-medium rounded-full text-sm text-center shadow-md
                                flex items-center justify-center">
                    <div class="w-5 h-5">
                        <svelte:component this={secondary_operation.icon}/>
                    </div>
                </div>
            </button>
        {/if}

        {#if operations.length == 3}
            {@const thrid_operation = operations[2]}
            <button class=" bg-transparent
                            w-[55px] h-[55px] 
                            fixed m-0 absolute bottom-[70px] right-[0px]
                            
                            flex items-center justify-center
                            disable-dbl-tap-zoom"
                            on:click|stopPropagation={(e) => {on_click(e, thrid_operation)}} 
                            on:mousedown={mousedown} >
                <div class="    w-10 h-10
                            text-white bg-zinc-500 hover:bg-zinc-500 
                            font-medium rounded-full text-sm text-center shadow-md
                            dark:bg-zinc-500 dark:hover:bg-zinc-500
                            flex items-center justify-center">
                    <div class="w-5 h-5">
                        <svelte:component this={thrid_operation.icon}/>
                    </div>
                </div>
            </button>
        {:else if operations.length > 3}
            <button class=" bg-transparent
                            w-[55px] h-[55px] 
                            fixed m-0 absolute bottom-[70px] right-[0px]
                            
                            flex items-center justify-center
                            disable-dbl-tap-zoom"
                            on:click|stopPropagation={toggle_expand}
                            on:mousedown={mousedown}>
                <div class="    w-10 h-10
                                text-white bg-zinc-500 hover:bg-zinc-500 
                                font-medium rounded-full text-sm text-center shadow-md
                                dark:bg-zinc-500 dark:hover:bg-zinc-500
                                flex items-center justify-center">
                    <div class="w-5 h-5">
                        {#if expanded}
                            <FaChevronDown/>
                        {:else}
                            <FaChevronUp/>
                        {/if}
                    </div>
                </div>
            </button>
            {#if expanded}
                {@const operations_to_expand = operations.slice(2).reverse()}
                <ul class="list-none m-0 absolute bottom-[125px] right-0">
                    {#each operations_to_expand as operation}
                        {#if !operation.separator}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <li class="flex flex-row px-0 py-0 justify-end group"
                                on:click|stopPropagation={(e) => {on_click(e, operation)}}
                                on:mousedown={mousedown}>
                                {#if operation.caption}
                                    <div>
                                        <span class="block whitespace-nowrap text-sm mt-3 font-semibold text-white mr-3     select-none bg-stone-700 group-hover:bg-stone-800 px-1 shadow-lg rounded">{operation.caption}</span>
                                    </div>
                                {/if}
                                <button class=" bg-transparent
                                                mx-0 mb-4 w-[55px] h-[55px] 
                                                flex items-center justify-center
                                                disable-dbl-tap-zoom">
                                    <div class="    w-[55px] h-[55px]
                                                    text-white bg-zinc-500 group-hover:bg-zinc-500 
                                                    dark:bg-zinc-500 dark:group-hover:bg-zinc-500
                                                    font-medium rounded-full text-sm text-center shadow-md
                                                    flex items-center justify-center">
                                        <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
                                    </div>
                                </button>
                            </li>
                        {/if}
                    {/each}
                </ul>
            {/if}
        {/if}
    {/if} 
{/if}

<style>

.disable-dbl-tap-zoom {
  touch-action: manipulation;
}
</style>