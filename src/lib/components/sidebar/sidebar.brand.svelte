
<script>
    export let href = "/";
    export let img = "";

    let user_class = $$props.class ?? "";

</script>

<section class="mb-5 {user_class}">
    <a href={href} class="flex items-center pl-2.5 ">
        {#if img}
            <img src={img} class="h-6 mr-3 sm:h-7" alt="" />
        {/if}

        <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            <slot/>
        </span>
    </a>
    {#if $$slots.summary}
        <slot name="summary"/>
    {/if}
</section>