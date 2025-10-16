
import {writable, get, derived} from 'svelte/store';
import {SCREEN_SIZES, randomString} from './utils.js'
import {navGetKey} from './utils.js'
import { location } from 'svelte-spa-router';

export const data_tick_store = writable(1);
export const contextItemsStore = writable({focused:'', data: null, sel: null, props: null})
export const context_info_store = writable({data: '', sel: ''})
export const contextTypesStore = writable({focused:'', data: null, sel: null})
export const contextToolbarOperations = writable([]);
export const pageToolbarOperations = writable([]);
export const toolsActionsOperations = writable([]);
export const page_title = writable('');
export const nav_titles = writable({});
export const mainContentPageReloader = writable(1);
export const wholeAppReloader = writable(1)
export const alerts = writable([])
export const tagsReloader = writable(1)


let toolsActionsOperationsStack = []
export function pushToolsActionsOperations(operations)
{
    toolsActionsOperationsStack.push(operations)
    toolsActionsOperations.set(operations) 
}

export function popToolsActionsOperations()
{
    toolsActionsOperationsStack.pop();
    const stackSize = toolsActionsOperationsStack.length;
    if(stackSize == 0)
    {
        //console.log('stack empty')
        toolsActionsOperations.set([]) 
    }
    else
    {
        const lastElement = toolsActionsOperationsStack[stackSize-1];
        //console.log('stack not empty (stackSize)', lastElement)
        toolsActionsOperations.set(lastElement) 
    }
}

export const addAlert = (txt) => {
    let al = get(alerts)
    const alert = {
        msg: txt,
        id: randomString(6),
        timeoutId: setTimeout(() => removeAlert(alert), 10000)
    }
    al = [alert, ...al];
    alerts.set(al);
}

export const removeAlert = (alert) => {
    let al = get(alerts)
    const idx = al.findIndex((a) => a.id == alert.id)
    if(idx >= 0)
    {
        clearTimeout(alert.timeoutId)
        al.splice(idx, 1)
        alerts.set(al)
    }
}

export const onErrorShowAlert = addAlert;

export function setNavigatorTitle(key, title)
{
    let titles = get(nav_titles);
    titles[key] = title;
    nav_titles.set(titles);
}

export function hasSelectedItem()
{
    let itm = get(contextItemsStore).props
    return itm !== null && itm !== undefined;
}

export function hasDataItem()
{
    let itm = get(contextItemsStore).data
    return itm !== null && itm !== undefined;
}

export function reloadMainContentPage()
{
    let val = get(mainContentPageReloader);
    val += 1;
    mainContentPageReloader.set(val);
}

export function reloadWholeApp()
{
    let val = get(wholeAppReloader);
    val += 1;
    wholeAppReloader.set(val);
}

export function reloadVisibleTags()
{
    let val = get(tagsReloader);
    val += 1;
    tagsReloader.set(val);
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
export const sidebar_left_pos = writable(0)

let has_saved_tools_visible = false;
function create_tools_visible_store()
{
    if(localStorage.tools_visible_store !== undefined)
        has_saved_tools_visible = true;
    else
        has_saved_tools_visible = false;

    return writable ((localStorage.tools_visible_store && localStorage.tools_visible_store == 'true') || false);
}

export const tools_visible_store = create_tools_visible_store();
tools_visible_store.subscribe( (value) => { localStorage.tools_visible_store = (value ? 'true' : '') } );

export function set_default_tools_visible(value, force)
{
    if((!has_saved_tools_visible) || force)
        tools_visible_store.set(value)
}

export const bottom_bar_visible_store = writable( (localStorage.bottom_bar_visible_store && localStorage.bottom_bar_visible_store == 'true') || false);
bottom_bar_visible_store.subscribe( (value) => { localStorage.bottom_bar_visible_store = (value ? 'true' : '') } );

export const right_sidebar_visible_store = writable(false)
export const visible_property_tab_store = writable('');

export const fabCollapsed = writable( (localStorage.fabCollapsed && localStorage.fabCollapsed == 'true') || false )
fabCollapsed.subscribe( (value) => { localStorage.fabCollapsed = (value ? 'true' : '') } );

export const showFABAlways = writable( (localStorage.showFABAlways && localStorage.showFABAlways == 'true') || false )
showFABAlways.subscribe( (value) => { localStorage.showFABAlways = (value ? 'true' : '') } );

export const leftHandedFAB = writable( (localStorage.leftHandedFAB && localStorage.leftHandedFAB == 'true') || false )
leftHandedFAB.subscribe( (value) => { localStorage.leftHandedFAB = (value ? 'true' : '') } );

export function restore_defults()
{
    
    main_sidebar_visible_store.set('*');
    tools_visible_store.set(false);
    bottom_bar_visible_store.set(false);
    right_sidebar_visible_store.set(false);
    visible_property_tab_store.set('');
    fabCollapsed.set(false)
    showFABAlways.set(false)
    leftHandedFAB.set(false)
}

export function toggle_sidebar(index)
{
    const prevVisile = get(main_sidebar_visible_store);
    if(prevVisile != '*')
        previously_visible_sidebar = prevVisile;

    //console.log('toggle_sidebar', previously_visible_sidebar, '=>', index)

    if(get(main_sidebar_visible_store) == index)
        main_sidebar_visible_store.set('*')
    else
        main_sidebar_visible_store.set(index)
}

export function auto_hide_sidebar()
{
    
    //console.log('auto_hide_sidebar')
    //console.log("sw: " + window.innerWidth, SCREEN_SIZES.lg)
    if(window.innerWidth < SCREEN_SIZES.lg)
        hide_sidebar()
}

export function hide_sidebar()
{
    
    const prevVisile = get(main_sidebar_visible_store);
    if(prevVisile != '*')
        previously_visible_sidebar = prevVisile;

    main_sidebar_visible_store.set('*')
    //console.log("auto_hide_sidebar:" + get(main_sidebar_visible_store))
}

export function show_sidebar(index)
{
    const prevVisile = get(main_sidebar_visible_store);
    if(prevVisile != '*')
        previously_visible_sidebar = prevVisile;

    main_sidebar_visible_store.set(index)
}

export const navKey = derived([main_sidebar_visible_store, location], ([$main_sidebar_visible_store, $location]) => navGetKey() )