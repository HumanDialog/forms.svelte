<script lang='ts'>
    import { getContext } from "svelte";
    import {data_tick_store, context_items_store, context_types_store} from '../stores.js' 
    import {inform_modification, push_changes} from '../updates.js'
    import { parse_width_directive, is_device_smaller_than} from '../utils.js'

    
    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let date :Date  = null;
    export let on_select = undefined;
    export let type = "date";   // datetime-local
    export let changed = undefined;

    export  let s = 'sm'
    export let c=''

    export let compact :boolean = false;
    export let in_context :string = 'sel'   // in compact mode

    let on_hide_callback = undefined;
    export function show(event, hide_callback)
    {
        if(event)
        {
            event.stopPropagation();
            event.preventDefault();
        }

        if(!!hide_callback)
            on_hide_callback = hide_callback;
        else
            on_hide_callback = undefined;

        if(input_element)
        {
            input_element.focus();

            if(is_device_smaller_than("sm"))
            {
                input_element.click();
            }
            if ("showPicker" in HTMLInputElement.prototype) 
            {
                input_element.showPicker();
            }
        }
    }

    let is_compact :boolean = getContext('rIs-table-component') || compact;

    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    let font_size = 'text-sm'
    let line_h = 'h-4'
    
    switch (s)
    {
        case 'md':
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';  
            font_size = 'text-sm'       
            line_h = 'h-5'        
            break;

        case 'xs':
            input_pt = 'pt-0.5'
            input_pb = 'pb-0.5';
            font_size = 'text-xs'           
            line_h = 'h-4'
            break;
    }

    let   item = null
    let   user_class = $$restProps.class ?? '';
    let   value :Date = null;
    let   rValue :string = '';

    let ctx = context ? context : getContext('ctx');
    let cs = parse_width_directive(c);
    let style :string;
    let input_element :HTMLInputElement|undefined = undefined;

    let background_class = is_compact ? "bg-slate-900/10 dark:bg-slate-100/10 rounded-lg" : ""
    
    if(!is_compact)
    {
        style = `bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                focus:ring-primary-600 focus:border-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-gray-700
                dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`;
    }
    else
    {
        style = `${font_size}`;
    }

    let can_be_activated :boolean = true;

    let  last_tick = -1;    
    $: setup($data_tick_store, $context_items_store);

    function setup(...args)
    {   
        //if(data_tick_store <= last_tick)
        //    return;

        last_tick = data_tick_store            

        if(!date)
        {
            item = self ?? $context_items_store[ctx];
                
            if(!typename)
                typename = $context_types_store[ctx];

            if(!typename)
            {
                if(item.$type)
                    typename = item.$type;
                else if(item.$ref)
                {
                    let s = item.$ref.split('/')
                    typename = s[0];
                }
            }
            
            if(!item[a])
                value = null;
            else
                value = new Date(item[a]);
        }
        else
            value = date;

        if(is_compact)
        {
            can_be_activated = false;

            let contexts = in_context.split(' ');
            contexts.forEach(ctx => 
            {
                if($context_items_store[ctx] == item)
                    can_be_activated = true;
            } )
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

        if(type == "datetime-local")
            return `${year}-${month}-${day} ${hour}:${minutes}`;
        else
            return `${year}-${month}-${day}`;
    }

    async function on_changed()
    {
        if(!rValue)
            value = null;
        else
            value = new Date(rValue);

        //console.log('rValue', rValue, 'value', value)
        
        if(on_select)
        {
            await on_select(value)
        }
        else if(item != null)
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

            if(!!changed)
                changed(value);
        }
    }

    function blur(e)
    {
        if(!!on_hide_callback)
            on_hide_callback();
    }

</script>

{#if is_compact}
    <div class="inline-block relative {line_h}">
        <span class="dark:text-white {font_size} truncate  px-2.5 {background_class}
                    absolute left-0 top-0 h-full" >
            {rValue}
        
            {#if can_be_activated}
                {#if type == "datetime-local"}
                    <input  type="datetime-local" 
                            class="datepicker-input"
                            on:change={on_changed}
                            bind:value={rValue}
                            bind:this={input_element}>
                {:else}
                    <input  type="date" 
                            class="datepicker-input"
                            on:change={on_changed}
                            bind:value={rValue}
                            bind:this={input_element}
                            on:blur={blur}>
                {/if}
            {/if}
        </span>
    </div>

{:else}
    {#if type == "datetime-local"}
        <input  class=" dark:text-white {cs} {style}  {line_h} px-2.5 {background_class} {user_class}" 
                type="datetime-local" 
                on:change={on_changed}
                bind:value={rValue}
                bind:this={input_element}
        />
    {:else}
        <input  class=" dark:text-white {cs} {style}  {line_h} px-2.5 {background_class} {user_class}" 
                type="date" 
                on:change={on_changed}
                bind:value={rValue}
                bind:this={input_element}
        />
    {/if}
{/if}


   


<style>
    input:focus {
    outline: 0px solid transparent;
    }

    .datepicker-input{
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        box-sizing: border-box;
    }

    .datepicker-input::-webkit-calendar-picker-indicator {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        cursor: pointer;
    }

</style>

