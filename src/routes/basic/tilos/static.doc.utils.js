import {writable} from 'svelte/store';

export const book_store = writable(null);
export const popup_visible_store = writable('');
export const tools_right_store = writable(false);

export let screen = {
    width: 0
};

export async function fetch_book(name, scope)
{
    let path = `/${scope}/${name}.json`
    
    try
    {
        const res = await fetch(path);
        if(res.ok)
        {
            let jsonres = await res.json();
            return jsonres.Book;
        }
        else
        {
            console.error(`can't load toc from ${path}`)
            return null;
        }
    }
    catch(err)
    {
        console.error(err);
        return null;
    }
}


let visible_popup_index = 'A'

export function toggle_popup(index)
    {
        if(visible_popup_index == index)
        {
            popup_visible_store.set('*')
            visible_popup_index = '*'
        }
        else
        {
            popup_visible_store.set(index)
            visible_popup_index = index
        }
    }

export function hide_popup()
{
    if( visible_popup_index == '+')
    {
        popup_visible_store.set('-')
        visible_popup_index = '-'
    }
    else
    {
        popup_visible_store.set('+')
        visible_popup_index = '+'
    }
    console.log("hide_popup:" + visible_popup_index)
}

export function show_popup(index)
{
    popup_visible_store.set(index)
    visible_popup_index = index
}