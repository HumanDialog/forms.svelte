import Menu from './contextmenu.svelte'
import Floating_container from './Floating_container.svelte'
import Grid from './Grid.menu.svelte'

let menu_comopnent :Menu|null = null;
let toolbar_component :Floating_container|null = null;

export function show_menu(around :DOMRect|DOMPoint, operations)
{
    let menu_element =  document.getElementById("__hd_svelte_contextmenu");
    if(!menu_element)
    {
        let app_div = document.getElementById("__hd_svelte_layout_root")
        menu_comopnent = new Menu({
            target: app_div,
            props: {
                
            }
        });
        
        menu_comopnent.show(around, operations);
    }
    else if(menu_comopnent)
    {
        if(menu_comopnent.is_visible())
            menu_comopnent.hide();
        else
            menu_comopnent.show(around, operations);
    }
    else
        console.error('what now?')

}

export function hide_whole_context_menu()
{
    if(menu_comopnent)
    {
        if(menu_comopnent.is_visible())
            menu_comopnent.hide();
    }
}

export function show_floating_toolbar(around :DOMRect|DOMPoint, toolbar, props = {})
{
    let floating_container =  document.getElementById("__hd_svelte_floating_container");
    if(!floating_container)
    {
        let app_div = document.getElementById("__hd_svelte_layout_root")
        toolbar_component = new Floating_container({
            target: app_div,
            props: {
                
            }
        });
        
        toolbar_component.show(around, toolbar, props);
    }
    else if(toolbar_component)
    {
        //if(toolbar_component.is_visible())
        //{
        //    toolbar_component.hide();
        //}
        //else
        //{
            toolbar_component.show(around, toolbar, props);
        //}
    }
    else
        console.error('what now?')
}

export function show_grid_menu(around :DOMRect|DOMPoint, operations)
{
    show_floating_toolbar(around, Grid, {operations: operations})
}