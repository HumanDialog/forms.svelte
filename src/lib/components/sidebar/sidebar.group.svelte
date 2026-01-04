<script>
    import {FaChevronDown, FaChevronUp} from 'svelte-icons/fa'
    import {i18n} from '../../i18n'
    import {link} from 'svelte-spa-router'

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


</script>

<hr class="my-0">
{#if title}
    <figure >
        {#if moreHref}

            <figcaption>
                <div class="grid gap-4 grid-cols-2 grid-rows-1">
                <span>{title}</span>
                <a href={moreHref} class="text-right" use:link>
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
