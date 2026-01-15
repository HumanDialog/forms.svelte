<script>
    let additionalClass = $$props.class ?? ''
</script>

<section class="    kanban-paper sm:xtable
                    prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                    !max-w-none sm:min-h-[32rem]

                    m-0 mb-64 px-2 pt-2 pb-0

                    sm:mt-4 sm:xpx-4
                    md:xpx-10 md:mx-2

                    sm:rounded

                sm:rounded

                bg-white dark:bg-stone-900

                sm:shadow-xl sm:shadow-slate-700/10
                sm:dark:shadow-black/80

                sm:outline sm:outline-1 sm:outline-stone-500">


    <slot/>
</section>