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
    import Combo from '../../combo/combo.svelte'
    import DatePicker from '../../date.svelte'
                
    import {rList_definition, rList_property_type} from '../List'
    
    export let item     :object;

    export let title    :string = '';
    export let summary  :string = '';
    
    export let typename :string | undefined = undefined;
    export let toolbar_operations;
    export let context_menu;

    let definition :rList_definition = getContext("rList-definition");
    //console.log(definition.properties, item)

    let placeholder :string = '';
    let props = []
    
    $: is_row_active = calculate_active(item, $context_items_store)
    $: is_row_selected = selected(item, $context_items_store)

    $: selected_class = is_row_selected ? "!border-blue-300" : "";
    $: focused_class = is_row_active ? "bg-gray-200 dark:bg-gray-700" : "";

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

    function edit_row_property(e, part)
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
            if((part == 'top') && !definition.title_readonly)
                force_editing('Title')
            else if((part == 'bottom') && !definition.summary_readonly)
                force_editing('Summary')
        }
    }

    function activate_row(e, item)
    {
        if(is_row_active)
        {
            
        }

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

    function on_date_changed(value, a)
    {
        if(!value)
            item[a] = "";    
        else
            item[a] = value.toJSON();
    }

    function on_combo_changed(key, name, prop)
    {
        if(prop.association)
        {
            let iname = prop.combo_definition.element_name ?? '$display'
            item[prop.a] = {
                $ref: key,
                [iname]: name
            }
        }
        else
        {
            let value = key ?? name;
            item[prop.a] = value
        }
    }

    export function edit_property(field :string)
    {
        if(field == title)
            force_editing('Title')
        else if(field == summary)
            force_editing('Summary')
        else
        {
            let prop_idx = definition.properties.findIndex( p => p.name == field)
            if(prop_idx < 0)
                return;

            let property = definition.properties[prop_idx];
            switch(property.type)
            {
            case rList_property_type.Date:
                edit_date(field, prop_idx);
                break;

            case rList_property_type.Combo:
                edit_combo(field, prop_idx);
                break;
            }
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

    async function edit_combo(field :string, prop_idx :number)
    {
        let combo = props[prop_idx];

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = props[prop_idx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }

    async function edit_date(field :string, prop_idx :number)
    {
        let combo = props[prop_idx];

        if(!!combo)
            combo.show();
        else
        {
            placeholder = field;
            await tick();
            combo = props[prop_idx];
            if(!!combo)
                combo.show(undefined, () => {placeholder = ''});
        }
    }


</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if item}
{@const element_title = item[title]}

<section    class="flex flex-row my-0  w-full text-sm text-slate-700 dark:text-slate-400 cursor-default rounded-md border border-transparent {selected_class} {focused_class}"
            on:contextmenu={on_contextmenu}
            role="menu"
            tabindex="-1">

    <slot name="left" element={item}/>
    
    <div class="ml-3 w-full py-1" use:selectable={item} on:click={(e) => {activate_row(e, item)}} role="row" tabindex="0">
        <div class="flex flex-row" on:click={(e) => edit_row_property(e, 'top')}>
            <p  class=" text-lg font-semibold min-h-[1.75rem]
                        sm:text-sm sm:font-semibold sm:min-h-[1.25rem]
                        whitespace-nowrap overflow-clip flex-none w-1/2 sm:w-1/3">
                {#if definition.title_readonly}
                <span  id="__hd_list_ctrl_{item[item_key]}_Title" role="gridcell" tabindex="0"> 
                    {element_title}
                </span>
                {:else}
                    {#key item[title]} <!-- Wymusza pełne wyrenderowanie zwłasza po zmiane z pustego na tekst  -->
                    <span  id="__hd_list_ctrl_{item[item_key]}_Title" role="gridcell" tabindex="0"
                        use:editable={(text) => {change_name(text)}}
                        on:click={edit}> 
                            {element_title}
                    </span>
                    {/key}
                {/if}
            </p>

            <!--div class="flex flex-row justify-between text-xs flex-none w-1/2 sm:w-2/3"-->
            <div class="text-xs flex-none w-1/2 sm:w-2/3 grid-{definition.properties.length}">
                {#each definition.properties as prop, prop_index}
                    <p class="col-span-1 w-full mr-auto mt-0.5">
                        {#if item[prop.a] || placeholder == prop.name}
                            <span role="gridcell" tabindex="0">
                                {#if prop.type == rList_property_type.Date}
                                    <DatePicker self={item} 
                                                a={prop.a}
                                                compact={true}
                                                on_select={prop.on_select}
                                                s="xs"
                                                in_context="props sel"
                                                bind:this={props[prop_index]}
                                                changed={(value)=>{on_date_changed(value, prop.a)}}
                                    />
                                {:else if prop.type == rList_property_type.Combo}
                                    <Combo  self={item} 
                                            in_context="props sel" 
                                            compact={true} 
                                            a={prop.a}
                                            on_select={prop.on_select}
                                            is_association={prop.association}
                                            icon={false} 
                                            bind:this={props[prop_index]}
                                            definition={prop.combo_definition}
                                            changed={(key,name)=>{on_combo_changed(key, name, prop)}}
                                            s='xs'/>
                                {:else if prop.type == rList_property_type.Static}
                                    <span class="dark:text-white text-gray-400 truncate px-2.5 bg-slate-900/10 dark:bg-slate-100/10 rounded-lg">
                                        {item[prop.a]}
                                    </span>
                                {/if}
                            </span>
                        {/if}
                    </p>
                {/each}
            </div>
        </div>

        {#if summary && (item[summary] || placeholder=='Summary')}
            {@const element_id = `__hd_list_ctrl_${item[item_key]}_Summary`}
            <p class="  sm:text-xs sm:min-h-[1rem]
                        text-base min-h-[1.5rem]
                        text-slate-400 " 
                    on:click={(e) => edit_row_property(e, 'bottom')}>
                {#if definition.summary_readonly}
                    <span   id={element_id} role="gridcell" tabindex="0">
                        {item[summary]}
                    </span>
                {:else if item[summary]}
                    <span   id={element_id} role="gridcell" tabindex="0"
                            use:editable={(text) => {change_summary(text)}}
                            on:click={edit}>
                        {item[summary]}
                    </span>
                {:else if placeholder == 'Summary'}
                    <span   id={element_id}
                            use:editable={(text) => {change_summary(text)}}>
                    </span>
                {/if}
                
            </p>
        {/if}
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