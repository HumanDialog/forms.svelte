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

    import { isDeviceSmallerThan } from '../../../utils'
    import Circle from '../../ricons/circle.svelte'
    import CircleCheck from '../../ricons/circle-check.svelte'
    import Ricon from  '../../r.icon.svelte'
    //import {get_ricon} from  '../../ricons.js'
    import Spinner from '../../delayed.spinner.svelte'

    import {rList_definition, rList_property_type} from '../List'
	import { push, link } from 'svelte-spa-router';
    import {FaExternalLinkAlt, FaRegCircle, FaRegCheckCircle} from 'svelte-icons/fa/'
    import Tags from '../../tags.svelte'
    import {ext} from '../../../i18n'

    export let item     :object;

    export let element_title    :string = '';

    export let list_properties:  object | undefined = undefined;

    export let typename :string | undefined = undefined;
    export let toolbarOperations = undefined;
    export let contextMenu = undefined;
    export let multiselectOperations = (items) => []

    export let key: string = '';
    export let selectionKey = 'props'
    export let multiselect:  boolean = false
    export let layout_demo_mode: boolean = false
    export let show_prev_interface: boolean = false

    let definition :rList_definition = getContext("rList-definition");
    //console.log(definition.list_properties, item)

    let placeholder :string = '';
    let props_sm;
    let props_md;
    let summary  :string = '';


    $: is_row_active = calculate_active(item, $contextItemsStore)
    $: is_row_selected = selected(item, $contextItemsStore)

    $: selected_class = is_row_selected ? "!border-blue-300 dark:!border-blue-300/50" : "";
    $: focused_class = is_row_active ? "bg-stone-200 dark:bg-stone-700" : "";
    $: download = is_row_active && (definition.downloadable || (definition.downloadableFunc ? definition.downloadableFunc(item) : false))
    $: is_link_like = is_row_active && (!!definition.title_href || !!definition.title_href_func || download)

    $: demo_element_class = is_row_active ?  "pl-8 bg-stone-700" : "pl-8"
    $: multiselect_class =  is_row_active ?  "pl-16 rounded bg-stone-600 outline outline-4 outline-stone-600 " : "pl-16"



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


    element_title = list_properties?.context[item.$type]?.Title;
    if(!element_title)
        element_title = list_properties?.element?.Title;

    summary = list_properties?.context[item.$type]?.Summary;
    if(!summary)
        summary = list_properties?.element?.Summary;

    let element_href = item[list_properties.element.href];


    let element_icon     :string = get_element_icon(list_properties, item);

    function get_element_icon(properties, item)
    {
        let element_icon = ""
        element_icon = list_properties?.context[item.$type]?.icon;
        if(!element_icon)
            element_icon = list_properties?.element?.icon;

        if(element_icon)
        {
            if(element_icon[0]!='#')
                element_icon = item[element_icon]
            else
                element_icon = element_icon.substr(1)
        }

        if(!element_icon)
            element_icon = 'turtle'
        return element_icon
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


    async function change_property(property_name, value)
    {
        item[property_name] = value
        informModification(item, property_name, typename);
        pushChanges();
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
        if(field == element_title)
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
        //let element_id = `__hd_list_ctrl_${getItemKey(item)}_${field}`;
        let element_id = `__or_list_ctrl_${getItemKey(item)}_${field}`;
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
                //setSelectionAtEnd(element_node);
            }
        }
        else
        {
            element_node.focus();
            //setSelectionAtEnd(element_node);
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
<!-- svelte-ignore a11y-structure -->

{#if item}
{@const translated_element_title = ext(item[element_title])}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
{#if !is_row_active && !multiselect}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!---- INACTIVE PURE LAYOUT ----------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<figure class="pl-8"
        bind:this={rootElement}
        use:selectable={item}
        on:click={(e) => {activate_row(e, item)}}>
    <!-- comming soon - top info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>OCT-254</span>
            <span class="text-center"></span>
            <span class="text-right">15 listopad 25</span>
        </div>
    </figcaption>
    -------------------------------->
    <!--@el------------------------->
    <h4 class="-indent-8">
        <div class="inline-block w-4 h-4 ml-0 mr-4 align-baseline
                text-stone-700 dark:text-stone-400 ">
                <Ricon icon = {element_icon}/>
        </div>{translated_element_title}
    </h4>
    <!-- comming soon - middle info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>Andrzej</span>
            <span class="text-center"></span>
            <span class="text-right">Specyfikacje</span>
        </div>
    </figcaption>
    -------------------------------->

    {#if summary && item[summary]}
    <figcaption>
        {item[summary]}
    </figcaption>
    {/if}
</figure>

<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
{:else if multiselect}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------SPECIAL CASE - MULTISELECTION------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<div        bind:this={rootElement}
            use:selectable={item}
            on:click={onToggleMultiSelect}>
<figure class={multiselect_class} bind:this={rootElement}>
    <!-- comming soon - top info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>OCT-254</span>
            <span class="text-center"></span>
            <span class="text-right">15 listopad 25</span>
        </div>
    </figcaption>
    -------------------------------->
    <!--@el------------------------->
    <h4 class="-indent-16 "
        >
        <div class="inline-block w-4 h-4 ml-1 mr-1 py-0.5 align-baseline
                text-stone-700 dark:text-stone-400 ">
                {#if is_row_active}
                <CircleCheck size = "s"/>
                {:else}
                <Circle size = "s"/>
                {/if}
        </div>
        <div class="inline-block w-4 h-4 ml-0 mr-5 align-baseline
                text-stone-700 dark:text-stone-400 ">
                <!--Ricon icon={ClipboardMinus}/-->
                <Ricon icon = {element_icon} />
        </div>{translated_element_title}
        <div class="inline-block  w-4 h-4 ml-1 mr-1 py-0.5 align-baseline"> <Circle size = "s"/></div>
    </h4>
    <!-- comming soon - middle info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>Andrzej</span>
            <span class="text-center"></span>
            <span class="text-right">Specyfikacje</span>
        </div>
    </figcaption>
    -------------------------------->

    {#if summary && (item[summary] || placeholder=='Summary')}
    <figcaption>
        {item[summary]}
    </figcaption>
    {/if}
</figure>
</div>
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
{:else}
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<!------------------------------------------------------------------------------------------------->
<div        >

<figure class="pl-8

        bg-stone-300 dark:bg-stone-700
        outline outline-8
        outline-stone-300 dark:outline-stone-700
        ring-1 ring-offset-8
        ring-stone-300 dark:ring-stone-700
        "

        bind:this={rootElement}
        use:selectable={item}
        on:click={(e) => {activate_row(e, item)}}
        >
    <!-- comming soon - top info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>OCT-254</span>
            <span class="text-center"></span>
            <span class="text-right">15 listopad 25</span>
        </div>
    </figcaption> #active
    -------------------------------->
    <!--@el------------------------->
    {#if !download}
    <a  class="sm:hover:cursor-pointer"
        href={element_href} use:link>

    <h4 class="-indent-8 "
        id="__or_list_ctrl_{getItemKey(item)}_Title"
        use:editable={{
            action: (text) => {change_property(element_title, text)},
            active: false,
            readonly: definition.title_readonly,
            onSoftEnter: (text) => {change_name(text); editProperty('Summary')}
        }}>
        <div class="inline-block w-4 h-4 ml-0 mr-4 align-baseline
                text-stone-700 dark:text-stone-400 ">
                <Ricon icon={element_icon} />
        </div>{translated_element_title}
    </h4>
    </a>
    {:else}
    {/if}
    <!-- comming soon - middle info --
    <figcaption>
        <div class="grid gap-4 grid-cols-3 grid-rows-1">
            <span>Andrzej</span>
            <span class="text-center"></span>
            <span class="text-right">Specyfikacje</span>
        </div>
    </figcaption>
    -------------------------------->

    {#if summary && (item[summary])}
        <figcaption id="__or_list_ctrl_{getItemKey(item)}_Summary" use:editable={{
                    action: (text) => {change_property(summary, text)},
                    readonly: definition.summary_readonly,
                    onFinish: (d) => {placeholder='';},
                    active: true
                }}>{item[summary]}
        </figcaption>

    {:else if placeholder=='Summary'}
        <figcaption id="__or_list_ctrl_{getItemKey(item)}_Summary"
                    use:editable={{
                    action: (text) => {change_property(summary, text)},
                    readonly: definition.summary_readonly,
                    onFinish: (d) => {placeholder='';},
                    active: true
                }}>&nbsp;
        </figcaption>
    {/if}
</figure>
</div>



{/if}

{/if}
