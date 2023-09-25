<script lang="ts">
    import {context_toolbar_operations, page_toolbar_operations, context_items_store} from '../stores.js'
    
    let expanded :boolean = false;

    $: update($page_toolbar_operations, $context_toolbar_operations);

    let operations = [];
    function update(...args)
    {
        if($context_toolbar_operations && $context_toolbar_operations.length > 0)
            operations = $context_toolbar_operations;
        else
            operations = $page_toolbar_operations;
    }

    function on_click(operation)
    {
        expanded = false;
        
        if(!operation)
            return;

        if(!operation.action)
            return;

        let focused_item = null
        if($context_items_store.focused)
            focused_item = $context_items_store[$context_items_store.focused]
        
        
        operation.action(focused_item)


    }

    function toggle_expand(e)
    {
        expanded = !expanded;
    }

</script>

{#if operations && operations.length > 0}
    
        {#if operations.length == 1}
            {@const operation = operations[0]}
            <button class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                            font-medium rounded-full text-sm text-center shadow-md
                            mr-2 mb-2 w-10 h-10 
                            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                            flex items-center justify-center"
                            on:click|stopPropagation={(e) => {on_click(operation)}} >
                <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
            </button>
        {:else}
            <button class="text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                            font-medium rounded-full text-sm text-center shadow-md
                            mr-2 mb-2 w-10 h-10 
                            dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800
                            flex items-center justify-center"
                            on:click|stopPropagation={toggle_expand}>
                    <div class="w-5 h-5">
                        <svg    xmlns="http://www.w3.org/2000/svg" 
                                viewBox="0 0 192 512" 
                                style=" stroke: currentColor;
                                        fill: currentColor;
                                        stroke-width: 0;
                                        width: 100%;
                                        height: auto;
                                        max-height: 100%;">
                            <path d="M96 184c39.8 0 72 32.2 72 72s-32.2 72-72 72-72-32.2-72-72 32.2-72 72-72zM24 80c0 39.8 32.2 72 72 72s72-32.2 72-72S135.8 8 96 8 24 40.2 24 80zm0 352c0 39.8 32.2 72 72 72s72-32.2 72-72-32.2-72-72-72-72 32.2-72 72z" />
                        </svg>
                    </div>
            </button>
            {#if expanded}
                <ul class="list-none m-0 absolute bottom-[60px] right-0">
                    {#each operations as operation}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <li class="flex flex-row px-1 py-0 justify-end group"
                            on:click|stopPropagation={(e) => {on_click(operation)}}>
                            <div>
                                <span class="block whitespace-nowrap text-sm mt-3 font-semibold text-white mr-3 select-none bg-slate-700 group-hover:bg-slate-800 px-1 shadow-lg rounded">{operation.caption}</span>
                            </div>
                            <button class=" text-white bg-blue-700 group-hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 
                                            font-medium rounded-full text-sm text-center shadow-md
                                            mr-1 mb-2 w-10 h-10 
                                            dark:bg-blue-600 dark:group-hover:bg-blue-700 dark:focus:ring-blue-800
                                            flex items-center justify-center">
                                <div class="w-5 h-5"><svelte:component this={operation.icon}/></div>
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        {/if}
{/if}

