<script lang="ts">
    import {getContext, tick} from 'svelte'
    import Rfigure from '../r.figure.svelte'
    import Ricon from  '../r.icon.svelte'
    import {contextItemsStore, contextToolbarOperations} from '../../stores'
    import {FaBars, FaEllipsisV} from 'svelte-icons/fa'
    import {link, push} from 'svelte-spa-router'
    import {i18n} from '../../i18n'
    //import FaBars from 'svelte-icons/fa/FaBars.svelte'

    import {
        selectable as _selectable,
        isSelected,
        editable as _editable,
        handleSelect,

		activateItem,
        startEditing,
		getActive,

		navAutoHide

    } from "../../utils";

    import {showMenu} from '../menu'

    export let href :string;
    export let icon :string = 'cat';
    export let active = false;
    export let selectable :any|undefined = undefined;
    export let editable :any|undefined = undefined;
    export let operations :any|undefined = undefined;
    export let item :object|undefined = undefined;
    //export let summary :string;
    export let summary :string|object|undefined = undefined;
    export let iicon: string|object|undefined = undefined;



    let isOnPage :boolean = getContext('rIs-page-component');

    let summaryElement = null;
    let summaryPlaceholder :boolean = false;
    let summaryEditable :Function | object | undefined = undefined;

    $: context_data = $contextItemsStore;
    $: isRowActive = calculateIsRowActive($contextItemsStore)
    $: summaryText = calculateSummary(summary)
    $: activeClass = isRowActive ? 'bg-stone-200 dark:bg-stone-700 outline outline-8 outline-stone-200 dark:outline-stone-700 ring-1 ring-offset-8 ring-stone-300 dark:ring-stone-700' : ''

    $: icom = fetch_icon(item, icon, iicon);

    function fetch_icon(item, icon, iicon)
    {
        if(item && iicon)
            icon = item[iicon];

        if(!icon)
            icon = 'file-archive'
    }

    function calculateSummary(...args)
    {
        if(!summary)
        {
            summaryEditable = undefined;
            return "";
        }

        if(summary instanceof Object)
        {
            summaryEditable = summary.editable;
            if(summary.content)
                return summary.content;
            else
                return "";
        }
        else
        {
            summaryEditable = undefined;
            return summary;
        }
    }


    export async function editSummary()
    {
        if(!summaryEditable)
            return;

        if(!!summaryElement)
            startEditing(summaryElement, (d) => { summaryPlaceholder = false })
        else
        {
            summaryPlaceholder = true;
            await tick();
            startEditing(summaryElement, (d) => { summaryPlaceholder = false })
        }
    }

    export function updateSummary(txt)
    {
        console.log('updateSummary', txt)
        summaryText = txt
    }

    let user_class = $$props.class ?? ""
    let root;

    function calculateIsRowActive(...args)
    {
        if(!isOnPage)
            return active;

        if(!item)
            return active;

        const activeItem = getActive('props')   // hasActive
        if(item.$ref)
        {
            if(activeItem)
            {
                return item.$ref == activeItem.$ref
            }
            else
                return false;
        }
        else if(item.Id)
        {
            if(activeItem)
            {
                return item.Id == activeItem.Id
            }
            else
                return false;
        }
        else if(activeItem == item)
            return true;
        else
            return false;
    }

    function selectable_if_needed(node, selectable)
    {
        if(selectable)
            _selectable(node, selectable);
        else if(item)
            _selectable(node, item);
    }

    function selected(itm, context_data)
    {
        if(isSelected(itm))
            return true;
        else
            return false;
    }

    function editable_if_needed(node, editable)
    {
        if(editable)
            _editable(node, editable);
    }

    function on_link_clicked(e)
    {
        if(selectable)
            handleSelect(e);
        else if(item)
            handleSelect(e);


        if(!e.target)
            return;

        let linkNode = e.target;
        while(linkNode && linkNode.tagName != 'A')
            linkNode = linkNode.parentElement;

        if(!linkNode)
            return;

        const href = linkNode.getAttribute('href');
        e.preventDefault();

        if(isOnPage)
        {
            if(isRowActive)
            {
                redirect_to(href)
            }
        }
        else
        {
            navAutoHide()
            redirect_to(href)
        }
    }

    function redirect_to(href)
    {
        if(!href)
            return;

        let absolute_pattern = /^https?:\/\//i;
        if (!absolute_pattern.test(href))
            push(href);
        else
            window.location.href = href;
    }

    function on_contextmenu(e)
    {
        if(!operations)
            return;

        let operations_list = operations(root);
        if(!operations_list)
            return;

        if(operations_list.length == 0)
            return;

        showMenu(new DOMPoint(e.clientX, e.clientY), operations_list)

        e.preventDefault();
    }

    function can_show_context_menu(itm, context_data)
    {
        if(isOnPage)
            return false;

        if(!selected(itm, context_data))
            return false;

        if(!operations)
            return false;

        return true;
    }

    function on_show_menu(e)
    {
        let owner = e.target;
        while(owner && owner.tagName != 'BUTTON')
            owner = owner.parentElement

        if(!owner)
            return;

        let rect = owner.getBoundingClientRect()

        let operations_list = operations(root);

        if(!operations_list)
            return;

        if(operations_list.length == 0)
            return;

        showMenu(rect, operations_list)
    }


</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-structure -->

<!-- isRowActive -->
<figure class="pl-8 {activeClass}" bind:this={root}>
    <a  on:click={on_link_clicked}
                                href={href}
                                use:link>
    <h4 class="-indent-8">
        <div class="inline-block w-4 h-4 ml-0 mr-3 align-baseline
                    text-stone-700 dark:text-stone-400 ">
            <Ricon icon = {icon}/>
        </div>
        <slot/>
    </h4>
    </a>
    {#if summaryText}
        <figcaption>
            {summaryText}
        </figcaption>
    {/if}

</figure>
