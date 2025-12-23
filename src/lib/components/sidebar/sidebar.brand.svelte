
<script>
    export let href = "/";
    export let img = "";

    let user_class = $$props.class ?? "";

</script>

<h1 class="mb-5 {user_class}">
    <a href={href} class="">
        {#if img}
            <img src={img} class="h-6 mr-3 sm:h-7" alt="" />
        {/if}

        <span >
            <slot/>
        </span>
    </a>
    {#if $$slots.summary}
        <slot name="summary"/>
    {/if}
</h1>