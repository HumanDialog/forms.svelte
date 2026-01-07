<script>
    import {data_tick_store, contextItemsStore, contextTypesStore} from '../stores.js' 
    import {informModification, pushChanges} from '../updates.js'
    import {parseWidthDirective} from '../utils.js'
    import {getContext} from 'svelte';
    import Rich_edit from './document/rich.edit.svelte'
    

    
    export let label = ''
    export let self = null;
    export let a = '';
    export let context = ""
    export let itype="text"
    export let typename = '';
    export let invalid = false;
    
    export let val = ''
        
    export let placeholder = 'pl'
    export let pushChangesImmediately = false;

    export let required = false;
    export let readonly = false;

    export  let s = 'sm'
    export  let c = ''
    export  let validation = undefined;
    export function validate()
    {
        if(!validation)
        {
            if(required)
            {
                invalid = !val;
                return !invalid;   
            }
            else
            {
                invalid = false;
                return true;
            }
        }

        invalid = !validation(val);
        return !invalid;
    } 

    export function setReadonly(val)
    {
        readonly = val;
        itype = itype;
    }

    export function refresh(itm=undefined)
    {
        if(itm)
            self = itm;

        item = self ?? $contextItemsStore[ctx];
        setup()
    }

    let userClass = $$restProps.class ?? '';
    
    let   item = null

    let     labelMargins = 'mb-0.5' //
    let input_pt = 'pt-0.5'
    let input_pb = 'pb-1'
    
    switch (s)
    {
        case 'md':
            labelMargins = 'mb-1';
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';           
            break;
    }
   
    let cs =  c ? parseWidthDirective(c) : 'col-span-1';
    let ctx = context ? context : getContext('ctx');
        
    let  last_tick = -1    
    let border_style = "border-stone-300  dark:border-stone-600"

    $:{ 
        if($data_tick_store > last_tick)
            setup();
    }

    function setup()
    {
        last_tick = $data_tick_store;
        item = self ?? $contextItemsStore[ctx];    

        if(!typename)
            typename = $contextTypesStore[ctx];

        if(item && a)    
            val = item[a]
        
        if(label == '')
            label = a

        
    }
    
    function value_changed()
    {
        validate();
        if(item != null)
        {
            item[a] = val
            
            if(typename)
                informModification(item, a, typename);
        }
    }

    function accept_change()
    {
        $data_tick_store = $data_tick_store + 1;
        if(pushChangesImmediately)
            pushChanges();
            
    }

    function check_validity()
    {
        if(invalid)
            validate();
    }
        
   
</script>    

{#if itype == 'text'}
    {@const border_style = invalid ? "border-red-300 dark:border-red-600" : "border-stone-300 dark:border-stone-500" }
    <div class="{cs} {userClass}">
        <label for="name" class="block {labelMargins} text-xs font-small text-stone-900 dark:text-white">{label}</label>
        
        <input  type=text name="name" id="name" 
                bind:value={val} 
                on:change={()=> (value_changed())}
                on:blur={() => { accept_change();} }
                on:keydown={(e)=>{check_validity();}}
                {readonly}
                
                class="     bg-stone-50 dark:bg-stone-700
                            border {border_style} rounded-lg 
                            focus:ring-primary-600 focus:border-primary-600 dark:focus:ring-primary-500 dark:focus:border-primary-500
                            text-stone-900 dark:text-white text-sm  
                            block w-full {input_pb} {input_pt} px-2.5 
                            dark:placeholder-stone-400" 
                
                placeholder={placeholder}>
    </div>
{:else if itype == 'html'}   
    <!-- div class="{cs} prose prose-sm sm:prose-base dark:prose-invert h-full max-h-full overflow-y-auto"    
        contenteditable="true"
        bind:innerHTML={val} 
        on:input={()=> (value_changed())}
        on:blur={() => { accept_change(); }}/ -->
    <Rich_edit {...$$props} />
{/if}       
