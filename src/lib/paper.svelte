<script>
    export let margins = "md"
    let additionalClass = $$props.class ?? ''
</script>

<div class="    paper w-full max-w-3xl sm:min-h-[32rem]

                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                mx-0 mb-20 px-3 pt-2 pb-10

                sm:mt-8

                md:px-16 md:mx-auto

                sm:rounded

                bg-stone-50 dark:bg-stone-900

                md:shadow-xl md:shadow-slate-700/10
                md:dark:shadow-black/80

                md:outline md:outline-1 md:outline-stone-500
                ">
    <slot/>
</div>