<script lang="ts">
	import {getContext, tick} from 'svelte'
    import{ push } from 'svelte-spa-router'
    import {    contextItemsStore, 
                isActive, 
                isSelected, 
                activateItem, 
                selectable,
                editable,
				showFloatingToolbar,
				informModification,
                pushChanges,
				startEditing} from '$lib'
    import {FaRegFileAlt} from 'svelte-icons/fa'
    import Properties from './kanban.props.svelte'
    import {KanbanCardTop, KanbanCardMiddle, KanbanCardBottom} from '../Kanban'
    //import { Tooltip } from 'flowbite-svelte';
    
    export let item: object;
   // export let showMoveOperationsForItem: Function | undefined = undefined;
   // export let scrollViewToCard: Function | undefined = undefined;
   // export let runInserter: Function | undefined = undefined;

    //export let onMoveUp: Function;
    //export let onMoveDown: Function;
    //export let onReplace: Function;
    
    let definition = getContext("rKanban-definition");

    $: isCardActive = calculate_active(item, $contextItemsStore)
    $: isCardSelected = selected(item, $contextItemsStore)

    $: selectedClass = isCardSelected ? "!border-blue-300" : "";
    $: focusedClass = isCardActive ? "bg-stone-100 dark:bg-stone-700" : "";
    $: isLinkLike = isCardActive && (!!definition.titleHref || !!definition.titleHrefFunc)
    

    function calculate_active(...args)
    {
        return isActive('props', item)
    }

    function selected(...args)
    {
        return isSelected(item)
    }

    export function activate(e)
    {
        if(e)
            e.stopPropagation();

        if(isActive('props', item))
        {
            return;
        }

        let operations = getOperations();
        activateItem('props', item, operations);
    }

    function getOperations()
    {
        let operations = []
        
        const getCustomOperations = definition.getCardOperations;
        if(getCustomOperations)
        {
            const cutomOperations = getCustomOperations(item)
            cutomOperations.forEach( o => operations.push(o))
        }


        return operations;
    }

    //let moveButton;
    let card;
    /*export function showMoveOperations()
    {
        let rect = moveButton.getBoundingClientRect()

        showFloatingToolbar(rect, MoveOperations, 
                                {
                                    definition: definition,
                                    item: item,
                                    afterActionOperation: showMoveOperationsForItem,
                                    onMoveUp: onMoveUp,
                                    onMoveDown: onMoveDown,
                                    onReplace: onReplace
                                })
    }*/

    export function _scrollViewToCard()
    {
        card?.scrollIntoView(
            {
                behavior: "smooth",
                block: "nearest",
                inline: "nearest"
            }
        )
    }

    function onTitleChanged(text)
    {
        if(definition.titleOnChange)
            definition.titleOnChange(text, item)
        else
        {
            item[definition.titleAttrib] = text;
            informModification(item, definition.titleAttrib);
            pushChanges();
        }
    }

    function onSummaryChanged(text)
    {
        if(definition.summaryOnChange)
            definition.summaryOnChange(text, item)
        else
        {
            item[definition.summaryAttrib] = text;
            informModification(item, definition.summaryAttrib);
            pushChanges();
        }
    }

    function setSelectionAtEnd(element: HTMLElement)
    {
        const textNode = element.childNodes[0]
        const text = textNode.textContent;

        let range = document.createRange();
        let end_offset = text.length;
        let end_container = textNode;
        range.setStart(end_container, end_offset)
        range.setEnd(end_container, end_offset)
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    
    let topProps :any;
    let middleProps :any;
    let bottomProps :any;
    let titleElement: any;
    let summaryElement: any;
    let summaryPlaceholder: boolean = false;
    export async function editProperty(field: string)
    {
        if(field == "Title")
        {
            if(isLinkLike)
            {
                startEditing(titleElement);
            }
            else
            {
                titleElement.focus();
                await tick();
                setSelectionAtEnd(titleElement)
            }
            
        }
        else if(field == "Summary")
        {
            if(!!summaryElement)
            {
                summaryElement.focus();
                await tick();
                setSelectionAtEnd(summaryElement)
            }
            else
            {
                summaryPlaceholder = true;
                await tick();
                if(!!summaryElement)
                    summaryElement.focus();
            }
        }
        else
        {

            const property = definition.properties.find(p => p.name == field)
            if(!property)
                return;

            switch(property.position)
            {
            case KanbanCardTop:
                topProps.editProperty(field)
                break;

            case KanbanCardMiddle:
                middleProps.editProperty(field)
                break;

            case KanbanCardBottom:
                bottomProps.editProperty(field)
                break;
            }
        }
    }

    function followDefinedHRef()
    {
        let link: string = getHRef();
        if(link)
            push(link);
    }

    function getHRef(): string
    {
        if(definition.titleHref)
            return definition.titleHref;
        else if(definition.titleHrefFunc)
            return definition.titleHrefFunc(item);
        else
            return '';
    }

    function performOpen(e: MouseEvent)
    {
        e.stopPropagation();

        if(isLinkLike)
            followDefinedHRef();
        else
            definition.onOpen(item)
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

    function showAttachementIcon(): boolean
    {
        if(!definition.titleHasAttachment)
            return false;
        return definition.titleHasAttachment(item);
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->

<li class="mx-2 pt-2 pb-4 px-1 rounded-md border border-transparent {selectedClass} {focusedClass} scroll-mt-[50px] sm:scroll-mt-[40px]"
     class:cursor-pointer={!isCardActive}
     on:click={activate}
     use:selectable={item} 
     bind:this={card}>

    <!--  -->
    <!--section class="h-6 w-full flex flex-row ">
        <button class="h-3 w-3"
                class:hidden={!isCardActive}
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
    <Properties position={KanbanCardTop} {item} bind:this={topProps}/>
    

    {#if isCardActive}
        {@const hasOpen = !!definition.onOpen}
        {@const canOpen = isLinkLike || hasOpen}
        {@const openableClass = canOpen ? "sm:hover:cursor-pointer underline" : ""}
        {@const showIcon = showAttachementIcon()}
            <h3 class=" text-lg font-semibold min-h-[1.75rem]
                        sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                        whitespace-nowrap overflow-clip truncate w-full sm:flex-none
                        relative {openableClass}"
                use:editable={{
                    action: (text) => onTitleChanged(text), 
                    active: false,
                    readonly: definition.titleReadOnly,
                    onFinish: (d) => {titleElement.blur()}}}
                use:conditionalClick={{
                    condition: canOpen, 
                    callback: performOpen}}
                bind:this={titleElement}>
                    {item[definition.titleAttrib]}

                {#if showIcon}
                    <span id="attachement" class="absolute top-1 right-0 w-5 h-5 sm:w-3 sm:h-3">
                        <FaRegFileAlt/>
                    </span>
                {/if}
            </h3>

            <!--Tooltip type='light' triggeredBy="#attachement">Has attachement</Tooltip-->
        
          
                        
    {:else}
        <h3  class=" text-lg font-semibold min-h-[1.75rem]
                    sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                    whitespace-nowrap overflow-clip truncate w-full sm:flex-none
                    relative">
            {item[definition.titleAttrib]}

        </h3>
    {/if}


    {#if $$slots.kanbanCardMiddleProps}
        <section class="w-full flex flex-row">
             <slot name="kanbanCardMiddleProps" element={item} />
        </section>
    {/if}

    <Properties position={KanbanCardMiddle} {item} bind:this={middleProps}/>

    {#if item[definition.summaryAttrib] || summaryPlaceholder}
        {#key item[definition.summaryAttrib]}
            {#if isCardActive}
                <p class="  sm:text-xs sm:min-h-[1rem]
                            text-base min-h-[1.5rem]
                            text-stone-400
                            max-h-[75px] sm:max-h-[64px]
                            overflow-hidden"
                            use:editable={{
                                action: (text) => onSummaryChanged(text), 
                                active: true,
                                readonly: definition.summaryReadOnly,
                                onFinish: (d) => {summaryPlaceholder = false}}}
                            bind:this={summaryElement}>
                    {item[definition.summaryAttrib]}
                </p>
            {:else}
                <p class="  sm:text-xs sm:min-h-[1rem]
                                text-base min-h-[1.5rem]
                                text-stone-400
                                max-h-[75px] sm:max-h-[64px]
                                overflow-hidden">
                    {item[definition.summaryAttrib]}
                </p>
            {/if}
        {/key}
    {/if}

    {#if $$slots.kanbanCardBottomProps}
        <slot name="kanbanCardBottomProps" element={item} />
    {/if}

    <Properties position={KanbanCardBottom} {item} bind:this={bottomProps}/>
</li>