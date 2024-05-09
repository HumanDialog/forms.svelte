<script lang='ts'>
    import { afterUpdate, getContext } from "svelte";
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js' 
    import {informModification, pushChanges} from '../updates.js'
    import { parseWidthDirective, shouldBeComapact} from '../utils.js'

    export let value = '';
    export let placeholder = '';
    export let onEnter = null;
    export let onBlur = null;

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let inserter = false;
    
    export let c=''
    export let pushChangesImmediately: boolean = true;

    let is_table_component :boolean = getContext('rIs-table-component');
    

    let   item = null

    let input_box_is_active = false;
    let focus_input_box = false;
    let inputbox;
    let org_value = '';
    let additional_class = $$restProps.class ?? '';
    
    afterUpdate(() => {
        if(focus_input_box && inputbox)
        {
            focus_input_box = false;

            if(value)
                inputbox.select();
                
            inputbox.focus();
        }
    });

    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);
    
    let  last_tick = -1;    
    $: setup($data_tick_store)

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            
        item = self ?? $contextItemsStore[ctx];
            
        if(!typename)
            typename = $contextTypesStore[ctx];

        if(a)
        {
            if(item != null)    
                value = item[a]
            else 
                value = "<empty>"
        }
    }
    

    export function run(event)
    {
        if( (!input_box_is_active) && 
            ( 
                ( is_table_component &&  ($contextItemsStore['sel'] == self)) || 
                (!is_table_component)
            ))
        {
            input_box_is_active = true;
            focus_input_box = true;
            org_value = value;
                 
            if(event)
            {
                event.preventDefault();
                event.stopPropagation();
            }
        }
    }

    async function on_key_down(event)
    {
        if(event.key == 'Enter')
        {
            if(!value && inserter)
            {
                input_box_is_active = false;
                return;
            }

            try
            {
                let success = false;
                if(onEnter)
                    success = onEnter(value);
                else
                {
                    success = value_changed();
                    accept_change();
                }

                if(inserter)
                {
                    if(success)
                    {
                        focus_input_box = true;
                        value = '';
                    }
                    else
                    {
                        value = org_value;
                        input_box_is_active = false;
                    }
                }
                else
                {
                    if(!success)
                        value = org_value;
                    else 
                        org_value = value;

                    input_box_is_active = false;
                }
            }
            catch(error)
            {
                console.log(error);
                input_box_is_active = false;
            }
            
        }
        else if(event.key == 'Esc' || event.key == 'Escape')
        {
            input_box_is_active = false;
            value = org_value;
        }
    }

    function on_blur(event)
    {
        input_box_is_active = false;
        value = org_value;

        if(onBlur)
            onBlur();
    }

    function value_changed()
    {
        if(item && a)
        {
            item[a] = value
            
            if(typename)
                informModification(item, a, typename);
        }

        return true;
    }

    function accept_change()
    {
        $data_tick_store = $data_tick_store + 1;

        if(pushChangesImmediately)
                pushChanges();
            
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="{cs} flex items-center {additional_class}" on:click={run}>
    <slot></slot>
    
    {#if input_box_is_active}
        <input bind:this={inputbox} bind:value={value} on:keydown={on_key_down} on:blur={on_blur} class="w-full border-0 bg-transparent text-stone-900 dark:text-stone-300"/>
    {:else if value}
        {#if is_table_component}
            <span>{value}</span>
        {:else}
            <span class="w-full text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-300 cursor-text">{value}</span>
        {/if}
    {:else if !is_table_component}
        <span class="w-full text-stone-500 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-400 cursor-text">{placeholder}</span>
    {/if}
</div>

<style>
    input:focus {
    outline: 0px solid transparent;
  }
</style>
