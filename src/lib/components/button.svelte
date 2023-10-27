<script lang="ts">
    import {Button} from 'flowbite-svelte'
    import {getContext} from 'svelte'
    import {data_tick_store, context_items_store, context_types_store} from '../stores.js' 
    import { reef } from '@humandialog/auth.svelte/dist/index.js';

    export let self = null;
    export let operation = '';
    export let params = null;

    export let context = '';
    export let typename = '';
    export let action = null;

    let ctx = context ? context : getContext('ctx');
    let is_table_component :boolean = getContext('rIs-table-component');
    let can_be_activated :boolean = true;

    let   item = null
    let   additional_class = $$restProps.class ?? '';

    let  last_tick = -1;    
    $: setup($data_tick_store);

    function setup(data_tick_store)
    {   
        if(data_tick_store <= last_tick)
            return;

        last_tick = data_tick_store            

        if(!action)
        {
            item = self ?? $context_items_store[ctx];
                
            if(!typename)
                typename = $context_types_store[ctx];
        }
        

        if(is_table_component)
        {
            if($context_items_store['sel'] != self)
                can_be_activated = false;
            else
                can_be_activated = true;
        }
        else
            can_be_activated =  true;
    }

    async function click()
    {
        if(action)
        {
            if(params)
                action(params);
            else
                action();
                
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
        <Button on:click={click} class="h-7 {additional_class}" 
                disabled={!can_be_activated}
                color='alternative'
                >
            <slot/>
        </Button>
    {/if}
{:else}

    <Button on:click={click} class="h-7 {additional_class}" 
            disabled={!can_be_activated}>
        <slot/>
    </Button>
{/if}