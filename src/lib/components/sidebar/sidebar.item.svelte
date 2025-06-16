<script lang="ts">
    import {getContext, tick} from 'svelte'
    import Icon from '../icon.svelte'
    import {contextItemsStore, auto_hide_sidebar, contextToolbarOperations} from '../../stores'
    import {FaBars, FaEllipsisV} from 'svelte-icons/fa'
    import {link, push} from 'svelte-spa-router'
    //import FaBars from 'svelte-icons/fa/FaBars.svelte'

    import {
        selectable as _selectable,
        isSelected,
        editable as _editable,
        handleSelect,

		activateItem,
        startEditing,
		getActive,

		isOnNavigationPage,

		UI




    } from "../../utils";

    import {showMenu} from '../menu'
    
    export let href :string;
    export let icon :any|undefined = undefined;
    export let active = false;
    export let selectable :any|undefined = undefined;
    export let editable :any|undefined = undefined;
    export let operations :any|undefined = undefined;
    export let item :object|undefined = undefined;
    export let summary :string|object|undefined = undefined;
    
    let isOnPage :boolean = getContext('rIs-page-component');

    let summaryElement = null;
    let summaryPlaceholder :boolean = false;
    let summaryEditable :Function | object | undefined = undefined;

    $: context_data = $contextItemsStore;
    $: isRowActive = calculateIsRowActive($contextItemsStore)
    $: summaryText = calculateSummary(summary)

    function calculateSummary(...args)
    {
        if(!summary)
        {
            summaryEditable = undefined;
            return "";
        }

        if(summary instanceof Object)
        {
            summaryEditable = summary.editable;
            if(summary.content)
                return summary.content;
            else
                return "";
        }
        else
        {
            summaryEditable = undefined;
            return summary;
        }
    }

    
    export async function editSummary()
    {
        if(!summaryEditable)
            return;

        if(!!summaryElement)
            startEditing(summaryElement, (d) => { summaryPlaceholder = false })
        else
        {
            summaryPlaceholder = true;
            await tick();
            startEditing(summaryElement, (d) => { summaryPlaceholder = false })
        }
    }

    export function updateSummary(txt)
    {
        console.log('updateSummary', txt)
        summaryText = txt
    }

    let user_class = $$props.class ?? ""
    let root;

    function calculateIsRowActive(...args)
    {
        if(!isOnPage)
            return active;

        if(!item)
            return active;

        const activeItem = getActive('props')
        if(item.$ref)
        {
            if(activeItem)
            {
                return item.$ref == activeItem.$ref        
            }
            else
                return false;
        }
        else if(item.Id)
        {
            if(activeItem)
            {
                return item.Id == activeItem.Id        
            }
            else
                return false;
        }
        else if(activeItem == item)
            return true;
        else
            return false;
    }

    function selectable_if_needed(node, selectable)
    {
        if(selectable)
            _selectable(node, selectable);
        else if(item)
            _selectable(node, item);
    }

    function selected(itm, context_data)
    {
        if(isSelected(itm))
            return true;
        else
            return false;
    }

    function editable_if_needed(node, editable)
    {
        if(editable)
            _editable(node, editable);
    }

    function on_link_clicked(e)
    {
        if(selectable)
            handleSelect(e);
        else if(item)
            handleSelect(e);


        if(!e.target)
            return;

        let linkNode = e.target;
        while(linkNode && linkNode.tagName != 'A')
            linkNode = linkNode.parentElement;

        if(!linkNode)
            return;
        
        const href = linkNode.getAttribute('href');
        e.preventDefault();

        if(isOnPage)
        {
            if(isRowActive)
            {
                redirect_to(href)
            }
        }
        else
        {
            auto_hide_sidebar();
            redirect_to(href)
        }
    }

    function redirect_to(href)
    {
        if(!href)
            return;

        let absolute_pattern = /^https?:\/\//i;
        if (!absolute_pattern.test(href))
            push(href);
        else
            window.location.href = href;
    }

    function on_contextmenu(e)
    {
        if(!operations)
            return;

        let operations_list = operations(root);
        if(!operations_list)
            return;
        
        if(operations_list.length == 0)
            return;

        showMenu(new DOMPoint(e.clientX, e.clientY), operations_list)

        e.preventDefault();
    }

    function can_show_context_menu(itm, context_data)
    {
        if(isOnPage)
            return false;

        if(!selected(itm, context_data))
            return false;

        if(!operations)
            return false;

        return true;
    }

    function on_show_menu(e)
    {
        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        let operations_list = operations(root);
        
        if(!operations_list)
            return;
        
        if(operations_list.length == 0)
            return;

        showMenu(rect, operations_list)
    }

    function activateRow(e)
    {
        if(!item)
            return;

        if(!isOnPage)
            return;

        let operationsContainer;
        if(operations)
        {
            let operationsList = operations(root);
            operationsContainer = {
                opver: 1,
                operations: [
                    {
                        caption: 'View',
                        operations: [
                            {
                                icon: FaEllipsisV,
                                menu: operationsList,
                                fab: 'M00'
                            }
                        ]
                    }
                ]
            }
        }
        else
            operationsContainer = []
        
       activateItem('props', item, operationsContainer)

        if(e)
            e.stopPropagation();

    }

