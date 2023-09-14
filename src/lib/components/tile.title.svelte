<script>
    import {getContext} from 'svelte';
    import {data_tick_store, context_items_store} from '../stores.js' 
    import { parse_width_directive} from '../utils.js'
   
    export let label = "Label"
    export let a = '';
    export let c=''

    let _label = label;


    let cs = parse_width_directive(c);
    
    let     item = null
    let     ctx = ''
    ctx = getContext('ctx')
    
    let  last_tick = $data_tick_store    

    if(label)
    {
        _label = label;
    }
    else if(a != '')
    {
        item = $context_items_store[ctx];
        if(item != null)
            _label = item[a]
    }


    let t = 0
    $: { t = $data_tick_store        
        if(t > last_tick)
        {
            last_tick = t       
            
            if(label)
                _label = label;
            else
            {
                item = $context_items_store[ctx];
                if(item != null)
                    _label = item[a]
            }
     
    }
       
}
</script>

<p class="{cs} text-gray-900 dark:text-white {$$restProps['class']}">{_label}</p>

