<script>
   import { writable } from 'svelte/store'; 
   import {data_tick_store, contextItemsStore} from './stores.js' 
   import { setContext } from 'svelte';

    export let context = ""
    export let self = null
    
    export let c = ''
    export let cl = 'grid-cols-1'
    export let fit = false;

    if(context != "")
    {    
        setContext('ctx', context) 
        if(self != null)
            contextItemsStore[context] = self 
    }

    let in_tile_flex_behaviour = fit ? "flex-1" : "flex-none"
   
    switch (c)
    {
        case '1':
            cl = 'grid-cols-1';
            break; 
        case '2':
            cl = 'grid-cols-2';
            break; 
        case '3':
            cl = 'grid-cols-3';
            break; 
        case '4':
            cl = 'grid-cols-4';
            break; 
        case '5':
            cl = 'grid-cols-5';
            break;         
        case 'flex':
            cl = 'grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12'
            break;
            
        case '4-s8-m10-l12':
            cl = 'grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12';
            break; 
        case '4-x16':
            cl = 'grid-cols-4 xl:grid-cols-16';
            break; 
        case '5-s10-m12':
            cl = 'grid-cols-5 sm:grid-cols-10 md:grid-cols-12';
            break; 
        case '5-x12':
            cl = 'grid-cols-5 xl:grid-cols-12';
            break; 
    }
</script>    

<div class="{in_tile_flex_behaviour} grid gap-2 mb-2 {cl} overflow-y-hidden">
    <slot/>
</div>