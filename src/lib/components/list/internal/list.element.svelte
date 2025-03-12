<script lang="ts">
    import {tick, getContext} from 'svelte'
    import {contextItemsStore} from '../../../stores'
    import {
            isSelected, 
            selectable, 
            activateItem, 
            isActive, 
            editable, 
            startEditing, 
    } from '../../../utils'

    import {showGridMenu, showMenu} from '../../menu'
    import {pushChanges, informModification} from '../../../updates'
    import Summary from './list.element.summary.svelte'
    import Properties from './list.element.props.svelte'
    import { isDeviceSmallerThan } from '../../../utils'
                
    import {rList_definition, rList_property_type} from '../List'
	import { push } from 'svelte-spa-router';
    import {FaExternalLinkAlt} from 'svelte-icons/fa/'
	import { readonly } from 'svelte/store';
    
    export let item     :object;

    export let title    :string = '';
    export let summary  :string = '';
    
    export let typename :string | undefined = undefined;
    export let toolbarOperations;
    export let contextMenu;

    let definition :rList_definition = getContext("rList-definition");
    //console.log(definition.properties, item)

    let placeholder :string = '';
    let props_sm;
    let props_md;
    
    $: is_row_active = calculate_active(item, $contextItemsStore)
    $: is_row_selected = selected(item, $contextItemsStore)

    $: selected_class = is_row_selected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focused_class = is_row_active ? "bg-stone-200 dark:bg-stone-700" : "";
    $: is_link_like = is_row_active && (!!definition.title_href || !!definition.title_href_func)

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

    let [name_w, props_w] = calc_horz_division();
    function calc_horz_division()
    {
        const props_no = definition.properties.length
        switch(props_no)
        {
        case 0:
            return ['w-full', ''];
        case 1:
            return ['w-2/3', 'w-1/3']
        case 2:
            return ['w-2/3', 'w-1/3']
        case 3:
            return ['w-1/2', 'w-1/2']
        default:
            return ['w-1/3', 'w-2/3']
        }
    }
            

    function calculate_active(...args)
    {
        return isActive('props', item)
    }

    function selected(...args)
    {
        return isSelected(item)
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
            informModification(item, title, typename);
            pushChanges();
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
            informModification(item, summary, typename);
            pushChanges();
        }
    }

    function edit(e)
    {
        if(!is_row_active)
            return;

        startEditing(e.target);
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

        if(can_show_context_menu && contextMenu)
        {
            const pt = new DOMPoint(e.clientX, e.clientY)

            let context_operations = contextMenu(item);
            if(context_operations !== null)
            {
                if(typeof context_operations === 'object')
                {
                    if(Array.isArray(context_operations))
                        showMenu(pt, context_operations);
                    else if(context_operations.grid)
                        showGridMenu(pt, context_operations.grid); 
                }
            }
        }
        else if(click_on_empty_space)
        {
            if(definition.title_href || definition.title_href_func)
            {
                //followDefinedHRef();
            }
            else
            {
            /*    if((part == 'top') && !definition.title_readonly)
                    force_editing('Title')
                else if((part == 'bottom') && !definition.summary_readonly)
                    force_editing('Summary')
            */
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

    function followDefinedHRef()
    {
        let link: string = getHRef();
        if(link)
            push(link);
    }

    function getHRef(): string
    {
        if(definition.title_href)
            return definition.title_href;
        else if(definition.title_href_func)
            return definition.title_href_func(item);
        else
            return '';
    }

    function activate_row(e, item)
    {
        activateItem('props', item, toolbarOperations(item));
        
        if(e)
            e.stopPropagation();
    }

    



    function on_contextmenu(e)
    {
        if(!contextMenu)
            return;

        const pt = new DOMPoint(e.clientX, e.clientY)

        let context_operations = contextMenu(item);
        if(context_operations !== null)
        {
            if(typeof context_operations === 'object')
            {
                if(Array.isArray(context_operations))
                    showMenu(pt, context_operations);
                else if(context_operations.grid)
                    showGridMenu(pt, context_operations.grid); 
            }
        }
        
        e.preventDefault();
    }

    

    export function editProperty(field :string)
    {
        if(field == title)
            force_editing('Title')
        else if(field == summary)
            force_editing('Summary')
        else
        {
            if(isDeviceSmallerThan("sm"))
                props_sm.editProperty(field);
            else
                props_md.editProperty(field);
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

        if(field == 'Title')
        {
            if(is_link_like)
            {
                startEditing(element_node, () => { placeholder='' });
            }
            else
            {
                element_node.focus();
                setSelectionAtEnd(element_node);
            }
        }
        else
        {
            element_node.focus();
            setSelectionAtEnd(element_node);
        }

        
    }

    function setSelectionAtEnd(element: HTMLElement)
    {
        const textNode = element.childNodes[0]
        const text = textNode.textContent;

        let range = document.createRange();
        let end_offset = text.length;
        let end_container = textNode;
        range.setStart(end_container, end_offset)
        range.setEnd(end_container, end_offset)
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }

    let rootElement;
    export function scrollToView()
    {
        rootElement.scrollIntoView(
            {
                behavior: "smooth",
                block: "nearest",
                inline: "nearest"
            });
    }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if item}
{@const element_title = item[title]}

<section    class="my-1 flex flex-row my-0  w-full  text-stone-700 dark:text-stone-300 cursor-default rounded-md border border-transparent {selected_class} {focused_class} scroll-mt-[50px] sm:scroll-mt-[40px]"
            on:contextmenu={on_contextmenu}
            role="menu"
            tabindex="-1"
            bind:this={rootElement}>

    <slot name="left" element={item}/>
    
    <i class="hidden sm:w-1/2 sm:w-2/3 sm:w-1/3"></i>   <!-- just to force tailwind classes including -->
    
    <div    class="ml-3 w-full py-0" 
            use:selectable={item} 
            on:click={(e) => {activate_row(e, item)}} 
            role="row" 
            tabindex="0">
        <div class="block sm:flex sm:flex-row" on:click={(e) => on_active_row_clicked(e, 'top')}>
           
            {#if is_row_active}
                {#key item[title]}      <!-- Wymusza pełne wyrenderowanie zwłasza po zmiane z pustego na tekst  -->
                    {#if is_link_like}
                        <p  class=" text-base font-semibold 
                                   
                                    whitespace-nowrap overflow-clip w-full sm:flex-none sm:{name_w}
                                    sm:hover:cursor-pointer underline"
                                    id="__hd_list_ctrl_{item[item_key]}_Title"
                                    on:click|stopPropagation={followDefinedHRef}
                                    use:editable={{
                                        action: (text) => {change_name(text)},
                                        active: false,
                                        readonly: definition.title_readonly,
                                        onSoftEnter: (text) => {change_name(text); editProperty('Summary')}
                                    }}
                            > 
                            {element_title}
                        </p>
                    {:else}
                        <p  class=" text-base font-semibold 
                                    
                                    whitespace-nowrap overflow-clip w-full sm:flex-none sm:{name_w}"
                            id="__hd_list_ctrl_{item[item_key]}_Title"
                            use:editable={{
                                action: (text) => {change_name(text)},
                                active: true,
                                readonly: definition.title_readonly,
                            }}> 
                                {element_title}

                            {#if definition.onOpen}
                                <button class="ml-3 w-5 h-5 sm:w-3 sm:h-3"
                                        on:click={(e) => definition.onOpen(item)}>
                                    <FaExternalLinkAlt/>
                                </button>
                            {/if}
                        </p>
                    {/if}
                {/key}
            {:else}
                <p  class=" text-base font-semibold 
                             
                            whitespace-nowrap overflow-clip w-full sm:flex-none sm:{name_w}"
                    id="__hd_list_ctrl_{item[item_key]}_Title"> 
                    {element_title}
                </p>
            {/if}
           

            <section class="hidden sm:block w-full sm:flex-none sm:{props_w}">
                <Properties {definition} {item} {placeholder} bind:this={props_md}/>
            </section>
        </div>

        {#if summary && (item[summary] || placeholder=='Summary')}
            {@const element_id = `__hd_list_ctrl_${item[item_key]}_Summary`}
            {#key item[summary] }           
                {#if is_row_active}
                    <p  id={element_id} 
                        class=" text-sm   mt-1  mb-2                          
                                text-stone-400"
                            use:editable={{
                                action: (text) => {change_summary(text)},
                                readonly: definition.summary_readonly,
                                onFinish: (d) => {placeholder='';},
                                active: true
                            }}>
                        {item[summary]}
                    </p>
                {:else}
                    <p  id={element_id} 
                        class=" text-sm mt-1 mb-2
                                    text-stone-400"
                        on:click={(e) => on_active_row_clicked(e, 'bottom')}>
                        {item[summary]}
                    </p>
                {/if}
            {/key}
                
        {/if}

        <section class="block sm:hidden w-full">
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