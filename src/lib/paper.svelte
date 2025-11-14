<script>
    let additionalClass = $$props.class ?? ''
</script>

<section class="w-full flex flex-col items-center
                    sm:bg-white sm:dark:bg-stone-800/40 sm:shadow-slate-700/10 sm:dark:shadow-black/10 
                    sm:mt-6 sm:px-6 sm:py-12 sm:shadow-xl md:mx-auto sm:max-w-3xl sm:min-h-[32rem] sm:rounded
                    sm:ring-1 sm:ring-stone-900/5 sm:dark:ring-stone-950/20
                    {additionalClass}">
    <slot/>
</section>