<script lang='ts'>
    import { getContext } from "svelte";
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js'
    import {informModification, pushChanges} from '../updates.js'
    import { parseWidthDirective, isDeviceSmallerThan} from '../utils.js'
    import Ricon from  './r.icon.svelte'
    import FaChevronDown from 'svelte-icons/fa/FaChevronDown.svelte'
    import {getFormattedStringDate, getNiceStringDate, getNiceStringDateTime} from './date_utils.js'


    export let self = null;
    export let a = '';
    export let context = '';
    export let typename = '';
    export let date :Date  = null;
    export let onSelect = undefined;
    export let type = "date";   // datetime-local
    export let changed = undefined;
    export let readOnly: boolean = false

    export  let s = 'sm'
    export let c=''

    export let typo:boolean = false;
    export let compact :boolean = false;
    export let inContext :string = 'sel'   // in compact mode
    export let pushChangesImmediately: boolean = false;

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

            if(isDeviceSmallerThan("sm"))
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
    let font_size = 'text-base'
    let line_h = 'h-7 sm:h-5'
    let chevron_mt = 'mt-2 sm:mt-1'

    switch (s)
    {
        case 'md':
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';
            font_size = 'text-md'
            if(!is_compact)
                line_h = 'h-12 sm:h-10'
            else
                line_h = 'h-7 sm:h-5'
            chevron_mt = 'mt-2 sm:mt-1'
            break;

        case 'sm':
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';
            font_size = 'text-sm'
            if(!is_compact)
                line_h = 'h-12 sm:h-10'
            else
                line_h = 'h-7 sm:h-5'
            chevron_mt = 'mt-2 sm:mt-1'

            break;
        case 'xs':
            input_pt = 'pt-0.5'
            input_pb = 'pb-0.5';
            font_size = 'text-xs'
            if(!is_compact)
                line_h = 'h-7 sm:h-7'
            else
                line_h = 'h-6 sm:h-6'
            chevron_mt = 'mt-1.5 sm:mt-0.5'
            break;

        default:
            //label_mb =  'mb-0.5';
            input_pt =  ''
            input_pb =  '';
            font_size = ''
            line_h =    ''
            chevron_mt = ''
    }

    let   item = null
    let   user_class = $$restProps.class ?? '';
    let   value :Date = null;
    let   rValue :string = '';
    let   pretty_value :string = ''

    let ctx = context ? context : getContext('ctx');
    let cs = parseWidthDirective(c);
    let style :string;
    let input_element :HTMLInputElement|undefined = undefined;

    if(!is_compact)
    {
        style = `bg-stone-50 border border-stone-300 text-stone-900 text-sm rounded-lg
                focus:ring-primary-600 focus:border-primary-600 block w-full  ${input_pb} ${input_pt} px-2.5 dark:bg-stone-700
                dark:border-stone-600 dark:placeholder-stone-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500`;
    }
    else
    {
        style = `${font_size}`;
    }

    let can_be_activated :boolean = !readOnly;

    let  last_tick = -1;
    $: setup($data_tick_store, $contextItemsStore);

    export function refresh()
    {
        setup();
    }

    function setup(...args)
    {
        //if(data_tick_store <= last_tick)
        //    return;

        last_tick = $data_tick_store

        if(!date)
        {
            item = self ?? $contextItemsStore[ctx];

            if(!typename)
                typename = $contextTypesStore[ctx];

            if(!typename)
            {
                if(item.$type)
                    typename = item.$type;
                else if(item.$ref)
                {
                    let s = item.$ref.split('/')
                    typename = s[1];
                }
            }

            if(!item[a])
                value = null;
            else
                value = new Date(item[a]);
        }
        else
            value = date;

        if(readOnly)
            can_be_activated = false
        else if(is_compact)
        {
            can_be_activated = false;

            let contexts = inContext.split(' ');
            contexts.forEach(ctx =>
            {
                if($contextItemsStore[ctx] == item)
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

        rValue = getFormattedStringDate(value, type);

        if(type == 'datetime-local')
            pretty_value = getNiceStringDateTime(value);
        else
            pretty_value = getNiceStringDate(value);


    }


    async function on_changed()
    {
        if(!rValue)
            value = null;
        else
            value = new Date(rValue);

        console.log('rValue', rValue, 'value', value)

        if(onSelect)
        {
            await onSelect(value)
        }
        else if(item != null)
        {
            if(value)
                item[a] = value.toISOString()
            else
                item[a] = null;

            if(typename)
            {
                informModification(item, a, typename);

                $data_tick_store = $data_tick_store + 1;
                if(pushChangesImmediately)
                    pushChanges();
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

{#if typo}
    <div class="inline-block relative flex flex-row  items-center">
        <span class="mr-1">{pretty_value}</span>
        <Ricon icon = "chevron-down" size="xs"/>

        {#if can_be_activated}
            {#if type == "datetime-local"}
                <input  type="datetime-local"
                        class="datepicker-input"
                        tabindex="-1"
                        on:change={on_changed}
                        bind:value={rValue}
                        bind:this={input_element}>
            {:else}
                <input  type="date"
                        class="datepicker-input"
                        tabindex="-1"
                        on:change={on_changed}
                        bind:value={rValue}
                        bind:this={input_element}
                        on:blur={blur}>
            {/if}
        {/if}


    </div>


{:else if is_compact}
    <div class="inline-block  {line_h}">
       <div class="dark:text-stone-300  truncate" >
            <p >
                <span class="inline-block relative flex flex-row  items-center">
                    <span class="grow-1 pr-2.5 ">
                        {pretty_value}
                    </span>

                    {#if can_be_activated}
                        <!--strzalka w dol-->
                        <div class="no-print ml-auto w-3 h-3 {chevron_mt} text-stone-700 dark:text-stone-300">
                            <FaChevronDown/>
                        </div>
                    {/if}

                    {#if can_be_activated}
                        {#if type == "datetime-local"}
                            <input  type="datetime-local"
                                    class="datepicker-input"
                                    tabindex="-1"
                                    on:change={on_changed}
                                    bind:value={rValue}
                                    bind:this={input_element}>
                        {:else}
                            <input  type="date"
                                    class="datepicker-input"
                                    tabindex="-1"
                                    on:change={on_changed}
                                    bind:value={rValue}
                                    bind:this={input_element}
                                    on:blur={blur}>
                        {/if}
                    {/if}

                </span>
            </p>

        </div>

    </div>

{:else}
    {#if type == "datetime-local"}
        <input  class=" dark:text-white {cs} {style}  {line_h} px-2.5 {user_class}"
                type="datetime-local"
                on:change={on_changed}
                bind:value={rValue}
                bind:this={input_element}
        />
    {:else}
        <input  class=" dark:text-white {cs} {style}  {line_h} px-2.5 {user_class}"
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
    @media print
    {
        .no-print, .no-print *{
            display: none !important;
        }
    }
</style>
