<script lang="ts">
	import { showFloatingToolbar, showMenu, showGridMenu } from './components/menu.js';
    import {contextToolbarOperations, pageToolbarOperations, contextItemsStore} from './stores.js'

    export let mobile :boolean = false

    $: update($pageToolbarOperations, $contextToolbarOperations);

    let operations = [];
    let leftOperations = []
    let rightOperations = []

    function update(...args)
    {
        let isOpVer1 = false;
        if($contextToolbarOperations && Array.isArray($contextToolbarOperations) && $contextToolbarOperations.length > 0)
        { 
            operations = $contextToolbarOperations;
        }
        else if($contextToolbarOperations && $contextToolbarOperations.operations && $contextToolbarOperations.operations.length > 0)
        {
            operations = $contextToolbarOperations.operations;
            if($contextToolbarOperations.opver && $contextToolbarOperations.opver == 1)
                isOpVer1 = true;
        }
        else
        {
            if(Array.isArray($pageToolbarOperations))
                operations = $pageToolbarOperations;
            else
            {
                operations = $pageToolbarOperations.operations;
                if($pageToolbarOperations.opver && $pageToolbarOperations.opver == 1)
                    isOpVer1 = true;
            }
        }

        leftOperations = []
        rightOperations = []

        let AOperations = []
        let BOperations = []
        let COperations = []

        if(isOpVer1)
        {
            // first level group 'View', 'File', etc
            operations.forEach(group => {
                if(group.operations && group.operations.length > 0)
                {
                    AOperations = [...AOperations, ...group.operations.filter(o => o.tbr == 'A')  ]
                    BOperations = [...BOperations, ...group.operations.filter(o => o.tbr == 'B')  ]
                    COperations = [...COperations, ...group.operations.filter(o => o.tbr == 'C')  ]
                }
            })

            leftOperations = [...AOperations, ...BOperations]
            rightOperations = [...COperations]
        }
        else
        {
            leftOperations = operations.filter(o => !o.right)
            rightOperations = operations.filter(o => o.right == true)
        }
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

    function isOperationActivated(operation)
    {
        if(operation.activeFunc)
            return operation.activeFunc();
        else 
            return operation.active ?? false;
    }
</script>

<section class="flex flex-row no-print h-10 bg-stone-600 dark:bg-stone-950 overflow-x-clip overflow-y-hidden py-0 text-xs whitespace-nowrap">
    <div    class="flex flex-row"
            class:flex-row-reverse={mobile}>
        
        {#each leftOperations as operation}
            {#if !operation.separator}
                {@const isActive=isOperationActivated(operation)}
                {#if operation.toolbox}
                    {#each operation.toolbox as operation}
                        <button type="button" 
                                class="py-2.5 px-4 
                                text-xs font-thin text-stone-100 dark:text-stone-300 dark:hover:text-white 
                                hover:bg-stone-700 dark:hover:bg-stone-800 active:bg-stone-300 dark:active:bg-stone-600
                                border-stone-200 focus:outline-none dark:border-stone-600
                                inline-flex items-center"
                                class:bg-stone-700={isActive}
                                class:dark:bg-stone-800={isActive}
                                on:click={(e) => {on_click(e, operation)}}
                                on:mousedown={mousedown}>
                            {#if operation.icon}
                                <div class="w-3.5 h-3.5 mr-1"><svelte:component this={operation.icon}/></div>
                            {/if}
                            {#if operation.caption}
                                <span class="ml-1">{operation.caption}</span>
                            {/if}
                        </button>
                    {/each}
                {:else}
                
                    <button type="button" 
                            class="py-2.5 px-4
                            text-xs font-thin text-stone-100 dark:text-stone-300 dark:hover:text-white 
                            hover:bg-stone-700 dark:hover:bg-stone-800 active:bg-stone-300 dark:active:bg-stone-600
                            border-stone-200 focus:outline-none dark:border-stone-600
                            inline-flex items-center"
                            class:bg-stone-700={isActive}
                            class:dark:bg-stone-800={isActive}
                            on:click={(e) => {on_click(e, operation)}}
                            on:mousedown={mousedown}>
                        {#if operation.icon}
                            <div class="w-3.5 h-3.5 mr-1"><svelte:component this={operation.icon}/></div>
                        {/if}
                        {#if operation.caption}
                            <span class="ml-1">{operation.caption}</span>
                        {/if}
                    </button>
                {/if} 
            {:else}
                <!--div class="border-l my-2"></div-->
            {/if}
        {/each}
    </div>

    <div class="ml-auto flex flex-row">
        {#each rightOperations as operation}
            {#if !operation.separator}
            {@const isActive=isOperationActivated(operation)}
                <button type="button" 
                        class="py-2.5 px-4 
                        text-xs font-thin text-stone-100 dark:text-stone-300 dark:hover:text-white 
                        hover:bg-stone-700 dark:hover:bg-stone-800 active:bg-stone-300 dark:active:bg-stone-600
                        border-stone-200 focus:outline-none dark:border-stone-600
                        inline-flex items-center"
                        class:bg-stone-700={isActive}
                        class:dark:bg-stone-800={isActive}
                        on:click={(e) => {on_click(e, operation)}}
                        on:mousedown={mousedown}>
                    {#if operation.icon}
                        <div class="w-3.5 h-3.5 mr-1"><svelte:component this={operation.icon}/></div>
                    {/if}
                    {#if operation.caption}
                        <span class="ml-1">{operation.caption}</span>
                    {/if}
                </button>    
            {/if}
        {/each}
    </div>
</section>

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>