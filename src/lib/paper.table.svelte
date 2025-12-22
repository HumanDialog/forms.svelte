<script>
    let additionalClass = $$props.class ?? ''
</script>

<section class="    paper w-full
                    prose prose-base prose-zinc dark:prose-invert prose-a:no-underline
                    sm:max-w-none sm:min-h-[32rem]

                    m-0 mb-64 px-2 pt-2 pb-32

                    m-0 mb-64 px-2 pt-2 pb-32
                    sm:mt-4 sm:px-4
                    md:px-10 md:mx-2

                    sm:rounded

                    sm:bg-white sm:dark:bg-stone-800/40 sm:shadow-xl sm:shadow-slate-700/10 sm:dark:shadow-black/100

                    sm:ring-1 sm:ring-stone-900/5 sm:dark:ring-stone-950/20
                    {additionalClass}">


    <slot/>
</section>