<script lang="ts">
    import { getContext } from "svelte";
    import {data_tick_store, context_items_store, context_types_store} from '../stores.js' 
    import {inform_modification, push_changes} from '../updates.js'
    import { parse_width_directive} from '../utils.js'

    export let value;
    export let disabled:boolean  = false;

    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';

    export let c=''

    let   item = null
    let   additional_class = $$restProps.class ?? '';
    
    let ctx = context ? context : getContext('ctx');
    let cs = parse_width_directive(c);
    let color_style = disabled ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-300';
    
    let name;

    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        item = self ?? $context_items_store[ctx];
                
        if(!typename)
            typename = $context_types_store[ctx];

        name = `${typename}_${item.Id}_${a}`;
    }

    function on_changed()
    {
        if(item && a)
        {
            if(typename)
            {
                inform_modification(item, a, typename);
                
                $data_tick_store = $data_tick_store + 1;
                push_changes();
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
            class="w-4 h-4 bg-gray-100 border-gray-300 dark:ring-offset-gray-800 focus:ring-2 mr-2 dark:bg-gray-700 dark:border-gray-600 rounded text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600"/>
    <span class="text-sm font-medium ml-1">
        <slot/>
    </span>
    
</div>