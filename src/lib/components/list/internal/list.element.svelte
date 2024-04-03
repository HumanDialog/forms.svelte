<script lang="ts">
    import {tick, getContext} from 'svelte'
    import {context_items_store} from '../../../stores'
    import {
            is_selected, 
            selectable, 
            activate_item, 
            is_active, 
            editable, 
            start_editing, 
    } from '../../../utils'

    import {show_grid_menu, show_menu} from '../../menu'
    import {push_changes, inform_modification} from '../../../updates'
    import Summary from './list.element.summary.svelte'
    import Properties from './list.element.props.svelte'
    import { is_device_smaller_than } from '../../../utils'
                
    import {rList_definition, rList_property_type} from '../List'
	import { push } from 'svelte-spa-router';
    
    export let item     :object;

    export let title    :string = '';
    export let summary  :string = '';
    
    export let typename :string | undefined = undefined;
    export let toolbar_operations;
    export let context_menu;

    let definition :rList_definition = getContext("rList-definition");
    //console.log(definition.properties, item)

    let placeholder :string = '';
    let props_sm;
    let props_md;
    
    $: is_row_active = calculate_active(item, $context_items_store)
    $: is_row_selected = selected(item, $context_items_store)

    $: selected_class = is_row_selected ? "!border-blue-300" : "";
    $: focused_class = is_row_active ? "bg-stone-200 dark:bg-stone-700" : "";
    $: is_link_like = is_row_selected && (!!definition.title_href || !!definition.title_href_func)

    if(!typename)
    {
        if(item.$type)
            typename = item.$type;
        else if(item.$ref)
        {
            let s = item.$ref.split('/')
            typename = s[1];
        }
    }

    let item_key :string = ''
    let keys = Object.keys(item);
    if(keys.includes('Id'))
        item_key = 'Id'
    else if(keys.includes('$ref'))
        item_key = '$ref';
    else if(keys.length > 0)
        item_key = keys[0];


    if(!title)
        title = definition.title;


    if(!summary)
        summary = definition.summary;
            

    function calculate_active(...args)
    {
        return is_active('props', item)
    }

    function selected(...args)
    {
        return is_selected(item)
    }

    
    async function change_name(text)
    {
        if(definition.on_title_changed)
        {
            definition.on_title_changed(item, text, title)
        }
        else
        {
            item[title] = text;
            inform_modification(item, title, typename);
            push_changes();
        }
    }

    async function change_summary(text)
    {
        if(definition.on_summary_changed)
        {
            definition.on_summary_changed(item, text, summary);
        }
        else
        {
            item[summary] = text;
            inform_modification(item, summary, typename);
            push_changes();
        }
    }

    function edit(e)
    {
        if(!is_row_active)
            return;

        start_editing(e.target);
    }

    export function activate()
    {
        activate_row(null, item);
    }

    function on_active_row_clicked(e, part)
    {
        if(!is_row_active)
            return;

        let click_on_empty_space = true;
        let n = e.target;

        while(n)
        {
            let is_in_cell = n.getAttribute("role") == "gridcell"
            if(is_in_cell)
            {
                click_on_empty_space = false;
                break;
            }

            n = n.parentElement;
        }

        //temporary disable
        let can_show_context_menu = click_on_empty_space;
        can_show_context_menu = false;

        if(can_show_context_menu && context_menu)
        {
            const pt = new DOMPoint(e.clientX, e.clientY)

            let context_operations = context_menu(item);
            if(context_operations !== null)
            {
                if(typeof context_operations === 'object')
                {
                    if(Array.isArray(context_operations))
                        show_menu(pt, context_operations);
                    else if(context_operations.grid)
                        show_grid_menu(pt, context_operations.grid); 
                }
            }
        }
        else if(click_on_empty_space)
        {
            if(definition.title_href || definition.title_href_func)
            {
                let link: string = '';
                if(definition.title_href)
                    link = definition.title_href;
                else if(definition.title_href_func)
                    link = definition.title_href_func(item);

                if(link)
                    push(link);
            }
            else
            {
                if((part == 'top') && !definition.title_readonly)
                    force_editing('Title')
                else if((part == 'bottom') && !definition.summary_readonly)
                    force_editing('Summary')
            }
        }
        else
        {
            /*if((part == 'top') && !definition.title_readonly)
                force_editing('Title')
            else if((part == 'bottom') && !definition.summary_readonly)
                force_editing('Summary')
            */
        }
    }

    function activate_row(e, item)
    {
        activate_item('props', item, toolbar_operations(item));
        
        if(e)
            e.stopPropagation();
    }

    



    function on_contextmenu(e)
    {
        if(!context_menu)
            return;

        const pt = new DOMPoint(e.clientX, e.clientY)

        let context_operations = context_menu(item);
        if(context_operations !== null)
        {
            if(typeof context_operations === 'object')
            {
                if(Array.isArray(context_operations))
                    show_menu(pt, context_operations);
                else if(context_operations.grid)
                    show_grid_menu(pt, context_operations.grid); 
            }
        }
        
        e.preventDefault();
    }

    

    export function edit_property(field :string)
    {
        if(field == title)
            force_editing('Title')
        else if(field == summary)
            force_editing('Summary')
        else
        {
            if(is_device_smaller_than("sm"))
                props_sm.edit_property(field);
            else
                props_md.edit_property(field);
        }
    }

    async function force_editing(field :string)
    {
        let element_id = `__hd_list_ctrl_${item[item_key]}_${field}`;
        let element_node = document.getElementById(element_id);
        if(!element_node)
        {
            placeholder = field;
            await tick();

            element_node = document.getElementById(element_id);
            if(!element_node)
                return;
        }

        if(!element_node.classList.contains("editable"))
        {
            return; //todo
        }

        start_editing(element_node, () => { placeholder='' });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if item}
{@const element_title = item[title]}

