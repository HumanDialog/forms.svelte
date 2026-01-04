
<script>
    export let href = "/";
    export let img = "";
    export let summary = "Current group";

    let user_class = $$props.class ?? "";

</script>

<figure>
    <h2 class="mb-5 {user_class}">
        <a href={href} class="">
            {#if img}
                <img src={img} class="h-6 mr-3 sm:h-7" alt="" />
            {/if}

            <span >
                <slot/>
            </span>
        </a>
    </h2>
    <figcaption>{summary}</figcaption>
</figure>