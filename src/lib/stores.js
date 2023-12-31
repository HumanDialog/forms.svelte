
import {writable, get} from 'svelte/store';
import {SCREEN_SIZES} from './utils.js'

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


let has_saved_dark_mode = false;
function create_dark_mode_store()
{
    if(localStorage.dark_mode != undefined)
        has_saved_dark_mode = true;
    else
        has_saved_dark_mode = false;

    return writable( (localStorage.dark_mode) || '')
}

export const dark_mode_store = create_dark_mode_store();
dark_mode_store.subscribe( (value) => {  localStorage.dark_mode = value } );

export function set_dark_mode_default(value)
{
    if(!has_saved_dark_mode)
        dark_mode_store.set(value ? 'dark' : '')
}

export const main_sidebar_visible_store = writable((localStorage.main_sidebar_visible_store) || '*');
main_sidebar_visible_store.subscribe( (value) => { localStorage.main_sidebar_visible_store = value });

export let previously_visible_sidebar = "";

let has_saved_tools_visible = false;
function create_tools_visible_store()
{
    if(localStorage.tools_visible_store != undefined)
        has_saved_tools_visible = true;
    else
        has_saved_tools_visible = false;

    return writable ((localStorage.tools_visible_store && localStorage.tools_visible_store == 'true') || false);
}

export const tools_visible_store = create_tools_visible_store();
tools_visible_store.subscribe( (value) => { localStorage.tools_visible_store = (value ? 'true' : '') } );

export function set_default_tools_visible(value)
{
    if(!has_saved_tools_visible)
        tools_visible_store.set(value)
}

export const bottom_bar_visible_store = writable( (localStorage.bottom_bar_visible_store && localStorage.bottom_bar_visible_store == 'true') || false);
bottom_bar_visible_store.subscribe( (value) => { localStorage.bottom_bar_visible_store = (value ? 'true' : '') } );

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
    previously_visible_sidebar = get(main_sidebar_visible_store);

    if(get(main_sidebar_visible_store) == index)
        main_sidebar_visible_store.set('*')
    else
        main_sidebar_visible_store.set(index)
}

export function auto_hide_sidebar()
{
    //console.log("sw: " + window.innerWidth, SCREEN_SIZES.lg)
    
    if(window.innerWidth < SCREEN_SIZES.lg)
        hide_sidebar()
}

export function hide_sidebar()
{
    previously_visible_sidebar = get(main_sidebar_visible_store);
    main_sidebar_visible_store.set('*')
    //console.log("auto_hide_sidebar:" + get(main_sidebar_visible_store))
}

export function show_sidebar(index)
{
    previously_visible_sidebar = get(main_sidebar_visible_store);
    main_sidebar_visible_store.set(index)
}



