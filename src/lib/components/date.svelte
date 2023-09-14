<script lang='ts'>
    import { getContext } from "svelte";
    import {data_tick_store, context_items_store, context_types_store} from '../stores.js' 
    import {inform_modification, push_changes} from '../updates.js'
    import { parse_width_directive} from '../utils.js'

    
    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let date :Date  = null;

    export  let s = 'sm'
    export let c=''

    let is_table_component :boolean = getContext('rIs-table-component');

    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    
    switch (s)
    {
        case 'md':
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';           
            break;
    }

    let   item = null
    let   additional_class = $$restProps.class ?? '';
    let   value :Date = null;
    let   rValue :string = '';

    let ctx = context ? context : getContext('ctx');
    let cs = parse_width_directive(c);
    let style :string;
    
    if(!is_table_component)
    {
        style = `bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-primary-600 focus:border-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-gray-700
                dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`;
    }
    else
    {
        style = `bg-transparent text-sm block w-full  ${input_pb} ${input_pt} px-2.5`;
    }

    let can_be_activated :boolean = true;

    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        if(!date)
        {
            item = self ?? $context_items_store[ctx];
                
            if(!typename)
                typename = $context_types_store[ctx];
            
            if(!item[a])
                value = null;
            else
                value = new Date(item[a]);
        }
        else
            value = date;

        if(is_table_component)
        {
            if($context_items_store['sel'] != self)
                can_be_activated = false;
            else
                can_be_activated = true;
        }
        else
            can_be_activated =  true;

        
        /*rValue = new Intl.DateTimeFormat('sv-SE', 
                    {
                        hour12: false,
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                    }).format(value);
                    */

        rValue = get_formatted_date(value);
        
        
    }

    function get_formatted_date(d :Date) :string
    {
        if(!d)
            return '';

        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        let year = d.getFullYear();
        let hour = '' + d.getHours();
        let minutes = '' + d.getMinutes();

        if(day.length < 2)
            day = '0' + day;

        if(month.length < 2)
            month = '0' + month;

        if(hour.length < 2)
            hour = '0' + hour;

        if(minutes.length < 2)
            minutes = '0' + minutes;

        return `${year}-${month}-${day} ${hour}:${minutes}`;
    }

    function on_changed()
    {
        if(!rValue)
            value = null;
        else
            value = new Date(rValue);
        
        if(item != null)
        {
            if(value)
                item[a] = value.toISOString()
            else
                item[a] = null;
            
            if(typename)
            {
                inform_modification(item, a, typename);

                $data_tick_store = $data_tick_store + 1;
                push_changes();
            }
        }
    }

</script>

{#if !can_be_activated}
    <span class="{style} ml-0.5 h-7" >{rValue}</span>
{:else}
    <input class="  {cs} {style} {additional_class}" 
                    type="datetime-local" 
                    on:change={on_changed}
                    bind:value={rValue}/>
{/if}


<style>
    input:focus {
    outline: 0px solid transparent;
    }
</style>