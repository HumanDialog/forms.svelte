<script lang="ts">
	import { showFloatingToolbar, showMenu, showGridMenu } from './components/menu.js';
    import {contextToolbarOperations, pageToolbarOperations, contextItemsStore} from './stores.js'
    import {FaEllipsisV} from 'svelte-icons/fa'

    export let mobile :boolean = false

    $: update($pageToolbarOperations, $contextToolbarOperations);

    let operations = [];
    let leftOperations = []
    let rightOperations = []
    let hasOperations = false
    //op
    function update(...args)
    {
        let opVer = 0
        let operationsRoot = null
        if($contextToolbarOperations && Array.isArray($contextToolbarOperations) && $contextToolbarOperations.length > 0)
        {
            operations = $contextToolbarOperations;
        }
        else if($contextToolbarOperations && $contextToolbarOperations.operations && $contextToolbarOperations.operations.length > 0)
        {
            operations = $contextToolbarOperations.operations;
            opVer = $contextToolbarOperations.opver ?? 0
            operationsRoot = $contextToolbarOperations
        }
        else
        {
            if(Array.isArray($pageToolbarOperations))
                operations = $pageToolbarOperations;
            else
            {
                operations = $pageToolbarOperations.operations;
                opVer = $pageToolbarOperations.opver ?? 0
                operationsRoot = $pageToolbarOperations
            }
        }

        leftOperations = []
        rightOperations = []

        let AOperations = []
        let BOperations = []
        let COperations = []

        if(opVer == 1)
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
            rightOperations = COperations.toReversed()
        }
        else if(opVer == 2)
        {

            if(operationsRoot && operationsRoot.tbr)
            {
                let allFlatOperations = []
                operationsRoot.operations.forEach(g =>
                    allFlatOperations = [...allFlatOperations,
                        {
                            separator: true
                        },
                        ...g.operations
                    ]
                )

                const allOperationsMenu = {
                    caption: operationsRoot.caption ?? '',
                    icon: operationsRoot.icon ?? FaEllipsisV,
                    menu: allFlatOperations,
                    tbr: operationsRoot.tbr,
                    preAction: operationsRoot.preAction ?? undefined
                }

                switch(operationsRoot.tbr)
                {
                case 'A':
                    AOperations.push(allOperationsMenu)
                    break;

                case 'B':
                    BOperations.push(allOperationsMenu)
                    break;

                case 'C':
                    COperations.push(allOperationsMenu)
                    break;
                }
            }

            operations.forEach(group => {

                if(group.tbr)
                {
                    const expandOperation = {
                        caption: group.caption ?? '',
                        icon: group.icon ?? undefined,
                        preAction: group.preAction,
                        activeFunc: group.activeFunc,
                        menu: group.operations
                    }

                    switch(group.tbr)
                    {
                    case 'A':
                        AOperations.push(expandOperation)
                        break;

                    case 'B':
                        BOperations.push(expandOperation)
                        break;

                    case 'C':
                        COperations.push(expandOperation)
                        break;
                    }
                }

                group.operations.forEach(op => {
                    if(op.tbr)
                    {
                        const tbrOperation = {
                            ...op,
                        }

                        if(op.hideToolbarCaption)
                            tbrOperation.caption = ''

                        switch(op.tbr)
                        {
                        case 'A':
                            AOperations.push(tbrOperation)
                            break;

                        case 'B':
                            BOperations.push(tbrOperation)
                            break;

                        case 'C':
                            COperations.push(tbrOperation)
                            break;
                        }
                    }
                })
            })

            leftOperations = [...AOperations, ...BOperations]
            rightOperations = COperations.toReversed()
        }
        else
        {
            leftOperations = operations.filter(o => !o.right)
            rightOperations = operations.filter(o => o.right == true)
        }

        hasOperations = leftOperations.length > 0 || rightOperations.length > 0
    }

    function on_click(e, operation, isDisabled)
    {
        
        if(!operation)
            return;

        if(isDisabled)
        {
            e.preventDefault()
            e.stopPropagation()
            return;   
        }

        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(operation.preAction)
            operation.preAction(owner)

        if(operation.action)
        {
            //let focused_item = null
            //if($contextItemsStore.focused)
            //    focused_item = $contextItemsStore[$contextItemsStore.focused]

            operation.action(owner)
            return;
        }

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

    function mousedown(e, operation)
    {
        //console.log('mousdown', operation)
        // preventDefault on mousedown avoids focusing the button
        // so it keeps focus (and text selection)
        e.preventDefault()
        e.stopPropagation();
    }

    function isOperationActivated(operation)
    {
        if(operation.activeFunc)
            return operation.activeFunc();
        else
            return operation.active ?? false;
    }

    function isOperationDisabled(operation)
    {
        if(operation.disabledFunc)
            return operation.disabledFunc();
        else
            return operation.disabled ?? false;
    }
</script>

{#if hasOperations}
<section class="flex flex-row no-print h-10 bg-stone-50 dark:bg-stone-950 overflow-x-hidden overflow-y-clip py-0 text-xs whitespace-nowrap">
    <div    class="flex flex-row"
            class:flex-row-reverse={mobile}>

        {#each leftOperations as operation}
            {#if !operation.separator}
                {@const isActive=isOperationActivated(operation)}
                {@const isDisabled=isOperationDisabled(operation)}
                {#if operation.toolbox}
                    {#each operation.toolbox as operation}
                        {@const textColor= isDisabled ? 'text-stone-600 dark:text-stone-500' : 'text-stone-800 dark:text-stone-300 dark:hover:text-white '}
                        <button type="button"
                                class="py-2.5 px-1
                                text-xs font-thin
                                {textColor}
                                hover:bg-stone-700 active:bg-stone-300 border-stone-200
                                dark:hover:bg-stone-800 dark:active:bg-stone-600 dark:border-stone-600
                                focus:outline-none
                                inline-flex items-center"
                                class:bg-stone-700={isActive}
                                class:dark:bg-stone-800={isActive}
                                on:mousedown={(e) => mousedown(e, operation)}
                                on:click={(e) => {on_click(e, operation, isDisabled)}}>
                            {#if operation.icon}
                                <div class="w-5 h-5 mr-1"><svelte:component this={operation.icon}/></div>
                            {/if}
                            {#if operation.caption}
                                <span class="ml-1">{operation.caption}</span>
                            {/if}
                        </button>
                    {/each}
                {:else}
                    {@const enabledLightColors ='text-stone-600 hover:text-stone-800 hover:bg-stone-200 active:bg-stone-100 border-stone-200'}
                    {@const disabledLightColors ='text-stone-400 border-stone-200'}

                    {@const enabledDarkColors ='dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-800 dark:active:bg-stone-600 dark:border-stone-600'}
                    {@const disabledDarkColors ='dark:text-stone-500 dark:border-stone-600'}
                    
                    {@const disabledColors =`${disabledLightColors} ${disabledDarkColors}`}
                    {@const enabledColors =`${enabledLightColors} ${enabledDarkColors}`}
                    {@const colors = isDisabled ? disabledColors : enabledColors}

                    <button type="button"
                            class="py-2.5 px-2
                            text-xs font-thin
                            focus:outline-none
                            inline-flex items-center
                            {colors}"
                            class:bg-stone-200={isActive}
                            class:dark:bg-stone-800={isActive}
                            disabled={isDisabled}
                            on:mousedown={(e) => mousedown(e, operation)}
                            on:click={(e) => {on_click(e, operation, isDisabled)}}>
                        {#if operation.icon}
                            <div class="w-5 h-5 mr-1"><svelte:component this={operation.icon}/></div>
                        {/if}
                        {#if operation.caption}
                            <span class="ml-1">{operation.caption}</span>
                        {/if}
                    </button>
                {/if}
            {:else}
                <div class="border-l py-4"></div>
                <!--div class="border-l my-2"></div-->
            {/if}
        {/each}
    </div>

    <div class="ml-auto flex flex-row">
        {#each rightOperations as operation}
            {#if !operation.separator}
            {@const isActive=isOperationActivated(operation)}
            {@const isDisabled=isOperationDisabled(operation)}

            {@const enabledLightColors ='text-stone-600 hover:text-stone-800 hover:bg-stone-200 active:bg-stone-200 border-stone-200'}
            {@const disabledLightColors ='text-stone-400 border-stone-200'}

            {@const enabledDarkColors ='dark:text-stone-300 dark:hover:text-white dark:hover:bg-stone-800 dark:active:bg-stone-600 dark:border-stone-600'}
            {@const disabledDarkColors ='dark:text-stone-500 dark:border-stone-600'}
            
            {@const disabledColors =`${disabledLightColors} ${disabledDarkColors}`}
            {@const enabledColors =`${enabledLightColors} ${enabledDarkColors}`}
            {@const colors = isDisabled ? disabledColors : enabledColors}

                <button type="button"
                        class="py-2.5 px-4
                        text-xs font-thin
                        {colors}
                        focus:outline-none
                        inline-flex items-center"
                        class:bg-stone-200={isActive}
                        class:dark:bg-stone-800={isActive}
                        disabled={isDisabled}
                        on:mousedown={(e) => mousedown(e, operation)}
                        on:click={(e) => {on_click(e, operation, isDisabled)}}>
                    {#if operation.icon}
                        <div class="w-5 h-5 mr-1"><svelte:component this={operation.icon}/></div>
                    {/if}
                    {#if operation.caption}
                        <span class="ml-1">{operation.caption}</span>
                    {/if}
                </button>
            {/if}
        {/each}
    </div>
</section>
{/if}

<style>
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>