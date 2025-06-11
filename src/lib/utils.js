import { getContext, tick } from "svelte";
import {get} from 'svelte/store'
import { contextItemsStore, contextToolbarOperations, pageToolbarOperations, data_tick_store } from "./stores";
import {location, push, pop} from 'svelte-spa-router' 

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

    const prevSel = data_context['sel'];
    if(prevSel === itm)
        return;

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

    if(operations)
    { 
        if(Array.isArray(operations))
            contextToolbarOperations.set( [...operations] )
        else
            contextToolbarOperations.set( {...operations} )
    }
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

export function refreshToolbarOperations()
{
    
    let refreshed = false

    const contextOperations = get(contextToolbarOperations)
    if(contextOperations)
    {
        
        if(Array.isArray(contextOperations))
        {
            if(contextOperations.length > 0)
            {
                contextToolbarOperations.set([...contextOperations])
                refreshed = true
            }
        }
        else
        {
            if(contextOperations.operations && contextOperations.operations.length > 0)
            {
                contextToolbarOperations.set({...contextOperations})
                refreshed = true
            }
        }
    }
    
    if(!refreshed)
    {
        const pageOperations = get(pageToolbarOperations);
        if(pageOperations)
        {
            if(Array.isArray(pageOperations))
            {
                if(pageOperations.length > 0)
                {
                    pageToolbarOperations.set([...pageOperations])
                    refreshed = true
                }
            }
            else
            {
                if(pageOperations.operations && pageOperations.operations.length > 0)
                {
                    pageToolbarOperations.set({...pageOperations})
                    refreshed = true
                }
            }
        }

    }
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
    let onSoftEnter = undefined;
    let onSingleChange = undefined
    if(params instanceof Object)
    {
        action = params.action ?? params;
        active = params.active ?? false;
        onRemove = params.remove ?? undefined
        onFinish = params.onFinish ?? undefined
        onSoftEnter = params.onSoftEnter ?? undefined;
        onSingleChange = params.onSingleChange ?? undefined
       
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

        await finish_editing({cancel: cancel});
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

                await finish_editing({ cancel: true });
            }
            break;

        case 'Enter':
            e.stopPropagation();
            e.preventDefault();
            
            if(e.shiftKey && onSoftEnter)
                await finish_editing({ softEnter: true});
            else
                await finish_editing({ incremental: true});
            break;

        case 'Backspace':
            if(onRemove && node.textContent.length == 0)
            {
                e.stopPropagation();
                e.preventDefault();
                onRemove();
            }
            break;
         }
    }

    //const finish_editing = async (softEnter, cancel, incremental) =>
        const finish_editing = async (params) =>
    {
        const softEnter = params.softEnter ?? false;
        const cancel = params.cancel ?? false;
        const incremental = params.incremental ?? false;

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
        else if(softEnter)
        {
            onSoftEnter(node.textContent)
        }
        else if(action)
        {
            if(active)
            {
                if(has_changed)
                {
                    has_changed = false;
                    await action(node.textContent)
                }
                    
            }
            else
                await action(node.textContent)
        }

        const finish_event  = new CustomEvent("finish", {
                                detail: 
                                { 
                                    cancel: cancel, 
                                    incremental: incremental,
                                    softEnter: softEnter
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
        
        observer = new MutationObserver(() => { 
            has_changed = true; 
            if(onSingleChange)
                onSingleChange(node.textContent)
        });

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


export async function resizeImage(file, maxWidth=1024, maxHeight=1024, contentType='', quality=0.95)
{
    if(!contentType)
        contentType = file.type

    if(!contentType)
        contentType = 'image/png'

    const calculateSize = (img, maxWidth, maxHeight) => {
        let w = img.width,
            h = img.height;
        if (w > h) {
          if (w > maxWidth) {
            h = Math.round((h * maxWidth) / w);
            w = maxWidth;
          }
        } else {
          if (h > maxHeight) {
            w = Math.round((w * maxHeight) / h);
            h = maxHeight;
          }
        }
        return [w, h];
      };

    return new Promise((resolve) => {

        const img = new Image();
        img.onerror = function () {
            URL.revokeObjectURL(this.src)
        }

        img.onload = function () {
            URL.revokeObjectURL(this.src)
            const [newWidth, newHeight] = calculateSize(img, maxWidth, maxHeight);

            console.log('resizeImage', img.width, '=>', newWidth, img.height, '=>', newHeight, contentType, quality)
            
            const canvas = document.createElement("canvas");
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
    
            canvas.toBlob((blob) => {
                resolve(blob);
              },
    
              contentType,
              quality)
       
        }

        img.src = URL.createObjectURL(file);

    }) 
}

export function isOnScreenKeyboardVisible()
{
    if(!isDeviceSmallerThan('sm'))       // are we on mobile?
        return false;

    const sel = window.getSelection();
    // if we have active selections then it's very possible we have onscreen keyboard visible, se we need to shrink window.innerHeight 
    if(sel && sel.rangeCount>0 && sel.focusNode /*&& sel.focusNode.nodeType==sel.focusNode.TEXT_NODE*/) // TipTap fix: when cursor blinks at begining of line it's not TEXT_NODE. ProseMirror handles it as special case
    {
        const el = sel.focusNode.parentElement;
        if(el && (el.isContentEditable || el.contentEditable == 'true' || el.tagName == 'INPUT'))
            return true;
    }

    return false;
}

export const UI = {
    operations: null,
    fab: null,
    navigator: null
}

export const NAVIGATION_PAGE_PATH = '/'
export function isOnNavigationPage()
{
    const loc = get(location)
    if(loc == NAVIGATION_PAGE_PATH)
        return true;
    else
        return false;
}

export function pushNavigationPage()
{
    push(NAVIGATION_PAGE_PATH)
}

export function popNavigationPage()
{
    if(isOnNavigationPage())
        pop();
}

export function dec2hex (dec) 
{
    return dec.toString(16).padStart(2, "0")
}
  

export function randomString(len) 
{
    var arr = new Uint8Array((len || 16) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}