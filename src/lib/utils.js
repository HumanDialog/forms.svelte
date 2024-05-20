import { getContext, tick } from "svelte";
import {get} from 'svelte/store'
import { contextItemsStore, contextToolbarOperations, data_tick_store } from "./stores";

export let icons = {symbols :null}

export const SCREEN_SIZES = {
    sm: 640, //px	@media (min-width: 640px) { ... }
    md: 768, //px	@media (min-width: 768px) { ... }
    lg: 1024, //px	@media (min-width: 1024px) { ... }
    xl: 1280, //px	@media (min-width: 1280px) { ... }
}

export function isDeviceSmallerThan(br)
{
    return window.innerWidth < SCREEN_SIZES[br]
}

//export const chnages = {
//    just_changed_context: false
//}

export function selectItem(itm)
{
    let data_context = get(contextItemsStore);
    data_context['sel'] = itm;
    data_context.focused = 'sel';
    contextItemsStore.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

}

export function activateItem(context_level, itm, operations=null)
{
    let data_context = get(contextItemsStore);
    data_context['sel'] = itm; //null;
    data_context[context_level] = itm;
    data_context.focused = context_level;
    contextItemsStore.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

    if(operations && Array.isArray(operations))
        contextToolbarOperations.set( [...operations] )
}

export function clearActiveItem(context_level)
{
    let data_context = get(contextItemsStore);
    data_context[context_level] = null;
    data_context.focused = context_level;
    contextItemsStore.set( {...data_context} )

    let ticket = get(data_tick_store)
    ticket++;
    data_tick_store.set(ticket)

    //chnages.just_changed_context = true;

    contextToolbarOperations.set( [] )
}

export function isSelected(itm)
{
    let data_context = get(contextItemsStore);
    if(!!data_context && !!data_context['sel'] && data_context['sel'] == itm)
        return true;
    else
        return false;
}


export function isActive(context_level, itm)
{
    let data_context = get(contextItemsStore);
    if(data_context != undefined && data_context[context_level] != undefined && data_context[context_level] == itm)
        return true;
    else
        return false;
}

export function getActive(context_level)
{
    let data_context = get(contextItemsStore);
    if(data_context != undefined)
        return data_context[context_level]
    else
        return null;
}

export let currentEditable = null;

export function editable(node, params)
{
    let action;
    let active = false;
    let onRemove = undefined;
    let onFinish = undefined;
    if(params instanceof Object)
    {
        action = params.action ?? params;
        active = params.active ?? false;
        onRemove = params.remove ?? undefined
        onFinish = params.onFinish ?? undefined

        if(params.readonly)
            return;
    }
    else
        action = params;

    let observer = null;
    let has_changed = false;

    const org_text = node.textContent;
    const blur_listener = async (e) =>
    {
        if(currentEditable == node)
            currentEditable = null;

        let cancel = !node.textContent
        if(observer)
            observer.disconnect();

        await finish_editing(cancel, false);
    }

    const key_listener = async (e) =>
    {
        //e.ctrlKey
        switch(e.key)
        {
        case 'Esc':
        case 'Escape':
            if(!active)
            {
                e.stopPropagation();
                e.preventDefault();

                await finish_editing(true, false);
            }
            break;

        case 'Enter':
            e.stopPropagation();
            e.preventDefault();

            await finish_editing(false, true);
            break;

        case 'Backspace':
            if(onRemove && node.textContent.length == 0)
            {
                e.stopPropagation();
                e.preventDefault();
                //await finish_editing(false, false);
                onRemove();
            }
            break;
         }
    }

    const finish_editing = async (cancel, incremental) =>
    {
       if(!active)
       {
            node.removeEventListener("blur", blur_listener);
            node.removeEventListener("keydown", key_listener);
            node.removeEventListener("save", save_listener);
            node.contentEditable = "false"
       
            let sel = window.getSelection();
            sel.removeAllRanges();
       }

        if(cancel)
        {
            node.innerHTML = org_text;
        }
        else if(action)
        {
            if(active)
            {
                if(has_changed)
                    await action(node.textContent)
            }
            else
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

        if(!active)
            node.removeEventListener("finish", (e) => {});
    }

    const save_listener = async (e) =>
    {
        if(has_changed)
            await action(node.textContent)
    }

    const edit_listener = async (e) =>
    {
        node.contentEditable = "true"
        node.addEventListener("blur", blur_listener);
        node.addEventListener("keydown", key_listener);
        
        currentEditable = node;
        node.addEventListener("save", save_listener)

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

    const focus_listener = async (e) =>
    {
        node.addEventListener("blur", blur_listener);
        node.addEventListener("keydown", key_listener);
        has_changed = false;
        currentEditable = node;
        node.addEventListener("save", save_listener)
        
        observer = new MutationObserver(() => { has_changed = true; });
        observer.observe(   node,  {
                                childList: true,
                                attributes: true,
                                characterData: true,
                                subtree: true } );
    }

    node.classList.add("editable")
    node.classList.add("focus:outline-none")

    if(active)
    {
        node.contentEditable = "true"
        node.addEventListener('focus', focus_listener);

        if(onFinish)
        {
            node.addEventListener("finish", (e) => { onFinish(e.detail) })
        }
    }
    else
    {
        node.addEventListener("edit", edit_listener);
        
        return {
            destroy() {
                node.removeEventListener("edit", edit_listener)
                node.classList.remove("editable")
                node.contentEditable = "false"
            }};
    }
}

export function startEditing(element, finish_callback)
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

export function saveCurrentEditable()
{
    if(currentEditable)
        currentEditable.dispatchEvent(new Event("save"))
}

export function selectable(node, itm)
{
    const select_listener = (e) =>
    {
        selectItem(itm);
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

export function handleSelect(e)
{
    let node = e.target;
    if(!node)
    {
        selectItem(null);
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
        selectItem(null);
}



export function parseWidthDirective(c)
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

export function shouldBeComapact()
{
    let is_in_table = getContext('rTable-definition');
    return !!is_in_table;
}

    

export function insertAt(array, index, element)
{
    array.splice(index, 0, element);
    return array;
}

export function insertAfter(array, after, element)
{
    let after_idx = array.findIndex((t) => t == after);

    if(after_idx == array.length - 1)
    {
        array.push(element)
        return array;
    }
    else
    {
        return insertAt(array, after_idx+1, element)
    }
}

export function getPrev(array, element)
{
    let idx = array.findIndex((t) => t == element);
    if(idx < 1)
        return null;
    else
        return array[idx-1];
}

export function getNext(array, element)
{
    let idx = array.findIndex((t) => t == element);
    if(idx >= array.length-1)
        return null;
    else
        return array[idx+1];
}

export function getFirst(array)
{
    if(array.length > 0)
        return array[0];
    else
        return null;
}

export function getLast(array)
{
    if(array.length > 0)
        return array[array.length-1];
    else
        return null;
}

export function removeAt(array, index)
{
    array.splice(index, 1)
    return array;
}

export function remove(array, element)
{
    let idx = array.findIndex((t) => t == element);
    return removeAt(array, idx);
}

export function swapElements(array, e1, e2)
{
    let idx1 = array.findIndex((t) => t == e1);
    let idx2 = array.findIndex((t) => t == e2);

    array[idx1] = e2;
    array[idx2] = e1;

    return array;
}
