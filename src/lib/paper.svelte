<script>
    export let margins = "md"
    let additionalClass = $$props.class ?? ''
</script>

<div class="    paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                max-w-3xl
                sm:min-h-[32rem]

                mx-0 mb-64 px-3 pt-2 pb-10
                sm:mt-4 sm:px-10

                md:px-16 md:mx-auto

                sm:rounded

                bg-white dark:bg-stone-900

                sm:shadow-xl sm:shadow-slate-700/10
                sm:dark:shadow-black/80

                sm:outline sm:outline-1 sm:outline-stone-500
                ">
    <slot/>
</div>