<script>
    let additionalClass = $$props.class ?? ''
</script>

<section class="    kanban-paper sm:xtable
                    prose prose-base prose-zinc dark:prose-invert prose-a:no-underline

                    !max-w-none sm:min-h-[32rem]

                    sm:pt-8
                    px-4

                    md:px-8 md:mx-2
                ">


    <slot/>
</section>