<script lang="ts">
    import {getContext} from 'svelte'
    import Icon from '../icon.svelte'
    import {contextItemsStore, auto_hide_sidebar, contextToolbarOperations} from '../../stores'
    import {FaBars, FaEllipsisH} from 'svelte-icons/fa'

    import {
        selectable as _selectable,
        isSelected,
        editable as _editable,
        handleSelect,

		activateItem,

		getActive


    } from "../../utils";

    import {showMenu} from '../menu'
    
    export let href :string;
    export let icon :any|undefined = undefined;
    export let active = false;
    export let selectable :any|undefined = undefined;
    export let editable :any|undefined = undefined;
    export let operations :any|undefined = undefined;
    export let item :object|undefined = undefined;
    
    let isOnPage :boolean = getContext('rIs-page-component');

    $: context_data = $contextItemsStore;
    $: isRowActive = calculateIsRowActive($contextItemsStore)

    let user_class = $$props.class ?? ""
    let root;

    function calculateIsRowActive(...args)
    {
        if(!isOnPage)
            return active;

        if(!item)
            return active;

        const activeItem = getActive('props')
        if(activeItem == item)
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
        auto_hide_sidebar();
        
        if(selectable)
            handleSelect(e);
        else if(item)
            handleSelect(e);


        //e.stopPropagation();

        if(isOnPage)
        {
            if(!isRowActive)
            {
                e.preventDefault();
            }
            else
                e.stopPropagation();
        }
        else
            e.stopPropagation();
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

        let operationsContainer = [];
        if(operations)
        {
            let operationsList = operations(root);
            operationsContainer.push({
                icon: FaEllipsisH,
                menu: operationsList
            })
        }
        
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
        on:contextmenu={on_contextmenu}
        on:keydown
        on:keyup
        class="     border border-transparent rounded-lg
                    text-lg sm:text-base font-normal 
                    text-stone-900 sm:hover:bg-stone-100  
                    dark:text-white sm:dark:hover:bg-stone-700 {user_class}
                    flex flex-row justify-between"
        class:bg-stone-200={isRowActive}
        class:dark:bg-stone-700={isRowActive}
        class:selected={selected(selectable, context_data)}>
            <a  href={href} 
                on:click={on_link_clicked} 
                class="flex-1 ml-2 my-3 sm:my-2 inline-flex items-center group">
                {#if icon}
                    <Icon size={5} component={icon}/>
                {/if}
                <span   class="ml-3 group-hover:underline"
                        use:editable_if_needed={editable}>
                    <slot/>
                </span>
            </a>

            {#if !isOnPage}
            <section    class="flex-0 w-20 sm:w-12 h-10 flex-0 flex flex-row"
                        use:selectable_if_needed={selectable}>
                {#if can_show_context_menu(selectable, context_data)}
                    <button class="w-6 sm:w-4 h-6 sm:h-4 mt-3 mr-3 sm:mr-2 ml-auto" on:click={on_show_menu}>
                        <FaBars/>
                    </button>
                {/if}
            </section>
            {/if}
        </div>
</li>


<style lang="postcss">
    .selected{
        @apply border !border-blue-300
    }
</style>