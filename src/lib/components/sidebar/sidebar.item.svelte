<script lang="ts">
    import Icon from '../icon.svelte'
    import {context_items_store, auto_hide_sidebar, context_toolbar_operations} from '../../stores'
    import FaBars from 'svelte-icons/fa/FaBars.svelte'

    import {
        selectable as _selectable,
        is_selected,
        editable as _editable,
        handle_select
    } from "../../utils";

    import {show_menu} from '../menu'
    
    export let href :string;
    export let icon :any|undefined = undefined;
    export let active = false;
    export let selectable :any|undefined = undefined;
    export let editable :any|undefined = undefined;
    export let operations :any|undefined = undefined;

    $: context_data = $context_items_store;

    let user_class = $$props.class ?? ""
    let root;

    function selectable_if_needed(node, selectable)
    {
        if(selectable)
            _selectable(node, selectable);
    }

    function selected(itm, context_data)
    {
        if(is_selected(itm))
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
            handle_select(e);


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

        show_menu(new DOMPoint(e.clientX, e.clientY), operations_list)

        e.preventDefault();
    }

    function can_show_context_menu(itm, context_data)
    {
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

        show_menu(rect, operations_list)
    }

</script>

<li bind:this={root}>
    <!--svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click
        on:contextmenu={on_contextmenu}
        on:keydown
        on:keyup
        class="     p-2 border border-transparent rounded-lg
                    text-base font-normal 
                    text-gray-900 hover:bg-gray-100  
                    dark:text-white dark:hover:bg-gray-700 {user_class}
                    flex flex-row justify-between"
        class:bg-gray-200={active}
        class:dark:bg-gray-700={active}
        use:selectable_if_needed={selectable}
        class:selected={selected(selectable, context_data)}>
            <a  href={href} 
                on:click={on_link_clicked} 
                class="inline-flex items-center group">
                {#if icon}
                    <Icon size={5} component={icon}/>
                {/if}
                <span   class="ml-3 group-hover:underline"
                        use:editable_if_needed={editable}>
                    <slot/>
                </span>
            </a>
            
            {#if can_show_context_menu(selectable, context_data)}
                <button class="w-4 h-4 mt-1" on:click={on_show_menu}>
                    <FaBars/>
                </button>
            {/if}
        </div>
</li>


<style lang="postcss">
    .selected{
        @apply border !border-blue-300
    }
</style>