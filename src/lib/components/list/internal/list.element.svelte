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
            addActiveItem,
            removeActiveItem, 
    } from '../../../utils'

    import {showGridMenu, showMenu} from '../../menu'
    import {pushChanges, informModification} from '../../../updates'
    import Summary from './list.element.summary.svelte'
    import Properties from './list.element.props.svelte'
    import { isDeviceSmallerThan } from '../../../utils'
    import Icon from '../../icon.svelte'
    import Spinner from '../../delayed.spinner.svelte'
                
    import {rList_definition, rList_property_type} from '../List'
	import { push, link } from 'svelte-spa-router';
    import {FaExternalLinkAlt, FaRegSquare, FaRegCheckSquare} from 'svelte-icons/fa/'
    import Tags from '../../tags.svelte'
    import {ext} from '../../../i18n'
    
    export let item     :object;

    export let title    :string = '';
    export let summary  :string = '';
    
    export let typename :string | undefined = undefined;
    export let toolbarOperations = undefined;
    export let contextMenu = undefined;
    export let multiselectOperations = (items) => []
    
    export let key: string = '';
    export let selectionKey = 'props'
    export let multiselect:  boolean = false

    let definition :rList_definition = getContext("rList-definition");
    //console.log(definition.properties, item)

    let placeholder :string = '';
    let props_sm;
    let props_md;
    
    $: is_row_active = calculate_active(item, $contextItemsStore)
    $: is_row_selected = selected(item, $contextItemsStore)

    $: selected_class = is_row_selected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focused_class = is_row_active ? "bg-stone-200 dark:bg-stone-700" : "";
    $: download = is_row_active && (definition.downloadable || (definition.downloadableFunc ? definition.downloadableFunc(item) : false))
    $: is_link_like = is_row_active && (!!definition.title_href || !!definition.title_href_func || download)

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

    /*let item_key :string = ''
    let keys = Object.keys(item);
    if(keys.includes('$ref'))
        item_key = '$ref';
    else if(keys.includes('Id'))
        item_key = 'Id'
    else if(keys.length > 0)
        item_key = keys[0];
    */

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
        const key = getItemKeyName(item)
        const active = isActive(selectionKey, item, key)
       return active

    }

    function selected(...args)
    {
        return isSelected(item)
    }

    function getItemKey(item: object): string | number
    {
        if(key)
            return item[key];
        else if(item.$ref)
            return item.$ref;
        else if(item.Id)
            return item.Id;
        else 
            return 0;
    }

    function getItemKeyName(item: object): string
    {
        if(key)
            return key;
        else
        {
            const keys = Object.keys(item)        
            if(keys.findIndex(e => e == '$ref') >= 0)
                return '$ref'
            else if(keys.findIndex(e => e == 'Id') >= 0)
                return 'Id'
            else
                return ''
        }
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
        const openable = !!definition.title_href || !!definition.title_href_func
        if(toolbarOperations)
        {
            if(multiselect)
                activateItem(selectionKey, item, multiselectOperations);
            else
                activateItem(selectionKey, item, toolbarOperations(item));
            
            if(e)
                e.stopPropagation();
        }
        else// if(openable)
        {
            activateItem(selectionKey, item, []);
            
            if(e)
                e.stopPropagation();
        }
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
        let element_id = `__hd_list_ctrl_${getItemKey(item)}_${field}`;
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

    function onToggleMultiSelect(e)
    {
        if(!is_row_active)
            addActiveItem(selectionKey, item, multiselectOperations)
        else
            removeActiveItem(selectionKey, item, multiselectOperations)

        if(e)
            e.stopPropagation();
    }

    let isDownloading = false
    async function onDownloadFile(e)
    {
        isDownloading = true

        e.preventDefault();
        e.stopPropagation();

        if(definition.onOpen)
            await definition.onOpen(item)

        isDownloading = false
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
{#if item}
{@const element_title = ext(item[title])}

<section    class="my-1 flex flex-row w-full  text-stone-900 dark:text-stone-300 cursor-default rounded-md border border-transparent {selected_class} {focused_class} scroll-mt-[50px] sm:scroll-mt-[40px]"
            role="menu"
            tabindex="-1"
            bind:this={rootElement}> <!--  on:contextmenu={on_contextmenu} -->

    {#if multiselect}
        {@const icon=is_row_active ? FaRegCheckSquare : FaRegSquare}
         <Icon  component={icon} 
                class="flex-none h-5 w-5 sm:h-4 sm:w-4 text-stone-500 dark:text-stone-400 cursor-pointer mt-2 sm:mt-1.5 ml-2 mr-3 "
                on:click={onToggleMultiSelect}/>
    {/if}
    
    {#if isDownloading}
        <Spinner class="mt-0.5  ml-2  mr-1" size={5} delay={0}/>
    {:else}
        <slot name="left" element={item}/>
    {/if}
    
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
                                   
                                    whitespace-nowrap overflow-clip w-full sm:flex-none sm:{name_w}"
                                    id="__hd_list_ctrl_{getItemKey(item)}_Title"
                                    use:editable={{
                                        action: (text) => {change_name(text)},
                                        active: false,
                                        readonly: definition.title_readonly,
                                        onSoftEnter: (text) => {change_name(text); editProperty('Summary')}
                                    }}
                            >  <!--on:click|stopPropagation={followDefinedHRef}-->
                            {#if download}
                                <a  class="sm:hover:cursor-pointer underline" 
                                    download
                                    href={getHRef()}
                                    on:click={onDownloadFile}>
                                    {element_title}
                                </a>
                            {:else}
                                <a  class="sm:hover:cursor-pointer underline" 
                                    href={getHRef()} use:link>
                                    {element_title}
                                </a>
                            {/if}
                        </p>
                    {:else}
                        <p  class=" text-base font-semibold 
                                    
                                    whitespace-nowrap overflow-clip w-full sm:flex-none sm:{name_w}"
                            id="__hd_list_ctrl_{getItemKey(item)}_Title"
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
                    id="__hd_list_ctrl_{getItemKey(item)}_Title"> 
                    {element_title}
                </p>
            {/if}
           

            <section class="hidden sm:block w-full sm:flex-none sm:{props_w}">
                <Properties {definition} {item} {placeholder} bind:this={props_md}/>
            </section>
        </div>

        <section class="block sm:hidden w-full">
            <Properties {definition} {item} {placeholder} bind:this={props_sm}/>
        </section>

        {#if summary && (item[summary] || placeholder=='Summary')}
            {@const summaryText = ext(item[summary])}
            {@const element_id = `__hd_list_ctrl_${getItemKey(item)}_Summary`}
            {#key summaryText }           
                {#if is_row_active}
                    <p  id={element_id} 
                        class=" text-sm                              
                                text-stone-600 dark:text-stone-400"
                            use:editable={{
                                action: (text) => {change_summary(text)},
                                readonly: definition.summary_readonly,
                                onFinish: (d) => {placeholder='';},
                                active: true
                            }}>
                        {summaryText}
                    </p>
                {:else}
                    <p  id={element_id} 
                        class=" text-sm 
                                    text-stone-600 dark:text-stone-400"
                        on:click={(e) => on_active_row_clicked(e, 'bottom')}>
                        {summaryText}
                    </p>
                {/if}
            {/key}
                
        {/if}

        {#if definition.tags}
                <Tags
                    class="mt-1 mb-1"
                    compact
                    inContext="props"
                    self={item}
                    a={definition.tags.a}
                    getGlobalTags={definition.tags.getAllTags}
                    s="sm"
                    onSelect={definition.tags.onSelect}
                    onUpdateAllTags={definition.tags.onUpdateAllTags}
                    canChangeColor={definition.tags.canChangeColor}
                    readOnly={definition.tags.readOnly}
                />
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