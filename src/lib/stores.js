
import {writable, get} from 'svelte/store';

export const data_tick_store = writable(1);
export const context_items_store = writable({focused:'', data: null, sel: null})
export const context_info_store = writable({data: '', sel: ''})
export const context_types_store = writable({focused:'', data: null, sel: null})
export const context_toolbar_operations = writable([]);
export const page_toolbar_operations = writable([]);

export function has_selected_item()
{
    let itm = get(context_items_store).sel
    return itm !== null && itm !== undefined;
}

export function has_data_item()
{
    let itm = get(context_items_store).data
    return itm !== null && itm !== undefined;
}


export const dark_mode_store = writable( localStorage.dark_mode || '')
dark_mode_store.subscribe( (value) => {  localStorage.dark_mode = value } );

export const main_sidebar_visible_store = writable(sessionStorage.main_sidebar_visible_store || '*');
main_sidebar_visible_store.subscribe( (value) => { sessionStorage.main_sidebar_visible_store = value });

export const tools_visible_store = writable ((sessionStorage.tools_visible_store && sessionStorage.tools_visible_store == 'true') || false);
tools_visible_store.subscribe( (value) => { sessionStorage.tools_visible_store = (value ? 'true' : '') } );

export const bottom_bar_visible_store = writable( (sessionStorage.bottom_bar_visible_store && sessionStorage.bottom_bar_visible_store == 'true') || false);
bottom_bar_visible_store.subscribe( (value) => { sessionStorage.bottom_bar_visible_store = (value ? 'true' : '') } );

export const right_sidebar_visible_store = writable(false)
export const visible_property_tab_store = writable('');

export function restore_defults()
{
    main_sidebar_visible_store.set('*');
    tools_visible_store.set(false);
    bottom_bar_visible_store.set(false);
    right_sidebar_visible_store.set(false);
    visible_property_tab_store.set('');
}

export function toggle_sidebar(index)
{
    //console.log("ts: " + index)
    if(get(main_sidebar_visible_store) == index)
        main_sidebar_visible_store.set('*')
    else
        main_sidebar_visible_store.set(index)
}

export function auto_hide_sidebar()
{
//    console.log("sw: " + screen.width)
    
    if(screen.width < 1024)
        hide_sidebar()
}
    
export function hide_sidebar()
{
    main_sidebar_visible_store.set('*')
    //console.log("auto_hide_sidebar:" + get(main_sidebar_visible_store))
}

export function show_sidebar(index)
{
    //console.log('show_sidebar:', index);
    main_sidebar_visible_store.set(index)
}



