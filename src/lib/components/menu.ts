import Menu from './contextmenu.svelte'
import Floating_container from './Floating_container.svelte'
import Grid from './Grid.menu.svelte'

let menu_comopnent :Menu|null = null;
let toolbar_component :Floating_container|null = null;

export const SHOW_MENU_BELOW = 0
export const SHOW_MENU_ABOVE = 1
export const SHOW_MENU_RIGHT = 2
export const SHOW_MENU_LEFT = 3

export function showMenu(around :DOMRect|DOMPoint, operations, preference :number = SHOW_MENU_BELOW)
{
    let menu_element =  document.getElementById("__hd_svelte_contextmenu");
    if(!menu_element)
    {
        let app_div = document.getElementById("__hd_svelte_layout_root")
        if(!app_div)
            app_div = document.getElementById("app")
        
        menu_comopnent = new Menu({
            target: app_div,
            props: {
                
            }
        });
        
        menu_comopnent.show(around, operations, preference);
    }
    else if(menu_comopnent)
    {
        if(menu_comopnent.isVisible())
            menu_comopnent.hide();
        else
            menu_comopnent.show(around, operations, preference);
    }
    else
        console.error('what now?')

}

export function hideWholeContextMenu()
{
    if(menu_comopnent)
    {
        if(menu_comopnent.isVisible())
            menu_comopnent.hide();
    }
}

export function showFloatingToolbar(around :DOMRect|DOMPoint, toolbar, props = {})
{
    let floating_container =  document.getElementById("__hd_svelte_floating_container");
    if(!floating_container)
    {
        let app_div = document.getElementById("__hd_svelte_layout_root")
        if(!app_div)
            app_div = document.getElementById("app")
        
        toolbar_component = new Floating_container({
            target: app_div,
            props: {
                
            }
        });
        
        toolbar_component.show(around, toolbar, props);
    }
    else if(toolbar_component)
    {
        if(toolbar_component.isVisible() && toolbar_component.isSameToolbar(toolbar))
        {
            toolbar_component.hide();
        }
        else
        {
            toolbar_component.show(around, toolbar, props);
        }
    }
    else
        console.error('what now?')

    return toolbar_component;
}

export function hideFloatingToolbar()
{
    if(toolbar_component)
    {
        if(toolbar_component.isVisible())
            toolbar_component.hide();
    }
}

export function showGridMenu(around :DOMRect|DOMPoint, operations)
{
    showFloatingToolbar(around, Grid, {operations: operations})
}