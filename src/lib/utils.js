import { getContext } from "svelte";

export let icons = {symbols :null}

export function parse_width_directive(c)
{   
    let cs = '';
    switch (c)
    {
        case '1':
            cs = 'col-span-1' 
            break;
        case '2':
            cs = 'col-span-2' 
            break;
        case '3':
            cs = 'col-span-3' 
            break;
        case '4':
            cs = 'col-span-4' 
            break;
        case '5':
            cs = 'col-span-5' 
            break;
        case '6':
            cs = 'col-span-6' 
            break;
        case '1-x3':
            cs = 'col-span-1 xl:col-span-3'    
            break;
        case '2-x3':
            cs = 'col-span-2 xl:col-span-3'    
            break;
        case '3-x9':
            cs = 'col-span-3 xl:col-span-9'
            break;    
        case '4-x9':
            cs = 'col-span-4 xl:col-span-9'
            break;    
        default:
            break;
    }

    return cs;
}

export function should_be_comapact()
{
    let is_in_table = getContext('rTable-definition');
    return !!is_in_table;
}