</script>

<li bind:this={root}>
    <!--svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click
        on:click={activateRow}
        on:keydown
        on:keyup
        class="     mb-2
                    border border-transparent rounded-lg
                    text-stone-900 dark:text-white  {user_class}"
        class:sm:hover:bg-stone-100={!!href}
        class:sm:dark:hover:bg-stone-700={!!href}
        class:bg-stone-200={isRowActive}
        class:dark:bg-stone-700={isRowActive}
        class:selected={selected(selectable, context_data)}>  <!-- on:contextmenu={on_contextmenu} -->
            <div class="flex flex-row justify-between
                        text-base font-semibold">
                {#if href}
                    {#if isOnPage}
                        {#if isRowActive}
                            <a  on:click={on_link_clicked} 
                                href={href} 
                                use:link
                                class="flex-1 ml-2 inline-flex items-center underline"
                                >
                                {#if icon}
                                    <Icon class="w-5 h-5 mt-0.5 ml-2 mr-1" component={icon}/>
                                    
                                {/if}
                                <span   class="ml-3"
                                        use:editable_if_needed={editable}>
                                    <slot/>
                                </span>
                            </a>
                        {:else}
                            <span  on:click={on_link_clicked} 
                                class="flex-1 ml-2 inline-flex items-center"
                                >
                                {#if icon}
                                    <Icon class="w-5 h-5 mt-0.5 ml-2 mr-1" component={icon}/>
                                    
                                {/if}
                                <span   class="ml-3"
                                        use:editable_if_needed={editable}>
                                    <slot/>
                                </span>
                            </span>
                        {/if}
                    {:else}
                        <a  on:click={on_link_clicked} 
                            href={href} 
                            use:link
                            class="flex-1 ml-2 inline-flex items-center group"
                            >
                            {#if icon}
                                <Icon class="w-5 h-5 mt-0.5 ml-2 mr-1" component={icon}/>
                                
                            {/if}
                            <span   class="ml-3 group-hover:underline"
                                    use:editable_if_needed={editable}>
                                <slot/>
                            </span>
                        </a>
                    {/if}
                {:else}
                    <p  class="flex-1 ml-2 inline-flex items-center group cursor-default"
                        use:selectable_if_needed={selectable}>
                        {#if icon}
                            <Icon class="w-5 h-5 mt-0.5 ml-2 mr-1" component={icon}/>
                        {/if}
                        <span   class="ml-3"
                                use:editable_if_needed={editable}>
                            <slot/>
                        </span>
                    </p>
                {/if}

                {#if  !isOnPage}
                <section    class="flex-0 w-20 sm:w-12 flex-0 flex flex-row"
                            use:selectable_if_needed={selectable}>
                    {#if can_show_context_menu(selectable, context_data)}
                        <button class="w-5 h-5 mt-0.5 mr-3 ml-auto" on:click={on_show_menu}>
                            <FaBars/>
                        </button>
                    {/if}
                </section>
                {/if}
            </div>

            {#if summaryText || summaryPlaceholder}
                <p class="ml-14 mt-1
                        text-stone-900 dark:text-stone-400
                        cursor-default
                        text-sm   "
                    use:selectable_if_needed={selectable}
                    use:editable_if_needed={summaryEditable}
                    bind:this={summaryElement}>
                    {summaryText}
                </p>
            {/if}

    </div>
</li>


<style lang="postcss">
    .selected{
        @apply border !border-blue-300
    }
</style>