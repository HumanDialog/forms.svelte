<script lang="ts">
    import { getContext } from "svelte";
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js' 
    import {informModification, pushChanges} from '../updates.js'
    import { parseWidthDirective} from '../utils.js'

    export let checked :boolean | undefined = undefined;
    export let disabled:boolean  = false;

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let c=''
    export let pushChangesImmediately: boolean = true;

    let   item = null
    let   additional_class = $$restProps.class ?? '';
    let   value :boolean = false;

    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);
    let color_style = disabled ? 'text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-300';
    
    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        if(checked === undefined)
        {
            item = self ?? $contextItemsStore[ctx];
                
            if(!typename)
                typename = $contextTypesStore[ctx];
            
            value = (item && a) ? (!!item[a]) : false;
        }
        else
            value = checked;
    }

    function on_changed()
    {
        if(item && a)
        {
            item[a] = value
            
            if(typename)
            {
                informModification(item, a, typename);
                
                $data_tick_store = $data_tick_store + 1;
                if(pushChangesImmediately)
                    pushChanges();
            }
        }
    }
  
</script>

<div class="ml-1 h-6 text-sm font-medium {cs} {additional_class} flex items-center"
    class:text-stone-400={!disabled}
    class:text-stone-900={disabled}
    class:dark:text-stone-300={!disabled}
    class:dark:text-stone-500={disabled}>
    <input  type="checkbox" 
            bind:checked={value} 
            on:change={on_changed}
            {disabled} 
            class=" w-4 h-4 
                    bg-stone-100 border-stone-300 dark:bg-stone-700 dark:border-stone-600 
                    dark:ring-offset-stone-800 
                    focus:ring-2 mr-2 rounded text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"/>
    <span class="ml-1">
        <slot/>
    </span>
    
</div>