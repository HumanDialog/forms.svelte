import Menu from './contextmenu.svelte'

let menu_comopnent :Menu|null = null;

export function show_menu(x :number, y :number, operations)
{
    let menu_element =  document.getElementById("__hd_svelte_contextmenu");
    if(!menu_element)
    {
        menu_comopnent = new Menu({
            target: document.body,
            props: {
                
            }
        });
        
        menu_comopnent.show(x, y, operations);
    }
    else if(menu_comopnent)
        menu_comopnent.show(x, y, operations);
    else
        console.error('what now?')

}