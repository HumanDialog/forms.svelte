

<script>
    import {data_tick_store, context_items_store} from './stores.js' 
    import { setContext } from 'svelte';
    export let c = ''   
    export let cl = 'col-span-1'
    
    export let context = ""
    export let self = null

    if(context != "")
    {    
        setContext('ctx', context) 
        if(self != null)
            context_items_store[context] = self 
    }

    
    switch(c)
    {
         case 'flex':
            cl = 'grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
            break;
         case 'x2':
            cl = 'xl:col-span-2'
            break;
         case 's2-l3-x4-w5':
            cl = 'sm:col-span-2 lg:col-span-3 xl:col-span-4 2xl:col-span-5'
            break;
         case 'f1':   
            cl = 'w-64 flex-none'
            break;
    }
    
 </script>    
 

<div class=" {cl} bg-stone-100 dark:bg-stone-800 shadow rounded-lg p-2 flex flex-col">
   <slot/> 
</div>