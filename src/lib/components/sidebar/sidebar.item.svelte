<script lang="ts">
    import Icon from '../icon.svelte'
    import {context_items_store, auto_hide_sidebar} from '../../stores'

    import {
        selectable as _selectable,
        is_selected,
        editable as _editable,
        handle_select
    } from "../../utils";
    
    export let href :string;
    export let icon :any|undefined = undefined;
    export let active = false;
    export let selectable :any|undefined = undefined;
    export let editable :any|undefined = undefined;

    $: context_data = $context_items_store;

    let user_class = $$props.class ?? ""

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

</script>

<li>
    <!--svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click
        on:contextmenu
        on:keydown
        on:keyup
        class="p-2 text-base font-normal text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent {user_class}"
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
        </div>
</li>


<style lang="postcss">
    .selected{
        @apply border-2 !border-blue-300
    }
</style>