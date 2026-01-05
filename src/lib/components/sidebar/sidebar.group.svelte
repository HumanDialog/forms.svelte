<script>
    import {FaChevronDown, FaChevronUp} from 'svelte-icons/fa'
    import {navAutoHide} from '../../utils'
    import {i18n} from '../../i18n'
    import {link, push} from 'svelte-spa-router'

    export let border = false;
    export let title = ''
    export let collapsable = false;
    export let onExpand = undefined
    export let moreHref = undefined

    let border_class = border ? " pt-4 mt-4 border-t border-stone-200 dark:border-stone-700" : "mt-6"
    let title_border = title ? border_class : ""
    let list_border = title ? "" : border_class
    let collapsed = true;

    function toggleCollapsed()
    {
        if(collapsed && !!onExpand)
            onExpand();

        collapsed = !collapsed;
    }

    function on_link_clicked(e)
    {
        if(!e.target)
            return;

        let linkNode = e.target;
        while(linkNode && linkNode.tagName != 'A')
            linkNode = linkNode.parentElement;

        if(!linkNode)
            return;

        const href = linkNode.getAttribute('href');
        e.preventDefault();

        navAutoHide()
        redirect_to(href)
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

</script>

<hr class="my-0">
{#if title}
    <figure >
        {#if moreHref}

            <figcaption>
                <div class="grid gap-4 grid-cols-2 grid-rows-1">
                <span>{title}</span>
                <a href={moreHref} class="text-right" use:link on:click={on_link_clicked}>
                <span class="text-sky-500 text-right">
                        {i18n({en: 'More...', es: 'Más...', pl: 'Więcej...'})}
                </span>
                </a>
                </div>
            </figcaption>

        {:else}
            <figcaption >
                {title}
            </figcaption>
        {/if}
    </figure>

{/if}

<div >
    <slot/>
</div>
