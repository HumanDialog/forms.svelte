
<script>
    import {data_tick_store} from '../stores.js' 

    export let i = null;
    export let fld = '';
    export let placeholder = ''

    export  let s = 'sm'
    let     label_mb = 'mb-1' //
    let     input_pt = 'pt-0.5'
    let     input_pb = 'pb-1'

    switch (s)
    {
        case 'md':
            label_mb = 'mb-2';
            input_pt = 'pt-2.5'
            input_pb = 'pb-2.5';           
            break;
            
            
    }    
    let value = "?" 
    $: {if(i != null)
        value = i[fld]}
             
    
</script>    

{#if i!= null}
<input  type=text value={value} on:input={()=> ($data_tick_store = $data_tick_store + 1)}
class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
focus:ring-primary-600 focus:border-primary-600 block w-full  {input_pb} {input_pt} px-2.5 dark:bg-gray-700
dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" 
placeholder={placeholder}>
{/if}
