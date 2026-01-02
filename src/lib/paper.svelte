<script>
    export let margins = "md"
    let additionalClass = $$props.class ?? ''
</script>

<div class="    paper w-full
                prose prose-base prose-zinc dark:prose-invert prose-a:no-underline
                sm:max-w-3xl
                sm:min-h-[32rem]

                m-0 mb-64 px-2 pt-2 pb-32
                sm:mt-4 sm:px-10
                md:px-16 md:mx-auto

                sm:rounded

                sm:bg-white sm:dark:bg-stone-800/40

                sm:shadow-xl sm:shadow-slate-700/10
                sm:dark:shadow-black/80

                outline outline-1 outline-stone-500
                ">
    <slot/>
</div>