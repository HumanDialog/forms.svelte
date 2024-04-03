<script lang="ts">
	import {getContext} from 'svelte'
    import {    context_items_store, 
                is_active, 
                is_selected, 
                activate_item, 
                selectable,
                editable,
				show_floating_toolbar} from '$lib'
    import {FaArrowsAlt, FaTrash, FaPlus, FaAlignLeft} from 'svelte-icons/fa'
    import MoveOperations from './kanban.move.menu.svelte'


    export let item: object;
    export let showMoveOperationsForItem: Function | undefined = undefined;
    export let scrollViewToCard: Function | undefined = undefined;
    export let runInserter: Function | undefined = undefined;

    let definition = getContext("rKanban-definition");

    $: is_row_active = calculate_active(item, $context_items_store)
    $: is_row_selected = selected(item, $context_items_store)

    $: selected_class = is_row_selected ? "!border-blue-300" : "";
    $: focused_class = is_row_active ? "bg-stone-100 dark:bg-stone-700" : "";

    function calculate_active(...args)
    {
        return is_active('props', item)
    }

    function selected(...args)
    {
        return is_selected(item)
    }

    export function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(is_active('props', item))
        {
            return;
        }

        activate_item('props', item, operations);
    }

    let operations = [
        {
            caption: '',
            icon: FaPlus,
            action: (f) => { if(runInserter) runInserter(item) }
        },
        {
            caption: '',
            icon: FaArrowsAlt,
            toolbar: MoveOperations,
            props: {
                    definition: definition,
                    item: item,
                    afterActionOperation: scrollViewToCard
            },
        },
        {
            caption: '',
            icon: FaTrash,
            action: (f) => definition.onRemove(item)
        }
    ]

    let moveButton;
    let card;
    export function showMoveOperations()
    {
        let rect = moveButton.getBoundingClientRect()

        show_floating_toolbar(rect, MoveOperations, 
                                {
                                    definition: definition,
                                    item: item,
                                    afterActionOperation: showMoveOperationsForItem
                                })
    }

    export function _scrollViewToCard()
    {
        card?.scrollIntoView(
            {
                behavior: "smooth",
                block: "start",
                inline: "center"
            }
        )
    }

    
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<li class="mx-2 pt-2 pb-4 px-1 rounded-md border border-transparent {selected_class} {focused_class}"
     class:cursor-pointer={!is_row_active}
     on:click={activate}
     use:selectable={item} 
     bind:this={card}>

    <!--  -->
    <!--section class="h-6 w-full flex flex-row ">
        <button class="h-3 w-3"
                class:hidden={!is_row_active}
                on:click={(e) => showMoveOperations()}
                bind:this={moveButton}>
            <FaArrowsAlt/>
        </button>
        
        {#if $$slots.kanbanCardTopProps}
            <div class="ml-auto flex flex-row gap-2">
                <slot name="kanbanCardTopProps" element={item}/>
            </div>
        {/if}
    </section-->

    {#if $$slots.kanbanCardTopProps}
        <section class="flex flex-row justify-between">
            <slot name="kanbanCardTopProps" element={item}/>
        </section>
    {/if}
    

    <h3  class=" text-lg font-semibold min-h-[1.75rem]
                sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                whitespace-nowrap overflow-clip truncate w-full sm:flex-none
                relative"
                use:editable={{
                    action: (text) => definition.titleOnChange(text, item), 
                    active: true}}>
        {item[definition.titleAttrib]}
        
        {#if definition.onOpen}
            <button class="absolute top-1 right-0 w-5 h-5 sm:w-3 sm:h-3"
                    class:hidden={!is_row_active}
                    on:click={(e) => definition.onOpen(item)}>
                <FaAlignLeft/>
            </button>
        {/if}
    </h3>

    {#if $$slots.kanbanCardMiddleProps}
        <section class="w-full flex flex-row">
             <slot name="kanbanCardMiddleProps" element={item} />
        </section>
    {/if}

    {#if item[definition.summaryAttrib]}
        <summary class="  sm:text-xs sm:min-h-[1rem]
                    text-base min-h-[1.5rem]
                    text-stone-400
                    max-h-[75px] sm:max-h-[64px]
                    text-ellipsis overflow-hidden">
            {item[definition.summaryAttrib]}
        </summary>
    {/if}

    {#if $$slots.kanbanCardBottomProps}
        <slot name="kanbanCardBottomProps" element={item} />
    {/if}
</li>