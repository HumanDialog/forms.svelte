<script lang="ts">
    import {Button} from 'flowbite-svelte'
    import {getContext} from 'svelte'
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js' 
    import { reef } from '@humandialog/auth.svelte/dist/index.js';

    export let self = null;
    export let operation = '';
    export let params = null;

    export let context = '';
    export let typename = '';
    export let action = null;

    export let hiddenFunc = undefined;
    export let disabledFunc = undefined;
    

    let ctx = context ? context : getContext('ctx');
    let is_table_component :boolean = getContext('rIs-table-component');
    let can_be_activated :boolean = true;

    let     item = null
    let     definedClass = $$restProps.class ?? '';
    let     hidden :boolean = false;
    let     disabled :boolean = false;
    
    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        //if(!action)
        {
            item = self ?? $contextItemsStore[ctx];
                
            if(!typename)
                typename = $contextTypesStore[ctx];

            if(!typename && !!item)
            {
                if(item.$type)
                    typename = item.$type;
                else if(item.$ref)
                {
                    let s = item.$ref.split('/')
                    typename = s[1];
                }
            }
        }
        

        if(is_table_component)
        {
            if($contextItemsStore['sel'] != self)
                can_be_activated = false;
            else
                can_be_activated = true;
        }
        else
            can_be_activated =  !!item;

        if(hiddenFunc)
        {
            if(item)
                hidden = hiddenFunc(item)
            else
                hidden = true;    
        }
        else if(disabledFunc)
        {
            if(item)
                disabled = disabledFunc(item)
            else
                disabled = true;
        }
        else
            disabled = !item;
    }

    async function click()
    {
        if(action)
        {
            if(context)
            {
                if(params)
                    action(item, params);
                else
                    action(item);
            }
            else
            {
                if(params)
                    action(params);
                else
                    action();
            }
                
            $data_tick_store = $data_tick_store + 1;
        }
        else if(item && operation && typename)
        {
            try
            {
                let res;
                if(params)
                    res = await reef.post(`/${typename}/${item.Id}/${operation}`, params);
                else
                    res = await reef.get(`/${typename}/${item.Id}/${operation}`);
                
                if(res)
                    $data_tick_store = $data_tick_store + 1; 
            }
            catch(err)
            {
                console.error(err);
            }
        }
    }
    
</script>

{#if is_table_component}
    {#if can_be_activated}
        <Button on:click={click} class="h-7 {definedClass}"
                disabled={!can_be_activated}
                color='alternative'
                >
            <slot/>
        </Button>
    {/if}
{:else}

    <button on:click={click}
            class={definedClass}
            {hidden}
            {disabled}>
        <slot/>
    </button>

{/if}