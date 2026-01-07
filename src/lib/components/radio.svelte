<script lang="ts">
    import { getContext } from "svelte";
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js' 
    import {informModification, pushChanges} from '../updates.js'
    import { parseWidthDirective} from '../utils.js'

    export let value;
    export let disabled:boolean  = false;

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let c=''
    export let pushChangesImmediately: boolean = false;

    let   item = null
    let   additional_class = $$restProps.class ?? '';
    
    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);
    let color_style = disabled ? 'text-stone-400 dark:text-stone-500' : 'text-stone-900 dark:text-stone-300';
    
    let name;

    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        item = self ?? $contextItemsStore[ctx];
                
        if(!typename)
            typename = $contextTypesStore[ctx];

        name = `${typename}_${item.Id}_${a}`;
    }

    function on_changed()
    {
        if(item && a)
        {
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

<div class="ml-2 h-6 {cs} {color_style} {additional_class} flex items-center">
    <input  type="radio" 
            bind:group={item[a]} 
            {value}
            {name}
            on:change={on_changed}
            {disabled} 
            class="w-4 h-4 bg-stone-100 border-stone-300 dark:ring-offset-stone-800 focus:ring-2 mr-2 dark:bg-stone-700 dark:border-stone-600 rounded text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"/>
    <span class="text-sm font-medium ml-1">
        <slot/>
    </span>
    
</div>