<section    class="mt-3 flex flex-row my-0  w-full text-sm text-stone-700 dark:text-stone-300 cursor-default rounded-md border border-transparent {selected_class} {focused_class}"
            on:contextmenu={on_contextmenu}
            role="menu"
            tabindex="-1">

    <slot name="left" element={item}/>
    
    <div    class="ml-3 w-full py-1" 
            class:sm:hover:cursor-pointer={is_link_like}
            use:selectable={item} 
            on:click={(e) => {activate_row(e, item)}} 
            role="row" 
            tabindex="0">
        <div class="block sm:flex sm:flex-row" on:click={(e) => on_active_row_clicked(e, 'top')}>
           
            {#if definition.title_readonly}
                <p  class=" text-lg font-semibold min-h-[1.75rem]
                            sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                            whitespace-nowrap overflow-clip w-full sm:flex-none sm:w-2/3"
                    id="__hd_list_ctrl_{item[item_key]}_Title"> 
                    {element_title}
                </p>
            {:else}
                {#key item[title]} <!-- Wymusza pełne wyrenderowanie zwłasza po zmiane z pustego na tekst  -->
                    <p  class=" text-lg font-semibold min-h-[1.75rem]
                                sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                                whitespace-nowrap overflow-clip w-full sm:flex-none sm:w-2/3"
                        id="__hd_list_ctrl_{item[item_key]}_Title"
                        use:editable={(text) => {change_name(text)}}
                        on:click={edit}> 
                            {element_title}
                    </p>
                {/key}
            {/if}
           

            <section class="hidden sm:block w-full sm:flex-none sm:w-1/3">
                <Properties {definition} {item} {placeholder} bind:this={props_md}/>
            </section>
        </div>

        {#if summary && (item[summary] || placeholder=='Summary')}
            {@const element_id = `__hd_list_ctrl_${item[item_key]}_Summary`}
            <Summary
                    id={element_id}
                    on:click={(e) => on_active_row_clicked(e, 'bottom')}
                    text={item[summary]}
                    readonly={definition.summary_readonly}
                    placeholder={placeholder == 'Summary'}
                    editable={(text) => {change_summary(text)}}
                    click_edit={edit}
                />
        {/if}

        <section class="block sm:hidden w-full sm:flex-none sm:w-2/3">
            <Properties {definition} {item} {placeholder} bind:this={props_sm}/>
        </section>

    </div>
</section>
{/if}

<style>
    .grid-1
    {
        display: grid;
        grid-template-columns: 100%;
    }

    .grid-2
    {
        display: grid;
        grid-template-columns: 50% 50%;
    }

    .grid-3
    {
        display: grid;
        grid-template-columns: 33% 33% 33%;
    }

    .grid-4
    {
        display: grid;
        grid-template-columns: 25% 25% 25% 25%;
    }

</style>