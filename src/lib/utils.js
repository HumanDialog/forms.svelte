import { getContext, tick } from "svelte";
import {get} from 'svelte/store'
import { context_items_store, context_toolbar_operations, data_tick_store } from "./stores";

export let icons = {symbols :null}

export const SCREEN_SIZES = {
    sm: 640, //px	@media (min-width: 640px) { ... }
    md: 768, //px	@media (min-width: 768px) { ... }
    lg: 1024, //px	@media (min-width: 1024px) { ... }
    xl: 1280, //px	@media (min-width: 1280px) { ... }
}

export function is_device_smaller_than(br)
{
    return window.innerWidth < SCREEN_SIZES[br]
}

//export const chnages = {
//    just_changed_context: false
//}

export function select_item(itm)
{
    let data_context = get(context_items_store);
    data_context['sel'] = itm;
    data_context.focused = 'sel';
    context_items_store.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

}

export function activate_item(context_level, itm, operations=null)
{
    let data_context = get(context_items_store);
    data_context['sel'] = itm; //null;
    data_context[context_level] = itm;
    data_context.focused = context_level;
    context_items_store.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

    if(operations && Array.isArray(operations))
        context_toolbar_operations.set( [...operations] )
}

export function clear_active_item(context_level)
{
    let data_context = get(context_items_store);
    data_context[context_level] = null;
    data_context.focused = context_level;
    context_items_store.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

    context_toolbar_operations.set( [] )
}

export function is_selected(itm)
{
    let data_context = get(context_items_store);
    if(!!data_context && !!data_context['sel'] && data_context['sel'] == itm)
        return true;
    else
        return false;
}


export function is_active(context_level, itm)
{
    let data_context = get(context_items_store);
    if(data_context != undefined && data_context[context_level] != undefined && data_context[context_level] == itm)
        return true;
    else
        return false;
}

export function get_active(context_level)
{
    let data_context = get(context_items_store);
    if(data_context != undefined)
        return data_context[context_level]
    else
        return null;
}

export function editable(node, action)
{
    const org_text = node.textContent;
    const blur_listener = async (e) =>
    {
        let cancel = !node.textContent
        await finish_editing(cancel, false);
    }

    const key_listener = async (e) =>
    {
        switch(e.key)
        {
        case 'Esc':
        case 'Escape':
            await finish_editing(true, false);
            e.stopPropagation();
            e.preventDefault();
            break;

        case 'Enter':
            await finish_editing(false, true);
            e.stopPropagation();
            e.preventDefault();
            break;
        }
    }

    const finish_editing = async (cancel, incremental) =>
    {
        node.removeEventListener("blur", blur_listener);
        node.removeEventListener("keydown", key_listener);
        node.contentEditable = "false"

        let sel = window.getSelection();
        sel.removeAllRanges();

        //console.log('cell_content', node.textContent)
        
        if(cancel)
        {
            node.innerHTML = org_text;
        }
        else if(action)
        {
            await action(node.textContent)
        }

        const finish_event  = new CustomEvent("finish", {
                                detail: 
                                { 
                                    cancel: cancel, 
                                    incremental: incremental
                                }
                            });

        node.dispatchEvent(finish_event);
        node.removeEventListener("finish", (e) => {});
    }

    const edit_listener = async (e) =>
    {
        node.contentEditable = "true"
        node.addEventListener("blur", blur_listener);
        node.addEventListener("keydown", key_listener);

        node.focus();

        await tick();
        let range = document.createRange();
        range.selectNodeContents(node);
        let end_offset = range.endOffset;
        let end_container = range.endContainer;
        range.setStart(end_container, end_offset)
        range.setEnd(end_container, end_offset)
        //range.setStart(node, 0)
        //range.setEnd(node, 0)
       // console.log('range rect: ', range.getBoundingClientRect())
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        
    }

    node.addEventListener("edit", edit_listener);
    node.classList.add("editable")
    node.classList.add("focus:outline-none")
    return {
        destroy() {
            node.removeEventListener("edit", edit_listener)
            node.classList.remove("editable")
            node.contentEditable = "false"
        }};
}

export function start_editing(element, finish_callback)
{
    let editable_node = null;
    
    if(element.classList.contains("editable"))
        editable_node = element;
    else
    {
        let editables = element.getElementsByClassName("editable");
        if(editables && editables.length > 0)
            editable_node = editables[0];
    }

    if(editable_node)
    {
        if(editable_node.contentEditable == "true")
            return;
        
        if(finish_callback)
        {
            editable_node.addEventListener("finish", (e) => { finish_callback(e.detail) })
        }

        const edit_event = new Event("edit")
        editable_node.dispatchEvent(edit_event)
    }
}

export function selectable(node, itm)
{
    const select_listener = (e) =>
    {
        select_item(itm);
    }

    node.setAttribute("selectable", "true")
    node.addEventListener("select", select_listener);

    return {
    destroy() {
        node.removeEventListener("select", select_listener)
        try{
            node.removeAttribute("selectable")
        }
        catch(err)
        {
            console.error(err, node);
        }
    }};
}

export function handle_select(e)
{
    let node = e.target;
    if(!node)
    {
        select_item(null);
        return;
    }

    let selection_node = null;
    
    while(!!node)
    {
        if(node.hasAttribute("selectable"))
        {
            selection_node = node;
            break;
        }

        node = node.parentElement;
    }

    if(selection_node)
        selection_node.dispatchEvent(new Event("select"))
    else
        select_item(null);
}



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